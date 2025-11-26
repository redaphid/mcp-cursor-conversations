import { queryAll, queryCount, KEY_PATTERNS } from '../core/index.js'
import { getConversationSummary, getBubbleData } from './helpers.js'

export interface ListConversationsOptions {
  limit?: number
  offset?: number
  sortBy?: 'recent_activity' | 'created' | 'updated'
  sortOrder?: 'asc' | 'desc'
}

export const listConversations = async (options: ListConversationsOptions = {}) => {
  const {
    limit = 50,
    offset = 0,
    sortBy = 'recent_activity',
    sortOrder = 'desc'
  } = options

  // Get total count
  const totalCount = queryCount(`
    SELECT COUNT(*) as count
    FROM cursorDiskKV
    WHERE key LIKE ?
  `, [`${KEY_PATTERNS.COMPOSER_DATA}%`])

  // Build ORDER BY clause
  let orderByClause: string
  switch (sortBy) {
    case 'created':
      orderByClause = `json_extract(value, '$.createdAt') ${sortOrder.toUpperCase()}`
      break
    case 'updated':
      orderByClause = `json_extract(value, '$.updatedAt') ${sortOrder.toUpperCase()}`
      break
    case 'recent_activity':
    default:
      orderByClause = `COALESCE(json_extract(value, '$.updatedAt'), json_extract(value, '$.createdAt')) ${sortOrder.toUpperCase()}`
      break
  }

  const rows = queryAll<{ key: string; value: string }>(`
    SELECT key, value
    FROM cursorDiskKV
    WHERE key LIKE ?
    ORDER BY ${orderByClause}
    LIMIT ? OFFSET ?
  `, [`${KEY_PATTERNS.COMPOSER_DATA}%`, limit, offset])

  const conversations = []

  for (const row of rows) {
    if (!row.value || row.value === 'null') continue

    try {
      const parsed = JSON.parse(row.value)
      parsed.composerId = row.key.slice(KEY_PATTERNS.COMPOSER_DATA.length)

      const summary = getConversationSummary(parsed, (composerId, bubbleId) =>
        getBubbleData(composerId, bubbleId)
      )

      conversations.push({
        composerId: parsed.composerId,
        messageCount: summary.messageCount,
        preview: summary.preview,
        status: summary.status,
        createdAt: parsed.createdAt,
        updatedAt: summary.updatedAt
      })
    } catch {
      continue
    }
  }

  return {
    conversations,
    total: totalCount
  }
}
