import { parseConversation } from './parseConversation.ts'
import { getConversationSummary } from './getConversationSummary.ts'
import { getBubbleData } from './getBubbleData.ts'

export const listConversations = async (db, options = {}) => {
  const { limit = 50, offset = 0 } = options
  
  // Get total count first
  const countStmt = db.prepare(`
    SELECT COUNT(*) as count 
    FROM cursorDiskKV 
    WHERE key LIKE 'composerData:%'
  `)
  const totalCount = countStmt.get().count
  
  // Get the limited results
  const stmt = db.prepare(`
    SELECT key, value 
    FROM cursorDiskKV 
    WHERE key LIKE 'composerData:%'
    ORDER BY key DESC
    LIMIT ? OFFSET ?
  `)
  
  const rows = stmt.all(limit, offset)
  const conversations = []
  
  for (const row of rows) {
    const parsed = parseConversation(row.key, row.value)
    if (!parsed) continue
    
    const getBubbleDataForConversation = (composerId, bubbleId) => getBubbleData(db, composerId, bubbleId)
    const summary = getConversationSummary(parsed, getBubbleDataForConversation)
    conversations.push({
      composerId: parsed.composerId,
      messageCount: summary.messageCount,
      preview: summary.preview,
      status: summary.status,
      createdAt: parsed.createdAt,
      updatedAt: summary.updatedAt
    })
  }
  
  return {
    conversations,
    total: totalCount
  }
}