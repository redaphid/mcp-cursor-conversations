import { describe, it, expect, beforeEach } from 'vitest'
import { parseConversation } from './parseConversation'

describe('parseConversation', () => {
  it('should exist', () => {
    expect(parseConversation).toBeDefined()
  })
  
  it('should be a function', () => {
    expect(typeof parseConversation).toBe('function')
  })
  
  describe('when given a null value', () => {
    let result
    
    beforeEach(() => {
      result = parseConversation('key', null)
    })
    
    it('should return null', () => {
      expect(result).toBe(null)
    })
  })
  
  describe('when given a valid JSON string', () => {
    let result
    
    beforeEach(() => {
      result = parseConversation('composerData:123', '{"test": "value"}')
    })
    
    it('should return an object', () => {
      expect(typeof result).toBe('object')
    })
    
    it('should not be null', () => {
      expect(result).not.toBe(null)
    })
    
    it('should have the test property', () => {
      expect(result.test).toBe('value')
    })
    
    it('should add composerId from key', () => {
      expect(result.composerId).toBe('123')
    })
  })
})