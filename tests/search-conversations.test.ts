import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

describe('Search Conversations Tool', () => {
  let client: Client;
  let transport: StdioClientTransport;

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
  });

  afterAll(async () => {
    if (client) {
      await client.close();
    }
  });

  it('should search conversations by query', async () => {
    // Search for a common term
    const result = await client.callTool({
      name: 'search_conversations',
      arguments: { query: 'shader' }
    });

    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(Array.isArray(result.content)).toBe(true);
    
    const searchResults = JSON.parse(result.content[0].text);
    expect(Array.isArray(searchResults)).toBe(true);
    
    // If results found, check structure
    if (searchResults.length > 0) {
      const firstResult = searchResults[0];
      expect(firstResult).toHaveProperty('composer_id');
      expect(firstResult).toHaveProperty('message_count');
      expect(firstResult).toHaveProperty('preview');
      expect(firstResult).toHaveProperty('matches');
      expect(Array.isArray(firstResult.matches)).toBe(true);
      
      // Check match structure
      if (firstResult.matches.length > 0) {
        const match = firstResult.matches[0];
        expect(match).toHaveProperty('type');
        expect(match).toHaveProperty('text');
        expect(match).toHaveProperty('index');
      }
    }
  });

  it('should handle case-insensitive search', async () => {
    // Test with different cases
    const lowerResult = await client.callTool({
      name: 'search_conversations',
      arguments: { query: 'textbox' }
    });
    
    const upperResult = await client.callTool({
      name: 'search_conversations',
      arguments: { query: 'TEXTBOX' }
    });
    
    const lowerData = JSON.parse(lowerResult.content[0].text);
    const upperData = JSON.parse(upperResult.content[0].text);
    
    // Should find same number of results
    expect(lowerData.length).toBe(upperData.length);
  });

  it('should respect limit parameter', async () => {
    const result = await client.callTool({
      name: 'search_conversations',
      arguments: { query: 'the', limit: 5 }
    });
    
    const searchResults = JSON.parse(result.content[0].text);
    expect(searchResults.length).toBeLessThanOrEqual(5);
  });

  it('should return error for missing query', async () => {
    const result = await client.callTool({
      name: 'search_conversations',
      arguments: {}
    });
    
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Query parameter is required');
  });
});