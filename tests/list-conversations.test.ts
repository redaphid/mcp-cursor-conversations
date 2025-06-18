import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

describe('List Conversations Tool', () => {
  let client: Client;
  let transport: StdioClientTransport;

  beforeAll(async () => {
    // Create client and connect
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

  it('should list all conversations', async () => {
    // Call the list_conversations tool
    const result = await client.callTool({
      name: 'list_conversations',
      arguments: {}
    });

    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(Array.isArray(result.content)).toBe(true);
    
    const conversations = result.content[0];
    expect(conversations.type).toBe('text');
    
    // Parse the JSON response
    const conversationList = JSON.parse(conversations.text);
    expect(Array.isArray(conversationList)).toBe(true);
    // Should have some conversations (may vary based on actual database)
    expect(conversationList.length).toBeGreaterThanOrEqual(0);
    
    // Check structure of first conversation
    const firstConv = conversationList[0];
    if (conversationList.length > 0) {
      expect(firstConv).toHaveProperty('composer_id');
      expect(firstConv).toHaveProperty('message_count');
      expect(firstConv).toHaveProperty('preview');
    }
  });

  it('should support pagination', async () => {
    // Get first page
    const firstPage = await client.callTool({
      name: 'list_conversations',
      arguments: { limit: 10, offset: 0 }
    });
    
    const firstPageData = JSON.parse(firstPage.content[0].text);
    expect(firstPageData.length).toBeLessThanOrEqual(10);

    // Get second page
    const secondPage = await client.callTool({
      name: 'list_conversations',
      arguments: { limit: 10, offset: 10 }
    });
    
    const secondPageData = JSON.parse(secondPage.content[0].text);
    
    // Verify no overlap between pages
    const firstIds = firstPageData.map((c: any) => c.composer_id);
    const secondIds = secondPageData.map((c: any) => c.composer_id);
    const overlap = firstIds.filter((id: string) => secondIds.includes(id));
    expect(overlap.length).toBe(0);
  });
});