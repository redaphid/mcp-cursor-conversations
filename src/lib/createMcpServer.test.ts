import { describe, it, expect, beforeEach } from 'vitest'
import { createMcpServer } from './createMcpServer'

describe('createMcpServer', () => {
  it('should exist', () => {
    expect(createMcpServer).toBeDefined()
  })
  
  it('should be a function', () => {
    expect(typeof createMcpServer).toBe('function')
  })
  
  describe('when creating a server', () => {
    let server
    
    beforeEach(() => {
      // ACT
      server = createMcpServer()
    })
    
    it('should return a server object', () => {
      // ASSERT
      expect(typeof server).toBe('object')
      expect(server).toBeDefined()
    })
    
    it('should have a connect method', () => {
      // ASSERT
      expect(typeof server.connect).toBe('function')
    })
    
    it('should have a setRequestHandler method', () => {
      // ASSERT
      expect(typeof server.setRequestHandler).toBe('function')
    })
  })
})