import { openDatabase } from './openDatabase.ts'
import { getDbPath } from './getDbPath.ts'
import { parseConversation } from './parseConversation.ts'

const debugRecentConversation = async () => {
  const dbPath = getDbPath()
  const db = await openDatabase(dbPath)
  
  try {
    // Get a recent conversation with substantial data
    const stmt = db.prepare(`
      SELECT key, value 
      FROM cursorDiskKV 
      WHERE key = 'composerData:e0188e6d-d6a7-4b64-a093-7b3eb9a96566'
    `)
    
    const row = stmt.get()
    if (!row) {
      console.log('Conversation not found')
      return
    }
    
    console.log('Raw value length:', row.value?.length)
    
    const parsed = parseConversation(row.key, row.value)
    if (!parsed) {
      console.log('Failed to parse conversation')
      return
    }
    
    console.log('\n=== Parsed Conversation ===')
    console.log('ComposerId:', parsed.composerId)
    console.log('Created:', new Date(parsed.createdAt))
    console.log('Updated:', new Date(parsed.lastUpdatedAt || parsed.createdAt))
    console.log('Status:', parsed.status)
    
    // Check different possible message locations
    console.log('\n=== Message Storage ===')
    console.log('Has conversation array:', !!parsed.conversation)
    console.log('Conversation length:', parsed.conversation?.length || 0)
    console.log('Has conversationMap:', !!parsed.conversationMap)
    console.log('ConversationMap keys:', parsed.conversationMap ? Object.keys(parsed.conversationMap).length : 0)
    console.log('Has messages:', !!parsed.messages)
    console.log('Messages length:', parsed.messages?.length || 0)
    
    // Check for bubble-related data
    console.log('\n=== Other Fields ===')
    console.log('Has bubbles:', !!parsed.bubbles)
    console.log('Has bubbleMap:', !!parsed.bubbleMap)
    console.log('Has fullConversationHeadersOnly:', !!parsed.fullConversationHeadersOnly)
    
    // Show all top-level keys
    console.log('\n=== All Top-Level Keys ===')
    const keys = Object.keys(parsed).sort()
    keys.forEach(key => {
      const value = parsed[key]
      let info = typeof value
      if (Array.isArray(value)) info = `array[${value.length}]`
      else if (value && typeof value === 'object') info = `object{${Object.keys(value).length} keys}`
      console.log(`  ${key}: ${info}`)
    })
    
    // Check fullConversationHeadersOnly
    if (parsed.fullConversationHeadersOnly && parsed.fullConversationHeadersOnly.length > 0) {
      console.log('\n=== fullConversationHeadersOnly Sample ===')
      const headers = parsed.fullConversationHeadersOnly
      console.log(`Total headers: ${headers.length}`)
      
      // Show first few entries
      headers.slice(0, 3).forEach((header, i) => {
        console.log(`\nHeader ${i}:`)
        console.log('  Type:', header.type)
        console.log('  BubbleId:', header.bubbleId)
        console.log('  Has text:', !!header.text)
        console.log('  Has richText:', !!header.richText)
        if (header.text) {
          console.log('  Text preview:', header.text.substring(0, 100) + '...')
        }
      })
      
      // Check if messages are stored separately by bubbleId
      console.log('\n=== Checking bubble data ===')
      const firstBubbleId = headers[0].bubbleId
      const bubbleStmt = db.prepare(`
        SELECT key, length(value) as value_length
        FROM cursorDiskKV 
        WHERE key LIKE 'bubbleId:${firstBubbleId}%'
        LIMIT 5
      `)
      
      const bubbleRows = bubbleStmt.all()
      console.log(`Found ${bubbleRows.length} entries for bubbleId ${firstBubbleId}`)
      bubbleRows.forEach(row => {
        console.log(`  ${row.key}: ${row.value_length} chars`)
      })
    }
    
    // Check latestConversationSummary
    if (parsed.latestConversationSummary) {
      console.log('\n=== latestConversationSummary ===')
      const summary = parsed.latestConversationSummary
      console.log('Summary keys:', Object.keys(summary))
      if (summary.summary) {
        console.log('Summary text preview:', summary.summary.substring(0, 200) + '...')
      }
    }
    
    // Check the initial text field
    if (parsed.text) {
      console.log('\n=== Initial text ===')
      console.log('Text preview:', parsed.text.substring(0, 200) + (parsed.text.length > 200 ? '...' : ''))
    }
    
  } finally {
    db.close()
  }
}

debugRecentConversation().catch(console.error)