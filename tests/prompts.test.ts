import { describe, it, expect, beforeAll } from 'vitest'
import { createMcpServer } from '../src/lib/createMcpServer.ts'

describe('MCP Prompts', () => {
  let server: ReturnType<typeof createMcpServer>

  beforeAll(() => {
    server = createMcpServer()
  })

  it('should list available prompts', async () => {
    const handler = server._requestHandlers.get('prompts/list')
    expect(handler).toBeDefined()

    const result = await handler({
      method: 'prompts/list',
      params: {}
    })

    expect(result.prompts).toBeDefined()
    expect(result.prompts).toHaveLength(4)
    
    const promptNames = result.prompts.map(p => p.name)
    expect(promptNames).toContain('recent_coding_work')
    expect(promptNames).toContain('find_conversations_about')
    expect(promptNames).toContain('analyze_conversation')
    expect(promptNames).toContain('project_conversation_timeline')
  })

  it('should return recent_coding_work prompt', async () => {
    const handler = server._requestHandlers.get('prompts/get')
    expect(handler).toBeDefined()

    const result = await handler({
      method: 'prompts/get',
      params: {
        name: 'recent_coding_work',
        arguments: { days: '14', focus: 'bug fixes' }
      }
    })

    expect(result.messages).toHaveLength(1)
    expect(result.messages[0].role).toBe('user')
    expect(result.messages[0].content.text).toContain('14 days')
    expect(result.messages[0].content.text).toContain('bug fixes')
  })

  it('should return find_conversations_about prompt with required topic', async () => {
    const handler = server._requestHandlers.get('prompts/get')
    expect(handler).toBeDefined()

    const result = await handler({
      method: 'prompts/get',
      params: {
        name: 'find_conversations_about',
        arguments: { topic: 'React hooks', limit: '5' }
      }
    })

    expect(result.messages).toHaveLength(1)
    expect(result.messages[0].content.text).toContain('React hooks')
    expect(result.messages[0].content.text).toContain('limit of 5')
  })

  it('should throw error for find_conversations_about without topic', async () => {
    const handler = server._requestHandlers.get('prompts/get')
    expect(handler).toBeDefined()

    await expect(handler({
      method: 'prompts/get',
      params: {
        name: 'find_conversations_about',
        arguments: {}
      }
    })).rejects.toThrow('Topic argument is required')
  })

  it('should return analyze_conversation prompt', async () => {
    const handler = server._requestHandlers.get('prompts/get')
    expect(handler).toBeDefined()

    const result = await handler({
      method: 'prompts/get',
      params: {
        name: 'analyze_conversation',
        arguments: { 
          conversation_id: 'test-123',
          analysis_type: 'code_review'
        }
      }
    })

    expect(result.messages).toHaveLength(1)
    expect(result.messages[0].content.text).toContain('test-123')
    expect(result.messages[0].content.text).toContain('code review perspective')
  })

  it('should return project_conversation_timeline prompt', async () => {
    const handler = server._requestHandlers.get('prompts/get')
    expect(handler).toBeDefined()

    const result = await handler({
      method: 'prompts/get',
      params: {
        name: 'project_conversation_timeline',
        arguments: { 
          project_name: 'my-app',
          time_range: '60'
        }
      }
    })

    expect(result.messages).toHaveLength(1)
    expect(result.messages[0].content.text).toContain('my-app')
    expect(result.messages[0].content.text).toContain('60 days')
  })

  it('should throw error for unknown prompt', async () => {
    const handler = server._requestHandlers.get('prompts/get')
    expect(handler).toBeDefined()

    await expect(handler({
      method: 'prompts/get',
      params: {
        name: 'unknown_prompt',
        arguments: {}
      }
    })).rejects.toThrow('Prompt not found: unknown_prompt')
  })
})