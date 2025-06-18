import { describe, it, expect, beforeEach } from 'vitest'
import { getBubbleData } from './getBubbleData.ts'
import { openDatabase } from './openDatabase.ts'
import { getDbPath } from './getDbPath.ts'

describe('getBubbleData', () => {
  describe('when bubble data exists', () => {
    let result
    
    beforeEach(async () => {
      const dbPath = getDbPath()
      const db = await openDatabase(dbPath)
      try {
        result = getBubbleData(db, 'e0188e6d-d6a7-4b64-a093-7b3eb9a96566', 'f73d97ac-baa6-4115-b64e-d898cf2b5a26')
      } finally {
        db.close()
      }
    })
    
    it('should return parsed bubble data', () => {
      if (result) {
        expect(result).toHaveProperty('bubbleId')
        expect(result).toHaveProperty('type')
      }
    })
  })
  
  describe('when bubble data does not exist', () => {
    let result
    
    beforeEach(async () => {
      const dbPath = getDbPath()
      const db = await openDatabase(dbPath)
      try {
        result = getBubbleData(db, 'non-existent', 'non-existent')
      } finally {
        db.close()
      }
    })
    
    it('should return null', () => {
      expect(result).toBeNull()
    })
  })
})