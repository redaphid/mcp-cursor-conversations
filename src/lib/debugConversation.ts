import { openDatabase } from './openDatabase.ts'
import { getDbPath } from './getDbPath.ts'
import { parseConversation } from './parseConversation.ts'

const debugConversations = async () => {
  const dbPath = getDbPath()
  const db = await openDatabase(dbPath)
  
  try {
    // Get June 2025 conversations
    const stmt = db.prepare(`
      SELECT key, value 
      FROM cursorDiskKV 
      WHERE key LIKE 'composerData:%'
      ORDER BY key DESC
    `)
    
    const rows = stmt.all()
    let found = false
    let juneCount = 0
    
    console.log('Checking conversations...')
    
    for (const row of rows) {
      const parsed = parseConversation(row.key, row.value)
      if (!parsed) continue
      
      const date = new Date(parsed.createdAt)
      if (date.getFullYear() === 2025 && date.getMonth() === 5) { // June
        juneCount++
        const hasMessages = (parsed.conversation && parsed.conversation.length > 0) || 
                          (parsed.conversationMap && Object.keys(parsed.conversationMap).length > 0)
        
        if (hasMessages && !found) {
        console.log('\n=== June 2025 Conversation ===')
        console.log('Key:', row.key)
        console.log('Created:', new Date(parsed.createdAt))
        console.log('Status:', parsed.status)
        console.log('Conversation array length:', parsed.conversation?.length || 0)
        console.log('Has conversation field:', 'conversation' in parsed)
        console.log('Has conversationMap field:', 'conversationMap' in parsed)
        console.log('Raw data keys:', Object.keys(parsed).slice(0, 10))
        
        if (parsed.conversationMap) {
          console.log('ConversationMap keys:', Object.keys(parsed.conversationMap))
          const firstKey = Object.keys(parsed.conversationMap)[0]
          if (firstKey) {
            console.log('First conversation entry:', parsed.conversationMap[firstKey])
          }
        }
        
        if (parsed.conversation && parsed.conversation.length > 0) {
          console.log('First message:', {
            type: parsed.conversation[0].type,
            hasText: !!parsed.conversation[0].text,
            hasResponseParts: !!parsed.conversation[0].responseParts,
            bubbleId: parsed.conversation[0].bubbleId
          })
          
          // Show actual structure
          console.log('Full first message structure keys:', Object.keys(parsed.conversation[0]))
        }
        
          found = true
        }
      }
    }
    
    console.log(`\nFound ${juneCount} June 2025 conversations total`)
    if (!found) {
      console.log('None of them had messages')
    }
    
    // Also check for conversations with the old structure
    console.log('\nChecking for conversations with content (any date)...')
    let withContent = 0
    for (const row of rows.slice(0, 50)) {
      const parsed = parseConversation(row.key, row.value)
      if (!parsed) continue
      
      if (parsed.conversation && parsed.conversation.length > 0) {
        withContent++
        if (withContent === 1) {
          console.log('Found conversation with messages:', {
            key: row.key,
            date: new Date(parsed.createdAt),
            messageCount: parsed.conversation.length
          })
        }
      }
    }
    console.log(`Found ${withContent} conversations with messages in first 50 rows`)
    
  } finally {
    db.close()
  }
}

debugConversations().catch(console.error)