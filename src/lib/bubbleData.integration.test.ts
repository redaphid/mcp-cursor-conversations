import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { openDatabase } from './openDatabase.ts'
import { getDbPath } from './getDbPath.ts'
import { getBubbleData } from './getBubbleData.ts'
import { parseConversation } from './parseConversation.ts'

describe('Bubble Data Integration', () => {
  let db
  
  beforeEach(async () => {
    const dbPath = getDbPath()
    db = await openDatabase(dbPath)
  })
  
  afterEach(() => {
    if (db) db.close()
  })
  
  describe('when working with bubble data', () => {
    let conversationWithBubbles
    
    beforeEach(() => {
      // Find a conversation that uses bubble format
      const stmt = db.prepare(`
        SELECT key, value 
        FROM cursorDiskKV 
        WHERE key LIKE 'composerData:%'
        LIMIT 100
      `)
      
      const rows = stmt.all()
      
      for (const row of rows) {
        const parsed = parseConversation(row.key, row.value)
        if (!parsed) continue
        
        if (parsed.fullConversationHeadersOnly && 
            Array.isArray(parsed.fullConversationHeadersOnly) && 
            parsed.fullConversationHeadersOnly.length > 0) {
          conversationWithBubbles = parsed
          break
        }
      }
    })
    
    it('should find conversations with bubble structure', () => {
      expect(conversationWithBubbles).toBeDefined()
      expect(conversationWithBubbles.fullConversationHeadersOnly).toBeInstanceOf(Array)
      expect(conversationWithBubbles.fullConversationHeadersOnly.length).toBeGreaterThan(0)
    })
    
    it('should retrieve bubble data for each header', () => {
      if (!conversationWithBubbles) {
        console.log('No conversation with bubbles found')
        return
      }
      
      const bubbleDataFound = []
      const bubbleDataMissing = []
      
      for (const header of conversationWithBubbles.fullConversationHeadersOnly) {
        const bubbleData = getBubbleData(db, conversationWithBubbles.composerId, header.bubbleId)
        
        if (bubbleData) {
          bubbleDataFound.push(header.bubbleId)
        } else {
          bubbleDataMissing.push(header.bubbleId)
        }
      }
      
      console.log(`Bubble data found: ${bubbleDataFound.length}/${conversationWithBubbles.fullConversationHeadersOnly.length}`)
      
      if (bubbleDataMissing.length > 0) {
        console.log(`Missing bubble data for ${bubbleDataMissing.length} bubbles`)
      }
      
      expect(bubbleDataFound.length).toBeGreaterThan(0)
    })
    
    it('should extract correct message content from bubbles', () => {
      if (!conversationWithBubbles) return
      
      // Get first few bubbles with data
      const messagesExtracted = []
      
      for (const header of conversationWithBubbles.fullConversationHeadersOnly.slice(0, 5)) {
        const bubbleData = getBubbleData(db, conversationWithBubbles.composerId, header.bubbleId)
        
        if (bubbleData) {
          const messageInfo = {
            type: bubbleData.type === 1 ? 'user' : 'assistant',
            hasText: false,
            textPreview: ''
          }
          
          if (bubbleData.type === 1 && bubbleData.text) {
            messageInfo.hasText = true
            messageInfo.textPreview = bubbleData.text.substring(0, 50)
          } else if (bubbleData.type === 2) {
            if (bubbleData.text) {
              messageInfo.hasText = true
              messageInfo.textPreview = bubbleData.text.substring(0, 50)
            } else if (bubbleData.responseParts) {
              const textParts = []
              for (const part of bubbleData.responseParts || []) {
                if (part.type === 'text' && part.rawText) {
                  textParts.push(part.rawText)
                }
              }
              if (textParts.length > 0) {
                messageInfo.hasText = true
                messageInfo.textPreview = textParts.join('').substring(0, 50)
              }
            }
          }
          
          messagesExtracted.push(messageInfo)
        }
      }
      
      console.log(`\nExtracted ${messagesExtracted.length} messages from bubbles`)
      messagesExtracted.forEach((msg, i) => {
        console.log(`Message ${i}: ${msg.type}, has text: ${msg.hasText}, preview: "${msg.textPreview}..."`)
      })
      
      const messagesWithText = messagesExtracted.filter(m => m.hasText)
      expect(messagesWithText.length).toBeGreaterThan(0)
    })
    
    it('should verify bubble key format', () => {
      // Check the format of bubble keys in the database
      const bubbleKeysStmt = db.prepare(`
        SELECT key 
        FROM cursorDiskKV 
        WHERE key LIKE 'bubbleId:%'
        LIMIT 10
      `)
      
      const bubbleKeys = bubbleKeysStmt.all()
      
      if (bubbleKeys.length > 0) {
        console.log('\nSample bubble keys:')
        bubbleKeys.forEach(row => {
          console.log(`  ${row.key}`)
          
          // Verify key format: bubbleId:composerId:bubbleId
          const parts = row.key.split(':')
          expect(parts.length).toBe(3)
          expect(parts[0]).toBe('bubbleId')
          expect(parts[1]).toMatch(/^[a-f0-9-]+$/) // UUID format
          expect(parts[2]).toMatch(/^[a-f0-9-]+$/) // UUID format
        })
      }
    })
  })
})