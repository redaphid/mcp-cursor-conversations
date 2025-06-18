import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { listConversations } from './listConversations'
import { openDatabase } from './openDatabase'
import { getDbPath } from './getDbPath'

describe('listConversations integration', () => {
  describe('when listing conversations from the actual database', () => {
    let db
    let conversations
    
    beforeEach(async () => {
      // ARRANGE
      const dbPath = getDbPath()
      db = await openDatabase(dbPath)
      // ACT
      conversations = await listConversations(db, { limit: 5 })
    })
    
    afterEach(() => {
      // CLEANUP
      if (db) db.close()
    })
    
    it('should return an array', () => {
      // ASSERT
      expect(Array.isArray(conversations)).toBe(true)
    })
    
    describe('when examining the first conversation', () => {
      let firstConversation
      
      beforeEach(() => {
        // ARRANGE
        firstConversation = conversations[0]
      })
      
      it('should exist if there are any conversations', () => {
        // ASSERT
        if (conversations.length > 0) {
          expect(firstConversation).toBeDefined()
        }
      })
      
      it('should have a composerId', () => {
        // ASSERT
        if (firstConversation) {
          expect(firstConversation).toHaveProperty('composerId')
        }
      })
      
      it('should have a messageCount', () => {
        // ASSERT
        if (firstConversation) {
          expect(firstConversation).toHaveProperty('messageCount')
          expect(typeof firstConversation.messageCount).toBe('number')
        }
      })
      
      it('should have a preview', () => {
        // ASSERT
        if (firstConversation) {
          expect(firstConversation).toHaveProperty('preview')
        }
      })
    })
    
    describe('when using pagination', () => {
      let secondPage
      
      beforeEach(async () => {
        // ACT
        secondPage = await listConversations(db, { limit: 5, offset: 5 })
      })
      
      it('should return different conversations', () => {
        // ASSERT
        if (conversations.length > 0 && secondPage.length > 0) {
          expect(conversations[0].composerId).not.toBe(secondPage[0].composerId)
        }
      })
    })
  })
})