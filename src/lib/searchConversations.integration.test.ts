import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { searchConversations } from './searchConversations'
import { openDatabase } from './openDatabase'
import { getDbPath } from './getDbPath'

describe('searchConversations integration', () => {
  describe('when searching conversations in the actual database', () => {
    let db
    
    beforeEach(async () => {
      // ARRANGE
      const dbPath = getDbPath()
      db = await openDatabase(dbPath)
    })
    
    afterEach(() => {
      // CLEANUP
      if (db) db.close()
    })
    
    describe('when searching for "the"', () => {
      let results
      
      beforeEach(async () => {
        // ACT
        results = await searchConversations(db, 'the')
      })
      
      it('should return an array', () => {
        // ASSERT
        expect(Array.isArray(results)).toBe(true)
      })
      
      describe('when results are found', () => {
        let firstResult
        
        beforeEach(() => {
          // ARRANGE
          firstResult = results[0]
        })
        
        it('should have matches if any exist', () => {
          // ASSERT
          if (results.length > 0) {
            expect(firstResult).toHaveProperty('matches')
            expect(Array.isArray(firstResult.matches)).toBe(true)
          }
        })
        
        it('should have text in matches', () => {
          // ASSERT
          if (firstResult?.matches?.length > 0) {
            const matchText = firstResult.matches[0].text
            expect(matchText).toBeTruthy()
            expect(matchText.length).toBeGreaterThan(0)
          }
        })
      })
    })
    
    describe('when searching with case insensitive query', () => {
      let upperResults
      let lowerResults
      
      beforeEach(async () => {
        // ACT
        upperResults = await searchConversations(db, 'THE')
        lowerResults = await searchConversations(db, 'the')
      })
      
      it('should return the same number of results', () => {
        // ASSERT
        expect(upperResults.length).toBe(lowerResults.length)
      })
    })
  })
})