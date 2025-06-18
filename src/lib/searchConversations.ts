import { parseConversation } from './parseConversation.ts'
import { getConversationSummary } from './getConversationSummary.ts'
import { getBubbleData } from './getBubbleData.ts'

export const searchConversations = async (db, query, limit = 20) => {
  const stmt = db.prepare(`
    SELECT key, value 
    FROM cursorDiskKV 
    WHERE key LIKE 'composerData:%'
  `)
  
  const rows = stmt.all()
  const results = []
  const lowerQuery = query.toLowerCase()
  
  for (const row of rows) {
    const parsed = parseConversation(row.key, row.value)
    if (!parsed) continue
    
    const getBubbleDataForConversation = (composerId, bubbleId) => getBubbleData(db, composerId, bubbleId)
    const summary = getConversationSummary(parsed, getBubbleDataForConversation)
    const matches = []
    
    // Search through messages
    summary.messages.forEach((msg, index) => {
      if (msg.text && msg.text.toLowerCase().includes(lowerQuery)) {
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
        matches: matches.slice(0, 3) // Limit matches per conversation
      })
    }
    
    if (results.length >= limit) break
  }
  
  return results
}