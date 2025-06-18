import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { openDatabase } from './openDatabase'
import { getDbPath } from './getDbPath'
import { listConversations } from './listConversations'
import { parseConversation } from './parseConversation'
import { getConversationSummary } from './getConversationSummary'

describe('full flow integration', () => {
  describe('when processing conversations end-to-end', () => {
    let db
    let dbPath
    
    beforeEach(async () => {
      // ARRANGE
      dbPath = getDbPath()
      // ACT
      db = await openDatabase(dbPath)
    })
    
    afterEach(() => {
      // CLEANUP
      if (db) db.close()
    })
    
    it('should have a valid database path', () => {
      // ASSERT
      expect(dbPath).toContain('Cursor')
      expect(dbPath).toContain('state.vscdb')
    })
    
    describe('when fetching and processing a single conversation', () => {
      let rawRow
      let parsedConversation
      let summary
      
      beforeEach(() => {
        // ARRANGE & ACT
        const stmt = db.prepare(`
          SELECT key, value 
          FROM cursorDiskKV 
          WHERE key LIKE 'composerData:%' 
          AND value IS NOT NULL 
          AND value != 'null'
          LIMIT 1
        `)
        rawRow = stmt.get()
        
        if (rawRow) {
          parsedConversation = parseConversation(rawRow.key, rawRow.value)
          if (parsedConversation) {
            summary = getConversationSummary(parsedConversation)
          }
        }
      })
      
      it('should find at least one conversation', () => {
        // ASSERT
        expect(rawRow).toBeDefined()
      })
      
      it('should successfully parse the conversation', () => {
        // ASSERT
        if (rawRow) {
          expect(parsedConversation).toBeDefined()
          expect(parsedConversation).not.toBe(null)
        }
      })
      
      it('should extract composerId from key', () => {
        // ASSERT
        if (parsedConversation) {
          expect(parsedConversation.composerId).toBeDefined()
          expect(typeof parsedConversation.composerId).toBe('string')
        }
      })
      
      it('should generate a summary', () => {
        // ASSERT
        if (parsedConversation && summary) {
          expect(summary).toBeDefined()
          expect(summary.messageCount).toBeDefined()
          expect(typeof summary.messageCount).toBe('number')
          expect(Array.isArray(summary.messages)).toBe(true)
        }
      })
    })
    
    describe('when listing conversations with full processing', () => {
      let conversations
      
      beforeEach(async () => {
        // ACT
        conversations = await listConversations(db, { limit: 10 })
      })
      
      it('should return processed conversations', () => {
        // ASSERT
        expect(Array.isArray(conversations)).toBe(true)
      })
      
      it('should have all required fields', () => {
        // ASSERT
        if (conversations.length > 0) {
          const first = conversations[0]
          expect(first).toHaveProperty('composerId')
          expect(first).toHaveProperty('messageCount')
          expect(first).toHaveProperty('preview')
          expect(first).toHaveProperty('status')
        }
      })
    })
  })
})