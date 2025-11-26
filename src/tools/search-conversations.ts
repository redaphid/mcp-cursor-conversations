import { queryAll, KEY_PATTERNS } from '../core/index.ts'
import { getConversationSummary, getBubbleData } from './helpers.ts'

export const searchConversations = async (query: string, limit: number = 20) => {
  const rows = queryAll<{ key: string; value: string }>(`
    SELECT key, value
    FROM cursorDiskKV
    WHERE key LIKE ?
  `, [`${KEY_PATTERNS.COMPOSER_DATA}%`])

  const results: any[] = []
  const lowerQuery = query.toLowerCase()

  for (const row of rows) {
    if (!row.value || row.value === 'null') continue

    try {
      const parsed = JSON.parse(row.value)
      parsed.composerId = row.key.slice(KEY_PATTERNS.COMPOSER_DATA.length)

      const summary = getConversationSummary(parsed, (composerId, bubbleId) =>
        getBubbleData(composerId, bubbleId)
      )

      const matches: any[] = []

      // Search through messages
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
          composerId: parsed.composerId,
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
