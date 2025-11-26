import { queryAll, KEY_PATTERNS } from '../core/index.js'
import { getConversationSummary, getMessageData } from './helpers.js'

export interface AdvancedSearchOptions {
  date_from?: string
  date_to?: string
  min_messages?: number
  max_messages?: number
  status?: 'completed' | 'aborted' | 'all'
  sort_by?: 'date' | 'message_count' | 'status'
  sort_order?: 'asc' | 'desc'
  limit?: number
}

export const searchConversationsAdvanced = async (options: AdvancedSearchOptions = {}) => {
  const {
    date_from,
    date_to,
    min_messages,
    max_messages,
    status = 'all',
    sort_by = 'date',
    sort_order = 'desc',
    limit = 20
  } = options

  const rows = queryAll<{ key: string; value: string }>(`
    SELECT key, value
    FROM cursorDiskKV
    WHERE key LIKE ?
  `, [`${KEY_PATTERNS.CONVERSATION}%`])

  const results: any[] = []

  for (const row of rows) {
    if (!row.value || row.value === 'null') continue

    try {
      const parsed = JSON.parse(row.value)
      const conversationId = row.key.slice(KEY_PATTERNS.CONVERSATION.length)

      const summary = getConversationSummary(
        { ...parsed, conversationId },
        (convId, msgId) => getMessageData(convId, msgId)
      )

      const lastMessageDate = new Date(summary.updatedAt)

      if (date_from && lastMessageDate < new Date(date_from)) continue
      if (date_to && lastMessageDate > new Date(date_to)) continue
      if (min_messages && summary.messageCount < min_messages) continue
      if (max_messages && summary.messageCount > max_messages) continue
      if (status !== 'all' && summary.status !== status) continue

      results.push({
        conversationId,
        messageCount: summary.messageCount,
        lastMessageDate: summary.updatedAt,
        status: summary.status,
        preview: summary.preview
      })
    } catch {
      continue
    }
  }

  results.sort((a, b) => {
    let comparison = 0

    if (sort_by === 'date') {
      comparison = new Date(a.lastMessageDate).getTime() - new Date(b.lastMessageDate).getTime()
    } else if (sort_by === 'message_count') {
      comparison = a.messageCount - b.messageCount
    } else if (sort_by === 'status') {
      comparison = (a.status || '').localeCompare(b.status || '')
    }

    return sort_order === 'desc' ? -comparison : comparison
  })

  return {
    totalFound: results.length,
    returned: Math.min(results.length, limit),
    conversations: results.slice(0, limit)
  }
}
