import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { openDatabase } from './openDatabase'
import { getDbPath } from './getDbPath'

describe('openDatabase', () => {
  it('should exist', () => {
    expect(openDatabase).toBeDefined()
  })
  
  it('should be a function', () => {
    expect(typeof openDatabase).toBe('function')
  })
  
  describe('when opening the actual Cursor database', () => {
    let dbPath
    let result
    
    beforeEach(async () => {
      // ARRANGE
      dbPath = getDbPath()
      // ACT (async operation)
      result = await openDatabase(dbPath)
    })
    
    it('should return a database object', () => {
      // ASSERT
      expect(typeof result).toBe('object')
      expect(result).toBeDefined()
    })
    
    it('should have a prepare method', () => {
      // ASSERT
      expect(typeof result.prepare).toBe('function')
    })
    
    it('should have a close method', () => {
      // ASSERT
      expect(typeof result.close).toBe('function')
    })
    
    afterEach(() => {
      // CLEANUP
      if (result && result.close) {
        result.close()
      }
    })
  })
})