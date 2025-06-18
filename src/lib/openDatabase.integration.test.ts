import { describe, it, expect, beforeEach } from 'vitest'
import { openDatabase } from './openDatabase'
import { getDbPath } from './getDbPath'

describe('openDatabase integration', () => {
  describe('when opening the actual Cursor database', () => {
    let dbPath
    let db
    
    beforeEach(async () => {
      // ARRANGE
      dbPath = getDbPath()
      // ACT
      db = await openDatabase(dbPath)
    })
    
    it('should return a database connection', () => {
      // ASSERT
      expect(db).toBeDefined()
    })
    
    it('should be able to prepare statements', () => {
      // ASSERT
      expect(typeof db.prepare).toBe('function')
    })
    
    describe('when querying for conversations', () => {
      let statement
      let rows
      
      beforeEach(() => {
        // ARRANGE
        statement = db.prepare(`
          SELECT COUNT(*) as count 
          FROM cursorDiskKV 
          WHERE key LIKE 'composerData:%'
        `)
        // ACT
        rows = statement.all()
      })
      
      it('should return results', () => {
        // ASSERT
        expect(Array.isArray(rows)).toBe(true)
      })
      
      it('should have at least one row', () => {
        // ASSERT
        expect(rows.length).toBeGreaterThan(0)
      })
      
      it('should have a count property', () => {
        // ASSERT
        expect(rows[0]).toHaveProperty('count')
      })
    })
  })
})