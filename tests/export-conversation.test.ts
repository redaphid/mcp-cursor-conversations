import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createMcpServer } from '../src/lib/createMcpServer.ts'
import { openDatabase } from '../src/lib/openDatabase.ts'
import { getDbPath } from '../src/lib/getDbPath.ts'
import { listConversations } from '../src/lib/listConversations.ts'
import { existsSync, readFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import type { Database } from 'better-sqlite3'

describe('Export Conversation Tool', () => {
  let server: ReturnType<typeof createMcpServer>
  let db: Database
  let testComposerId: string

  beforeAll(async () => {
    server = createMcpServer()
    const dbPath = getDbPath()
    db = await openDatabase(dbPath)
    
    // Get a conversation ID for testing
    const conversations = await listConversations(db, { limit: 1 })
    if (conversations.conversations && conversations.conversations.length > 0) {
      testComposerId = conversations.conversations[0].composerId
    }
  })

  afterAll(async () => {
    if (db) {
      db.close()
    }
  })

  it('should export conversation to markdown format', async () => {
    if (!testComposerId) {
      console.log('No conversations available for testing')
      return
    }

    const handler = server._requestHandlers.get('tools/call')
    expect(handler).toBeDefined()

    const result = await handler({
      method: 'tools/call',
      params: {
        name: 'export_conversation',
        arguments: {
          composer_id: testComposerId,
          format: 'markdown'
        }
      }
    })

    expect(result.content).toHaveLength(1)
    expect(result.content[0].type).toBe('text')
    
    const exportMessage = result.content[0].text
    expect(exportMessage).toMatch(/^Conversation exported to: \/tmp\/cursor-conversation-.+\.md$/)
    
    // Extract filepath from message
    const filepath = exportMessage.replace('Conversation exported to: ', '')
    
    // Verify file exists
    expect(existsSync(filepath)).toBe(true)
    
    // Verify file content
    const content = readFileSync(filepath, 'utf8')
    expect(content).toContain(`# Conversation: ${testComposerId}`)
    expect(content).toContain('**Created:**')
    expect(content).toContain('**Updated:**')
    expect(content).toContain('**Status:**')
    expect(content).toContain('**Messages:**')
    
    // Clean up
    unlinkSync(filepath)
  })

  it('should export conversation to json format', async () => {
    if (!testComposerId) {
      console.log('No conversations available for testing')
      return
    }

    const handler = server._requestHandlers.get('tools/call')
    expect(handler).toBeDefined()

    const result = await handler({
      method: 'tools/call',
      params: {
        name: 'export_conversation',
        arguments: {
          composer_id: testComposerId,
          format: 'json'
        }
      }
    })

    expect(result.content).toHaveLength(1)
    expect(result.content[0].type).toBe('text')
    
    const exportMessage = result.content[0].text
    expect(exportMessage).toMatch(/^Conversation exported to: \/tmp\/cursor-conversation-.+\.json$/)
    
    // Extract filepath from message
    const filepath = exportMessage.replace('Conversation exported to: ', '')
    
    // Verify file exists
    expect(existsSync(filepath)).toBe(true)
    
    // Verify file content is valid JSON
    const content = readFileSync(filepath, 'utf8')
    const conversation = JSON.parse(content)
    expect(conversation).toHaveProperty('composerId', testComposerId)
    
    // Clean up
    unlinkSync(filepath)
  })

  it('should handle non-existent conversation ID', async () => {
    const handler = server._requestHandlers.get('tools/call')
    expect(handler).toBeDefined()

    const result = await handler({
      method: 'tools/call',
      params: {
        name: 'export_conversation',
        arguments: {
          composer_id: 'non-existent-id',
          format: 'markdown'
        }
      }
    })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('Conversation non-existent-id not found')
  })

  it('should require composer_id parameter', async () => {
    const handler = server._requestHandlers.get('tools/call')
    expect(handler).toBeDefined()

    const result = await handler({
      method: 'tools/call',
      params: {
        name: 'export_conversation',
        arguments: {}
      }
    })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('composer_id parameter is required')
  })
})