import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

describe('Advanced Search Tool', () => {
  let client: Client;
  let transport: StdioClientTransport;

  beforeAll(async () => {
    transport = new StdioClientTransport({
      command: 'node',
      args: ['--experimental-strip-types', 'src/index.ts']
    });

    client = new Client({
      name: 'test-client',
      version: '1.0.0'
    }, {
      capabilities: {}
    });

    await client.connect(transport);
  });

  afterAll(async () => {
    if (client) {
      await client.close();
    }
  });

  it('should search conversations by date range', async () => {
    const result = await client.callTool({
      name: 'search_conversations_advanced',
      arguments: {
        date_from: '2025-01-01',
        date_to: '2025-12-31',
        limit: 5
      }
    });

    expect(result).toBeDefined();
    expect(result.isError).toBeFalsy();
    
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveProperty('total_found');
    expect(data).toHaveProperty('returned');
    expect(data).toHaveProperty('conversations');
    expect(Array.isArray(data.conversations)).toBe(true);
  });

  it('should filter by message count range', async () => {
    const result = await client.callTool({
      name: 'search_conversations_advanced',
      arguments: {
        min_messages: 50,
        max_messages: 100,
        limit: 10
      }
    });

    const data = JSON.parse(result.content[0].text);
    
    // Check all returned conversations are within message count range
    for (const conv of data.conversations) {
      expect(conv.message_count).toBeGreaterThanOrEqual(50);
      expect(conv.message_count).toBeLessThanOrEqual(100);
    }
  });

  it('should filter by conversation status', async () => {
    const completedResult = await client.callTool({
      name: 'search_conversations_advanced',
      arguments: {
        status: 'completed',
        limit: 5
      }
    });

    const completedData = JSON.parse(completedResult.content[0].text);
    
    // Check all returned conversations have completed status
    for (const conv of completedData.conversations) {
      expect(conv.status).toBe('completed');
    }

    // Test aborted status
    const abortedResult = await client.callTool({
      name: 'search_conversations_advanced',
      arguments: {
        status: 'aborted',
        limit: 5
      }
    });

    const abortedData = JSON.parse(abortedResult.content[0].text);
    
    for (const conv of abortedData.conversations) {
      expect(conv.status).toBe('aborted');
    }
  });

  it('should sort results correctly', async () => {
    // Sort by message count descending
    const msgCountDesc = await client.callTool({
      name: 'search_conversations_advanced',
      arguments: {
        sort_by: 'message_count',
        sort_order: 'desc',
        limit: 10
      }
    });

    const msgCountData = JSON.parse(msgCountDesc.content[0].text);
    
    // Check descending order
    for (let i = 1; i < msgCountData.conversations.length; i++) {
      expect(msgCountData.conversations[i-1].message_count)
        .toBeGreaterThanOrEqual(msgCountData.conversations[i].message_count);
    }

    // Sort by date ascending
    const dateAsc = await client.callTool({
      name: 'search_conversations_advanced',
      arguments: {
        sort_by: 'date',
        sort_order: 'asc',
        limit: 10
      }
    });

    const dateData = JSON.parse(dateAsc.content[0].text);
    
    // Check ascending order by date
    for (let i = 1; i < dateData.conversations.length; i++) {
      const prevDate = new Date(dateData.conversations[i-1].last_message_date).getTime();
      const currDate = new Date(dateData.conversations[i].last_message_date).getTime();
      expect(prevDate).toBeLessThanOrEqual(currDate);
    }
  });

  it('should combine multiple filters', async () => {
    const result = await client.callTool({
      name: 'search_conversations_advanced',
      arguments: {
        date_from: '2025-01-01',
        min_messages: 20,
        status: 'completed',
        sort_by: 'message_count',
        sort_order: 'desc',
        limit: 5
      }
    });

    const data = JSON.parse(result.content[0].text);
    
    // Check all filters are applied
    for (const conv of data.conversations) {
      expect(conv.status).toBe('completed');
      expect(conv.message_count).toBeGreaterThanOrEqual(20);
      expect(new Date(conv.last_message_date).getTime())
        .toBeGreaterThanOrEqual(new Date('2025-01-01').getTime());
    }
  });
});