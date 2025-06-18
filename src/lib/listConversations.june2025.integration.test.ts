import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { listConversations } from './listConversations'
import { openDatabase } from './openDatabase'
import { getDbPath } from './getDbPath'

describe('listConversations June 2025 integration', () => {
  describe('when listing conversations from June 2025', () => {
    let db
    let conversations
    
    beforeEach(async () => {
      // ARRANGE
      const dbPath = getDbPath()
      db = await openDatabase(dbPath)
      // ACT - get more conversations to find June ones
      conversations = await listConversations(db, { limit: 50 })
    })
    
    afterEach(() => {
      // CLEANUP
      if (db) db.close()
    })
    
    it('should find conversations', () => {
      // ASSERT
      expect(conversations.length).toBeGreaterThan(0)
    })
    
    describe('when filtering for June 2025', () => {
      let juneConversations
      
      beforeEach(() => {
        // ARRANGE - filter for June 2025
        juneConversations = conversations.filter(conv => {
          const createdDate = new Date(conv.createdAt)
          return createdDate.getFullYear() === 2025 && createdDate.getMonth() === 5 // June is month 5
        })
      })
      
      it('should find conversations from June 2025', () => {
        // ASSERT
        expect(juneConversations.length).toBeGreaterThan(0)
        console.log(`Found ${juneConversations.length} conversations from June 2025`)
      })
      
      it('should correctly extract messages from June conversations', () => {
        // ASSERT - June 2025 conversations now have messages thanks to bubble data extraction
        const conversationsWithMessages = juneConversations.filter(c => c.messageCount > 0)
        console.log(`Found ${conversationsWithMessages.length} June conversations with messages`)
        
        // June conversations should now have messages
        expect(conversationsWithMessages.length).toBeGreaterThan(0)
        
        // At least some June conversations should have actual message content
        const conversationsWithPreview = juneConversations.filter(c => 
          c.preview !== 'No preview available'
        )
        expect(conversationsWithPreview.length).toBeGreaterThan(0)
      })
    })
    
    describe('when checking the most recent conversation', () => {
      let mostRecent
      
      beforeEach(() => {
        // ARRANGE - sort by date and get the most recent
        const sorted = [...conversations].sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt)
          const dateB = new Date(b.updatedAt || b.createdAt)
          return dateB.getTime() - dateA.getTime()
        })
        mostRecent = sorted[0]
      })
      
      it('should be from 2025', () => {
        // ASSERT
        if (mostRecent) {
          const year = new Date(mostRecent.updatedAt || mostRecent.createdAt).getFullYear()
          expect(year).toBe(2025)
        }
      })
    })
  })
})