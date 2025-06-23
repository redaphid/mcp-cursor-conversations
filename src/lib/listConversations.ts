import { parseConversation } from './parseConversation.ts'
import { getConversationSummary } from './getConversationSummary.ts'
import { getBubbleData } from './getBubbleData.ts'

export const listConversations = async (db, options = {}) => {
  const { 
    limit = 50, 
    offset = 0, 
    sortBy = 'recent_activity', 
    sortOrder = 'desc' 
  } = options
  
  // Get total count first
  const countStmt = db.prepare(`
    SELECT COUNT(*) as count 
    FROM cursorDiskKV 
    WHERE key LIKE 'composerData:%'
  `)
  const totalCount = countStmt.get().count
  
  // Build ORDER BY clause based on sorting options
  let orderByClause
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

  // Get the limited results with dynamic sorting
  const stmt = db.prepare(`
    SELECT key, value 
    FROM cursorDiskKV 
    WHERE key LIKE 'composerData:%'
    ORDER BY ${orderByClause}
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