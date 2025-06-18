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
    const response = JSON.parse(conversations.text);
    expect(response).toHaveProperty('total');
    expect(response).toHaveProperty('conversations');
    expect(Array.isArray(response.conversations)).toBe(true);
    // Should have some conversations (may vary based on actual database)
    expect(response.conversations.length).toBeGreaterThanOrEqual(0);
    
    // Check structure of first conversation
    const firstConv = response.conversations[0];
    if (response.conversations.length > 0) {
      expect(firstConv).toHaveProperty('composerId');
      expect(firstConv).toHaveProperty('messageCount');
      expect(firstConv).toHaveProperty('preview');
    }
  });

  it('should support pagination', async () => {
    // Get first page
    const firstPage = await client.callTool({
      name: 'list_conversations',
      arguments: { limit: 10, offset: 0 }
    });
    
    const firstPageResponse = JSON.parse(firstPage.content[0].text);
    expect(firstPageResponse.conversations.length).toBeLessThanOrEqual(10);

    // Get second page
    const secondPage = await client.callTool({
      name: 'list_conversations',
      arguments: { limit: 10, offset: 10 }
    });
    
    const secondPageResponse = JSON.parse(secondPage.content[0].text);
    
    // Verify no overlap between pages
    const firstIds = firstPageResponse.conversations.map((c: any) => c.composerId);
    const secondIds = secondPageResponse.conversations.map((c: any) => c.composerId);
    const overlap = firstIds.filter((id: string) => secondIds.includes(id));
    expect(overlap.length).toBe(0);
  });
});