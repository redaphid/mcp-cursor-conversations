import { describe, it, expect, beforeEach } from 'vitest'
import { listConversations } from './listConversations'

describe('listConversations', () => {
  it('should exist', () => {
    expect(listConversations).toBeDefined()
  })
  
  it('should be a function', () => {
    expect(typeof listConversations).toBe('function')
  })
})