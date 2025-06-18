import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

describe('Get Conversation Tool', () => {
  let client: Client;
  let transport: StdioClientTransport;
  let testComposerId: string;

  beforeAll(async () => {
    // Create client transport
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

    // Get a valid composer ID from list
    const listResult = await client.callTool({
      name: 'list_conversations',
      arguments: { limit: 1 }
    });
    const response = JSON.parse(listResult.content[0].text);
    if (response.conversations && response.conversations.length > 0) {
      testComposerId = response.conversations[0].composerId;
    }
  });

  afterAll(async () => {
    if (client) {
      await client.close();
    }
  });

  it('should retrieve conversation summary by ID', async () => {
    const result = await client.callTool({
      name: 'get_conversation',
      arguments: { 
        composer_id: testComposerId,
        format: 'summary'
      }
    });

    expect(result).toBeDefined();
    expect(result.isError).toBeFalsy();
    
    const conversation = JSON.parse(result.content[0].text);
    expect(conversation).toHaveProperty('messageCount');
    expect(conversation).toHaveProperty('messages');
    expect(Array.isArray(conversation.messages)).toBe(true);
  });

  it('should retrieve full conversation by ID', async () => {
    const result = await client.callTool({
      name: 'get_conversation',
      arguments: { 
        composer_id: testComposerId,
        format: 'full'
      }
    });

    expect(result).toBeDefined();
    expect(result.isError).toBeFalsy();
    
    const conversation = JSON.parse(result.content[0].text);
    expect(conversation).toHaveProperty('composerId');
    expect(conversation).toHaveProperty('conversation');
    expect(Array.isArray(conversation.conversation)).toBe(true);
    
    // Full format should have more detailed message structure
    if (conversation.conversation.length > 0) {
      const message = conversation.conversation[0];
      expect(message).toHaveProperty('type');
      expect(message).toHaveProperty('bubbleId');
    }
  });

  it('should default to summary format', async () => {
    const result = await client.callTool({
      name: 'get_conversation',
      arguments: { 
        composer_id: testComposerId
      }
    });

    const conversation = JSON.parse(result.content[0].text);
    // Summary format has 'messages' array
    expect(conversation).toHaveProperty('messages');
  });

  it('should return error for missing composer_id', async () => {
    const result = await client.callTool({
      name: 'get_conversation',
      arguments: {}
    });
    
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('composer_id parameter is required');
  });

  it('should return error for non-existent conversation', async () => {
    const result = await client.callTool({
      name: 'get_conversation',
      arguments: { 
        composer_id: 'non-existent-id-12345'
      }
    });
    
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error: Conversation');
  });
});