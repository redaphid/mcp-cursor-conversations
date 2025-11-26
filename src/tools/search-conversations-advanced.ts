import { queryAll, KEY_PATTERNS } from '../core/index.js'
import { getConversationSummary, getBubbleData } from './helpers.js'

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
  `, [`${KEY_PATTERNS.COMPOSER_DATA}%`])

  const results: any[] = []

  for (const row of rows) {
    if (!row.value || row.value === 'null') continue

    try {
      const parsed = JSON.parse(row.value)
      parsed.composerId = row.key.slice(KEY_PATTERNS.COMPOSER_DATA.length)

      const summary = getConversationSummary(parsed, (composerId, bubbleId) =>
        getBubbleData(composerId, bubbleId)
      )

      // Apply filters
      const lastMessageDate = new Date(summary.updatedAt)

      if (date_from && lastMessageDate < new Date(date_from)) continue
      if (date_to && lastMessageDate > new Date(date_to)) continue
      if (min_messages && summary.messageCount < min_messages) continue
      if (max_messages && summary.messageCount > max_messages) continue
      if (status !== 'all' && summary.status !== status) continue

      results.push({
        composer_id: parsed.composerId,
        message_count: summary.messageCount,
        last_message_date: summary.updatedAt,
        status: summary.status,
        preview: summary.preview
      })
    } catch {
      continue
    }
  }

  // Sort results
  results.sort((a, b) => {
    let comparison = 0

    if (sort_by === 'date') {
      comparison = new Date(a.last_message_date).getTime() - new Date(b.last_message_date).getTime()
    } else if (sort_by === 'message_count') {
      comparison = a.message_count - b.message_count
    } else if (sort_by === 'status') {
      comparison = (a.status || '').localeCompare(b.status || '')
    }

    return sort_order === 'desc' ? -comparison : comparison
  })

  return {
    total_found: results.length,
    returned: Math.min(results.length, limit),
    conversations: results.slice(0, limit)
  }
}
