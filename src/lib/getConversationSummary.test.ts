import { describe, it, expect, beforeEach } from 'vitest'
import { getConversationSummary } from './getConversationSummary'

describe('getConversationSummary', () => {
  it('should exist', () => {
    expect(getConversationSummary).toBeDefined()
  })
  
  it('should be a function', () => {
    expect(typeof getConversationSummary).toBe('function')
  })
  
  describe('when given an empty conversation', () => {
    let conversation
    let result
    
    beforeEach(() => {
      // ARRANGE
      conversation = { conversation: [] }
      // ACT
      result = getConversationSummary(conversation)
    })
    
    it('should return an object', () => {
      // ASSERT
      expect(typeof result).toBe('object')
    })
    
    it('should have messageCount of 0', () => {
      // ASSERT
      expect(result.messageCount).toBe(0)
    })
    
    it('should have preview', () => {
      // ASSERT
      expect(result.preview).toBe('No preview available')
    })
  })
  
  describe('when given a conversation with one message', () => {
    let conversation
    let result
    
    beforeEach(() => {
      // ARRANGE
      conversation = { 
        conversation: [
          { type: 1, text: 'Hello' }
        ] 
      }
      // ACT
      result = getConversationSummary(conversation)
    })
    
    it('should have messageCount of 1', () => {
      // ASSERT
      expect(result.messageCount).toBe(1)
    })
    
    it('should have messages array', () => {
      // ASSERT
      expect(Array.isArray(result.messages)).toBe(true)
    })
    
    describe('when examining the messages', () => {
      let firstMessage
      
      beforeEach(() => {
        // ARRANGE (further arrange based on parent's result)
        firstMessage = result.messages[0]
      })
      
      it('should have one message', () => {
        // ASSERT
        expect(result.messages.length).toBe(1)
      })
      
      it('should have type "user"', () => {
        // ASSERT
        expect(firstMessage.type).toBe('user')
      })
      
      it('should have text "Hello"', () => {
        // ASSERT
        expect(firstMessage.text).toBe('Hello')
      })
    })
  })
})