import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { listConversations } from './listConversations.ts'
import { openDatabase } from './openDatabase.ts'
import { getDbPath } from './getDbPath.ts'
import { parseConversation } from './parseConversation.ts'
import { getConversationSummary } from './getConversationSummary.ts'
import { getBubbleData } from './getBubbleData.ts'

describe('April vs June 2025 Conversations', () => {
  let db
  
  beforeEach(async () => {
    const dbPath = getDbPath()
    db = await openDatabase(dbPath)
  })
  
  afterEach(() => {
    if (db) db.close()
  })
  
  describe('when comparing April 2025 (old format) and June 2025 (new format)', () => {
    let aprilConversations
    let juneConversations
    
    beforeEach(async () => {
      const allConversations = await listConversations(db, { limit: 100 })
      
      aprilConversations = allConversations.filter(conv => {
        const date = new Date(conv.createdAt)
        return date.getFullYear() === 2025 && date.getMonth() === 3 // April is month 3
      })
      
      juneConversations = allConversations.filter(conv => {
        const date = new Date(conv.createdAt)
        return date.getFullYear() === 2025 && date.getMonth() === 5 // June is month 5
      })
    })
    
    it('should find conversations from both months', () => {
      console.log(`Found ${aprilConversations.length} April 2025 conversations`)
      console.log(`Found ${juneConversations.length} June 2025 conversations`)
      
      expect(aprilConversations.length).toBeGreaterThan(0)
      expect(juneConversations.length).toBeGreaterThan(0)
    })
    
    it('should extract messages from both formats correctly', () => {
      // Check April conversations (old format)
      const aprilWithMessages = aprilConversations.filter(c => c.messageCount > 0)
      console.log(`April conversations with messages: ${aprilWithMessages.length}/${aprilConversations.length}`)
      
      // Check June conversations (new format)
      const juneWithMessages = juneConversations.filter(c => c.messageCount > 0)
      console.log(`June conversations with messages: ${juneWithMessages.length}/${juneConversations.length}`)
      
      // Both formats should be able to extract messages
      if (aprilConversations.length > 0) {
        expect(aprilWithMessages.length).toBeGreaterThan(0)
      }
      
      if (juneConversations.length > 0) {
        expect(juneWithMessages.length).toBeGreaterThan(0)
      }
    })
    
    describe('when examining raw conversation structures', () => {
      let rawAprilConversation
      let rawJuneConversation
      
      beforeEach(() => {
        // Get raw conversations for detailed comparison
        const stmt = db.prepare(`
          SELECT key, value 
          FROM cursorDiskKV 
          WHERE key LIKE 'composerData:%'
        `)
        
        const rows = stmt.all()
        
        for (const row of rows) {
          const parsed = parseConversation(row.key, row.value)
          if (!parsed || !parsed.createdAt) continue
          
          const date = new Date(parsed.createdAt)
          
          if (date.getFullYear() === 2025 && date.getMonth() === 3 && !rawAprilConversation) {
            rawAprilConversation = parsed
          }
          
          if (date.getFullYear() === 2025 && date.getMonth() === 5 && !rawJuneConversation) {
            rawJuneConversation = parsed
          }
          
          if (rawAprilConversation && rawJuneConversation) break
        }
      })
      
      it('should show April uses inline conversation array', () => {
        if (!rawAprilConversation) {
          console.log('No April conversation found for structure test')
          return
        }
        
        expect(rawAprilConversation).toHaveProperty('conversation')
        expect(Array.isArray(rawAprilConversation.conversation)).toBe(true)
        expect(rawAprilConversation.fullConversationHeadersOnly).toBeUndefined()
      })
      
      it('should show June uses fullConversationHeadersOnly with bubbles', () => {
        if (!rawJuneConversation) {
          console.log('No June conversation found for structure test')
          return
        }
        
        expect(rawJuneConversation).toHaveProperty('fullConversationHeadersOnly')
        expect(Array.isArray(rawJuneConversation.fullConversationHeadersOnly)).toBe(true)
        
        // June conversations may have empty conversation array
        if (rawJuneConversation.conversation) {
          expect(rawJuneConversation.conversation.length).toBe(0)
        }
      })
      
      it('should extract correct content from both formats', () => {
        if (rawAprilConversation && rawAprilConversation.conversation?.length > 0) {
          const summary = getConversationSummary(rawAprilConversation)
          expect(summary.messages.length).toBeGreaterThan(0)
          expect(summary.messages[0].text).toBeTruthy()
        }
        
        if (rawJuneConversation && rawJuneConversation.fullConversationHeadersOnly?.length > 0) {
          const getBubbleDataForConversation = (composerId, bubbleId) => getBubbleData(db, composerId, bubbleId)
          const summary = getConversationSummary(rawJuneConversation, getBubbleDataForConversation)
          expect(summary.messages.length).toBeGreaterThan(0)
          expect(summary.messages[0].text).toBeTruthy()
        }
      })
    })
  })
})