import { parseConversation } from './parseConversation.ts'
import { getConversationSummary } from './getConversationSummary.ts'
import { getBubbleData } from './getBubbleData.ts'

export const searchConversationsAdvanced = async (db, options = {}) => {
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
  
  const stmt = db.prepare(`
    SELECT key, value 
    FROM cursorDiskKV 
    WHERE key LIKE 'composerData:%'
  `)
  
  const rows = stmt.all()
  const results = []
  
  for (const row of rows) {
    const parsed = parseConversation(row.key, row.value)
    if (!parsed) continue
    
    const getBubbleDataForConversation = (composerId, bubbleId) => getBubbleData(db, composerId, bubbleId)
    const summary = getConversationSummary(parsed, getBubbleDataForConversation)
    
    // Apply filters
    const lastMessageDate = new Date(summary.updatedAt)
    
    // Date filters
    if (date_from && lastMessageDate < new Date(date_from)) continue
    if (date_to && lastMessageDate > new Date(date_to)) continue
    
    // Message count filters
    if (min_messages && summary.messageCount < min_messages) continue
    if (max_messages && summary.messageCount > max_messages) continue
    
    // Status filter
    if (status !== 'all' && summary.status !== status) continue
    
    results.push({
      composer_id: parsed.composerId,
      message_count: summary.messageCount,
      last_message_date: summary.updatedAt,
      status: summary.status,
      preview: summary.preview
    })
  }
  
  // Sort results
  results.sort((a, b) => {
    let comparison = 0
    
    if (sort_by === 'date') {
      comparison = new Date(a.last_message_date).getTime() - new Date(b.last_message_date).getTime()
    } else if (sort_by === 'message_count') {
      comparison = a.message_count - b.message_count
    } else if (sort_by === 'status') {
      comparison = a.status.localeCompare(b.status)
    }
    
    return sort_order === 'desc' ? -comparison : comparison
  })
  
  // Apply limit
  return {
    total_found: results.length,
    returned: Math.min(results.length, limit),
    conversations: results.slice(0, limit)
  }
}