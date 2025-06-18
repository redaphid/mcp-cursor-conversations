import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getDbPath } from './getDbPath'
import { homedir } from 'os'

describe('getDbPath', () => {
  it('should exist', () => {
    expect(getDbPath).toBeDefined()
  })
  
  it('should be a function', () => {
    expect(typeof getDbPath).toBe('function')
  })
  
  describe('when called on darwin platform', () => {
    let result
    let originalPlatform
    
    beforeEach(() => {
      originalPlatform = process.platform
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        configurable: true
      })
      result = getDbPath()
    })
    
    afterEach(() => {
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        configurable: true
      })
    })
    
    it('should return a string', () => {
      expect(typeof result).toBe('string')
    })
    
    it('should include "Library/Application Support/Cursor"', () => {
      expect(result).toContain('Library/Application Support/Cursor')
    })
    
    it('should start with the home directory', () => {
      expect(result.startsWith(homedir())).toBe(true)
    })
  })
  
  describe('when called on win32 platform', () => {
    let result
    let originalPlatform
    
    beforeEach(() => {
      originalPlatform = process.platform
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        configurable: true
      })
      result = getDbPath()
    })
    
    afterEach(() => {
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        configurable: true
      })
    })
    
    it('should include "Cursor/User/globalStorage"', () => {
      expect(result).toContain('Cursor/User/globalStorage')
    })
  })
  
  describe('when called on any platform', () => {
    let result
    
    beforeEach(() => {
      result = getDbPath()
    })
    
    it('should end with state.vscdb', () => {
      expect(result.endsWith('state.vscdb')).toBe(true)
    })
  })
})