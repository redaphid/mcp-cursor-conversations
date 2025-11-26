import { queryAll, KEY_PATTERNS } from '../core/index.js'
import { getConversationSummary, getMessageData } from './helpers.js'

export const searchConversations = async (query: string, limit: number = 20) => {
  const rows = queryAll<{ key: string; value: string }>(`
    SELECT key, value
    FROM cursorDiskKV
    WHERE key LIKE ?
  `, [`${KEY_PATTERNS.CONVERSATION}%`])

  const results: any[] = []
  const lowerQuery = query.toLowerCase()

  for (const row of rows) {
    if (!row.value || row.value === 'null') continue

    try {
      const parsed = JSON.parse(row.value)
      const conversationId = row.key.slice(KEY_PATTERNS.CONVERSATION.length)

      const summary = getConversationSummary(
        { ...parsed, conversationId },
        (convId, msgId) => getMessageData(convId, msgId)
      )

      const matches: any[] = []

      summary.messages.forEach((msg, index) => {
        if (msg.text?.toLowerCase().includes(lowerQuery)) {
          matches.push({
            type: msg.type,
            text: msg.text.substring(0, 200) + (msg.text.length > 200 ? '...' : ''),
            index
          })
        }
      })

      if (matches.length > 0) {
        results.push({
          conversationId,
          messageCount: summary.messageCount,
          preview: summary.messages[0]?.text?.substring(0, 100) || 'No preview available',
          status: parsed.status || 'completed',
          createdAt: parsed.createdAt,
          updatedAt: parsed.lastUpdatedAt || parsed.createdAt,
          matches: matches.slice(0, 3)
        })
      }

      if (results.length >= limit) break
    } catch {
      continue
    }
  }

  return results
}
