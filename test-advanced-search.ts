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

  // Example 1: Search for recent conversations
  console.log('\n=== Recent Conversations (Last 30 days) ===');
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentResult = await client.callTool({
    name: 'search_conversations_advanced',
    arguments: {
      date_from: thirtyDaysAgo.toISOString().split('T')[0],
      sort_by: 'date',
      sort_order: 'desc',
      limit: 5
    }
  });
  
  const recentData = JSON.parse(recentResult.content[0].text);
  console.log(`Found ${recentData.total_found} conversations in the last 30 days`);
  recentData.conversations.forEach((conv: any) => {
    console.log(`- ${conv.composer_id.substring(0, 8)}... (${conv.message_count} msgs) - ${conv.preview}`);
    console.log(`  Last updated: ${new Date(conv.last_message_date).toLocaleDateString()}`);
  });

  // Example 2: Find long conversations
  console.log('\n=== Long Conversations (50+ messages) ===');
  const longConvResult = await client.callTool({
    name: 'search_conversations_advanced',
    arguments: {
      min_messages: 50,
      sort_by: 'message_count',
      sort_order: 'desc',
      limit: 5
    }
  });
  
  const longConvData = JSON.parse(longConvResult.content[0].text);
  console.log(`Found ${longConvData.total_found} conversations with 50+ messages`);
  longConvData.conversations.forEach((conv: any) => {
    console.log(`- ${conv.composer_id.substring(0, 8)}... (${conv.message_count} messages) - ${conv.status}`);
    console.log(`  ${conv.preview}`);
  });

  // Example 3: Find aborted conversations
  console.log('\n=== Aborted Conversations ===');
  const abortedResult = await client.callTool({
    name: 'search_conversations_advanced',
    arguments: {
      status: 'aborted',
      sort_by: 'date',
      sort_order: 'desc',
      limit: 5
    }
  });
  
  const abortedData = JSON.parse(abortedResult.content[0].text);
  console.log(`Found ${abortedData.total_found} aborted conversations`);
  abortedData.conversations.forEach((conv: any) => {
    console.log(`- ${conv.composer_id.substring(0, 8)}... (${conv.message_count} msgs)`);
    console.log(`  ${conv.preview}`);
  });

  // Example 4: Find conversations in a specific date range with moderate length
  console.log('\n=== Moderate Length Conversations in 2025 ===');
  const moderateResult = await client.callTool({
    name: 'search_conversations_advanced',
    arguments: {
      date_from: '2025-01-01',
      date_to: '2025-12-31',
      min_messages: 20,
      max_messages: 80,
      status: 'completed',
      sort_by: 'message_count',
      sort_order: 'desc',
      limit: 5
    }
  });
  
  const moderateData = JSON.parse(moderateResult.content[0].text);
  console.log(`Found ${moderateData.total_found} completed conversations with 20-80 messages in 2025`);
  moderateData.conversations.forEach((conv: any) => {
    console.log(`- ${conv.composer_id.substring(0, 8)}... (${conv.message_count} messages)`);
    console.log(`  Date range: ${new Date(conv.first_message_date).toLocaleDateString()} - ${new Date(conv.last_message_date).toLocaleDateString()}`);
    console.log(`  ${conv.preview}`);
  });

  await client.close();
}

main().catch(console.error);