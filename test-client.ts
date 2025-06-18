#!/usr/bin/env node --experimental-strip-types
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function main() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['--experimental-strip-types', 'src/index.ts']
  });

  const client = new Client({
    name: 'test-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  await client.connect(transport);
  console.log('Connected to MCP server');

  // List conversations
  console.log('\n=== Listing Conversations ===');
  const listResult = await client.callTool({
    name: 'list_conversations',
    arguments: { limit: 5 }
  });
  console.log(JSON.parse(listResult.content[0].text));

  // Search conversations
  console.log('\n=== Searching for "shader" ===');
  const searchResult = await client.callTool({
    name: 'search_conversations',
    arguments: { query: 'shader', limit: 3 }
  });
  console.log(JSON.parse(searchResult.content[0].text));

  // Get specific conversation
  const conversations = JSON.parse(listResult.content[0].text);
  if (conversations.length > 0) {
    console.log('\n=== Getting First Conversation (Summary) ===');
    const getResult = await client.callTool({
      name: 'get_conversation',
      arguments: { 
        composer_id: conversations[0].composer_id,
        format: 'summary'
      }
    });
    const conv = JSON.parse(getResult.content[0].text);
    console.log(`Conversation ${conv.composer_id}: ${conv.messages.length} messages`);
    console.log(`First message: ${conv.messages[0]?.text?.substring(0, 100)}...`);
  }

  await client.close();
}

main().catch(console.error);