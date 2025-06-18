import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

describe('Conversation Formats E2E', () => {
  let client: Client
  let transport: StdioClientTransport

  beforeAll(async () => {
    transport = new StdioClientTransport({
      command: 'node',
      args: ['--experimental-strip-types', 'src/index.ts']
    })

    client = new Client({
      name: 'test-client',
      version: '1.0.0'
    }, {
      capabilities: {}
    })

    await client.connect(transport)
  })

  afterAll(async () => {
    if (client) {
      await client.close()
    }
  })

  describe('when testing different conversation formats through MCP', () => {
    it('should list conversations from different time periods', async () => {
      const result = await client.callTool({
        name: 'list_conversations',
        arguments: { limit: 100 }
      })

      const response = JSON.parse(result.content[0].text)
      expect(response.conversations).toBeInstanceOf(Array)
      
      // Group by year-month
      const conversationsByMonth = new Map<string, any[]>()
      
      for (const conv of response.conversations) {
        const date = new Date(conv.createdAt)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        
        if (!conversationsByMonth.has(monthKey)) {
          conversationsByMonth.set(monthKey, [])
        }
        conversationsByMonth.get(monthKey)!.push(conv)
      }
      
      console.log('\nConversations by month:')
      for (const [month, convs] of conversationsByMonth) {
        const withMessages = convs.filter(c => c.messageCount > 0).length
        console.log(`${month}: Total: ${convs.length}, With messages: ${withMessages}`)
      }
      
      expect(conversationsByMonth.size).toBeGreaterThan(0)
    })

    it('should retrieve April 2025 conversation with messages', async () => {
      // First get list to find an April conversation
      const listResult = await client.callTool({
        name: 'search_conversations_advanced',
        arguments: {
          date_from: '2025-04-01',
          date_to: '2025-04-30',
          min_messages: 1,
          limit: 5
        }
      })

      const searchResponse = JSON.parse(listResult.content[0].text)
      
      if (searchResponse.conversations.length === 0) {
        console.log('No April 2025 conversations with messages found')
        return
      }

      // Get the full conversation
      const composerId = searchResponse.conversations[0].composer_id
      const convResult = await client.callTool({
        name: 'get_conversation',
        arguments: {
          composer_id: composerId,
          format: 'summary'
        }
      })

      const conversation = JSON.parse(convResult.content[0].text)
      expect(conversation.messageCount).toBeGreaterThan(0)
      expect(conversation.messages).toBeInstanceOf(Array)
      expect(conversation.messages[0]).toHaveProperty('type')
      expect(conversation.messages[0]).toHaveProperty('text')
    })

    it('should retrieve June 2025 conversation with messages', async () => {
      // First get list to find a June conversation
      const listResult = await client.callTool({
        name: 'search_conversations_advanced',
        arguments: {
          date_from: '2025-06-01',
          date_to: '2025-06-30',
          min_messages: 1,
          limit: 5
        }
      })

      const searchResponse = JSON.parse(listResult.content[0].text)
      
      if (searchResponse.conversations.length === 0) {
        console.log('No June 2025 conversations with messages found')
        return
      }

      // Get the full conversation
      const composerId = searchResponse.conversations[0].composer_id
      const convResult = await client.callTool({
        name: 'get_conversation',
        arguments: {
          composer_id: composerId,
          format: 'summary'
        }
      })

      const conversation = JSON.parse(convResult.content[0].text)
      expect(conversation.messageCount).toBeGreaterThan(0)
      expect(conversation.messages).toBeInstanceOf(Array)
      expect(conversation.messages[0]).toHaveProperty('type')
      expect(conversation.messages[0]).toHaveProperty('text')
    })

    it('should search across both old and new format conversations', async () => {
      // Search for a common term that should appear in both formats
      const searchResult = await client.callTool({
        name: 'search_conversations',
        arguments: {
          query: 'function',
          limit: 20
        }
      })

      const results = JSON.parse(searchResult.content[0].text)
      
      if (results.length > 0) {
        // Group results by date to see format distribution
        const resultsByMonth = new Map<string, number>()
        
        for (const result of results) {
          const date = new Date(result.createdAt)
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          resultsByMonth.set(monthKey, (resultsByMonth.get(monthKey) || 0) + 1)
        }
        
        console.log('\nSearch results by month:')
        for (const [month, count] of resultsByMonth) {
          console.log(`${month}: ${count} results`)
        }
        
        // Verify all results have proper structure
        for (const result of results) {
          expect(result).toHaveProperty('composerId')
          expect(result).toHaveProperty('messageCount')
          expect(result).toHaveProperty('matches')
          expect(result.matches).toBeInstanceOf(Array)
        }
      }
    })

    it('should handle conversations with varying message counts', async () => {
      // Get conversations and group by message count
      const result = await client.callTool({
        name: 'list_conversations',
        arguments: { limit: 50 }
      })

      const response = JSON.parse(result.content[0].text)
      
      const byMessageCount = new Map<number, number>()
      let emptyCount = 0
      let withMessagesCount = 0
      
      for (const conv of response.conversations) {
        const count = conv.messageCount
        byMessageCount.set(count, (byMessageCount.get(count) || 0) + 1)
        
        if (count === 0) {
          emptyCount++
          expect(conv.preview).toBe('No preview available')
        } else {
          withMessagesCount++
          expect(conv.preview).not.toBe('No preview available')
        }
      }
      
      console.log('\nConversations by message count:')
      const sortedCounts = Array.from(byMessageCount.entries()).sort((a, b) => a[0] - b[0])
      for (const [count, num] of sortedCounts.slice(0, 5)) {
        console.log(`  ${count} messages: ${num} conversations`)
      }
      
      console.log(`\nTotal empty: ${emptyCount}, with messages: ${withMessagesCount}`)
      
      // Both old and new formats can have empty conversations
      expect(emptyCount + withMessagesCount).toBe(response.conversations.length)
    })
  })
})