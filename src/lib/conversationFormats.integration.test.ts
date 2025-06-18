import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { openDatabase } from './openDatabase.ts'
import { getDbPath } from './getDbPath.ts'
import { parseConversation } from './parseConversation.ts'
import { getConversationSummary } from './getConversationSummary.ts'
import { getBubbleData } from './getBubbleData.ts'

describe('Conversation Formats Integration', () => {
  let db
  
  beforeEach(async () => {
    const dbPath = getDbPath()
    db = await openDatabase(dbPath)
  })
  
  afterEach(() => {
    if (db) db.close()
  })
  
  describe('when finding conversations with different formats', () => {
    let oldFormatConversations
    let newFormatConversations
    let conversationsWithInlineMessages
    let conversationsWithBubbles
    
    beforeEach(() => {
      // Get all conversations
      const stmt = db.prepare(`
        SELECT key, value 
        FROM cursorDiskKV 
        WHERE key LIKE 'composerData:%'
        LIMIT 100
      `)
      
      const rows = stmt.all()
      oldFormatConversations = []
      newFormatConversations = []
      conversationsWithInlineMessages = []
      conversationsWithBubbles = []
      
      for (const row of rows) {
        const parsed = parseConversation(row.key, row.value)
        if (!parsed) continue
        
        // Categorize by format
        if (parsed.conversation && Array.isArray(parsed.conversation)) {
          oldFormatConversations.push(parsed)
          if (parsed.conversation.length > 0) {
            conversationsWithInlineMessages.push(parsed)
          }
        }
        
        if (parsed.fullConversationHeadersOnly && Array.isArray(parsed.fullConversationHeadersOnly)) {
          newFormatConversations.push(parsed)
          if (parsed.fullConversationHeadersOnly.length > 0) {
            conversationsWithBubbles.push(parsed)
          }
        }
      }
    })
    
    it('should find both old and new format conversations', () => {
      console.log(`Found ${oldFormatConversations.length} old format conversations`)
      console.log(`Found ${newFormatConversations.length} new format conversations`)
      
      expect(oldFormatConversations.length + newFormatConversations.length).toBeGreaterThan(0)
    })
    
    describe('when processing old format conversations', () => {
      it('should extract messages from inline conversation array', () => {
        if (conversationsWithInlineMessages.length === 0) {
          console.log('No old format conversations with messages found, skipping test')
          return
        }
        
        const conversation = conversationsWithInlineMessages[0]
        const summary = getConversationSummary(conversation)
        
        expect(summary.messageCount).toBeGreaterThan(0)
        expect(summary.messages).toBeInstanceOf(Array)
        expect(summary.messages.length).toBe(summary.messageCount)
        expect(summary.preview).not.toBe('No preview available')
      })
      
      it('should have correct message structure', () => {
        if (conversationsWithInlineMessages.length === 0) return
        
        const conversation = conversationsWithInlineMessages[0]
        const summary = getConversationSummary(conversation)
        
        const firstMessage = summary.messages[0]
        expect(firstMessage).toHaveProperty('type')
        expect(firstMessage).toHaveProperty('text')
        expect(['user', 'assistant']).toContain(firstMessage.type)
      })
    })
    
    describe('when processing new format conversations', () => {
      it('should extract messages from bubble data', () => {
        if (conversationsWithBubbles.length === 0) {
          console.log('No new format conversations with bubbles found, skipping test')
          return
        }
        
        const conversation = conversationsWithBubbles[0]
        const getBubbleDataForConversation = (composerId, bubbleId) => getBubbleData(db, composerId, bubbleId)
        const summary = getConversationSummary(conversation, getBubbleDataForConversation)
        
        expect(summary.messageCount).toBeGreaterThan(0)
        expect(summary.messages).toBeInstanceOf(Array)
        expect(summary.messages.length).toBe(summary.messageCount)
        expect(summary.preview).not.toBe('No preview available')
      })
      
      it('should fetch bubble data correctly', () => {
        if (conversationsWithBubbles.length === 0) return
        
        const conversation = conversationsWithBubbles[0]
        const firstHeader = conversation.fullConversationHeadersOnly[0]
        
        const bubbleData = getBubbleData(db, conversation.composerId, firstHeader.bubbleId)
        
        if (bubbleData) {
          expect(bubbleData).toHaveProperty('type')
          expect(bubbleData).toHaveProperty('bubbleId')
          expect(bubbleData.bubbleId).toBe(firstHeader.bubbleId)
        }
      })
    })
  })
  
  describe('when checking date-based format patterns', () => {
    it('should show format evolution over time', () => {
      const stmt = db.prepare(`
        SELECT key, value 
        FROM cursorDiskKV 
        WHERE key LIKE 'composerData:%'
      `)
      
      const rows = stmt.all()
      const conversationsByMonth = new Map()
      
      for (const row of rows) {
        const parsed = parseConversation(row.key, row.value)
        if (!parsed || !parsed.createdAt) continue
        
        const date = new Date(parsed.createdAt)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        
        if (!conversationsByMonth.has(monthKey)) {
          conversationsByMonth.set(monthKey, {
            total: 0,
            oldFormat: 0,
            newFormat: 0,
            withMessages: 0
          })
        }
        
        const stats = conversationsByMonth.get(monthKey)
        stats.total++
        
        if (parsed.conversation && Array.isArray(parsed.conversation)) {
          stats.oldFormat++
        }
        
        if (parsed.fullConversationHeadersOnly && Array.isArray(parsed.fullConversationHeadersOnly)) {
          stats.newFormat++
        }
        
        const getBubbleDataForConversation = (composerId, bubbleId) => getBubbleData(db, composerId, bubbleId)
        const summary = getConversationSummary(parsed, getBubbleDataForConversation)
        if (summary.messageCount > 0) {
          stats.withMessages++
        }
      }
      
      console.log('\nConversation formats by month:')
      const sortedMonths = Array.from(conversationsByMonth.entries()).sort((a, b) => a[0].localeCompare(b[0]))
      
      for (const [month, stats] of sortedMonths) {
        console.log(`${month}: Total: ${stats.total}, Old: ${stats.oldFormat}, New: ${stats.newFormat}, With Messages: ${stats.withMessages}`)
      }
      
      expect(conversationsByMonth.size).toBeGreaterThan(0)
    })
  })
})