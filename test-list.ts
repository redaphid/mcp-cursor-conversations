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
  
  // List conversations
  const result = await client.callTool({
    name: 'list_conversations',
    arguments: { limit: 10 }
  });
  
  const conversations = JSON.parse(result.content[0].text);
  console.log(JSON.stringify(conversations, null, 2));
  
  await client.close();
}

main().catch(console.error);