import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createMcpServer } from './createMcpServer'
import { openDatabase } from './openDatabase'
import { getDbPath } from './getDbPath'
import { listConversations } from './listConversations'
import { searchConversations } from './searchConversations'

describe('MCP Server functions integration', () => {
  describe('when testing the complete flow', () => {
    let db
    let dbPath
    
    beforeEach(async () => {
      // ARRANGE
      dbPath = getDbPath()
      db = await openDatabase(dbPath)
    })
    
    afterEach(() => {
      // CLEANUP
      if (db) db.close()
    })
    
    describe('when creating the server', () => {
      let server
      
      beforeEach(() => {
        // ACT
        server = createMcpServer()
      })
      
      it('should create a valid server instance', () => {
        // ASSERT
        expect(server).toBeDefined()
        expect(server.constructor.name).toBe('Server')
      })
    })
    
    describe('when listing conversations through our functions', () => {
      let conversations
      
      beforeEach(async () => {
        // ACT
        conversations = await listConversations(db, { limit: 5 })
      })
      
      it('should return valid conversation data', () => {
        // ASSERT
        expect(Array.isArray(conversations)).toBe(true)
        if (conversations.length > 0) {
          expect(conversations[0]).toHaveProperty('composerId')
          expect(conversations[0]).toHaveProperty('messageCount')
          expect(conversations[0]).toHaveProperty('preview')
        }
      })
    })
    
    describe('when searching conversations through our functions', () => {
      let results
      
      beforeEach(async () => {
        // ACT
        results = await searchConversations(db, 'the', 5)
      })
      
      it('should return search results', () => {
        // ASSERT
        expect(Array.isArray(results)).toBe(true)
        if (results.length > 0) {
          expect(results[0]).toHaveProperty('matches')
        }
      })
    })
  })
})