#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import Database from 'better-sqlite3';
import { homedir } from 'os';
import { join } from 'path';
import { existsSync } from 'fs';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Database path detection
function getDefaultDbPath(): string {
  if (process.platform === 'darwin') {
    return join(homedir(), 'Library/Application Support/Cursor/User/globalStorage/state.vscdb');
  } else if (process.platform === 'win32') {
    return join(process.env.APPDATA || '', 'Cursor/User/globalStorage/state.vscdb');
  } else {
    return join(homedir(), '.config/Cursor/User/globalStorage/state.vscdb');
  }
}

const DB_PATH = process.env.CURSOR_DB_PATH || getDefaultDbPath();

// Verify database exists
if (!existsSync(DB_PATH)) {
  console.error(`Cursor database not found at: ${DB_PATH}`);
  console.error('Please set CURSOR_DB_PATH environment variable if your database is in a different location.');
  process.exit(1);
}

// Initialize database connection
const db = new Database(DB_PATH, { readonly: true });

// Create MCP server
const server = new Server(
  {
    name: 'cursor-conversations-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper function to parse conversation data
function parseConversation(key: string, value: string | null) {
  if (!value || value === 'null') return null;
  
  try {
    const data = JSON.parse(value);
    data.composerId = key.split(':', 1)[1];
    return data;
  } catch (e) {
    return null;
  }
}

// Helper function to get conversation summary
function getConversationSummary(conversation: any) {
  const messages = [];
  
  for (const msg of conversation.conversation || []) {
    const messageInfo: any = {
      type: msg.type === 1 ? 'user' : 'assistant',
      bubbleId: msg.bubbleId,
    };
    
    // Extract text from user messages
    if (msg.type === 1) {
      messageInfo.text = msg.text || '';
    } else if (msg.type === 2) {
      // For assistant messages, check both text and responseParts
      if (msg.text) {
        messageInfo.text = msg.text;
      } else {
        // Extract from responseParts if available
        const textParts = [];
        for (const part of msg.responseParts || []) {
          if (part.type === 'text' && part.rawText) {
            textParts.push(part.rawText);
          }
        }
        messageInfo.text = textParts.join('');
      }
    }
    
    if (messageInfo.text) {
      messages.push(messageInfo);
    }
  }
  
  return {
    composerId: conversation.composerId,
    messageCount: messages.length,
    status: conversation.status || 'completed',
    createdAt: conversation.createdAt,
    lastUpdatedAt: conversation.lastUpdatedAt || conversation.createdAt,
    preview: messages[0]?.text?.substring(0, 100) || 'No preview available',
    messages,
  };
}

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_conversations',
        description: 'List all available conversations from Cursor database',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of conversations to return',
              default: 50,
            },
            offset: {
              type: 'number',
              description: 'Number of conversations to skip',
              default: 0,
            },
          },
        },
      },
      {
        name: 'search_conversations',
        description: 'Search conversations by content in Cursor database',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query to find in conversation content',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return',
              default: 20,
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_conversation',
        description: 'Retrieve a specific conversation by ID from Cursor database',
        inputSchema: {
          type: 'object',
          properties: {
            composer_id: {
              type: 'string',
              description: 'The composer ID of the conversation to retrieve',
            },
            format: {
              type: 'string',
              enum: ['summary', 'full'],
              description: 'Format of the conversation data to return',
              default: 'summary',
            },
          },
          required: ['composer_id'],
        },
      },
      {
        name: 'search_conversations_advanced',
        description: 'Advanced search with filters for date range, message count, and status',
        inputSchema: {
          type: 'object',
          properties: {
            date_from: {
              type: 'string',
              description: 'Start date for filtering (ISO 8601 format: YYYY-MM-DD)',
            },
            date_to: {
              type: 'string',
              description: 'End date for filtering (ISO 8601 format: YYYY-MM-DD)',
            },
            min_messages: {
              type: 'number',
              description: 'Minimum number of messages in conversation',
            },
            max_messages: {
              type: 'number',
              description: 'Maximum number of messages in conversation',
            },
            status: {
              type: 'string',
              enum: ['completed', 'aborted', 'all'],
              description: 'Filter by conversation status',
              default: 'all',
            },
            sort_by: {
              type: 'string',
              enum: ['date', 'message_count', 'status'],
              description: 'Sort results by this field',
              default: 'date',
            },
            sort_order: {
              type: 'string',
              enum: ['asc', 'desc'],
              description: 'Sort order',
              default: 'desc',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return',
              default: 20,
            },
          },
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'list_conversations') {
    const limit = args?.limit || 50;
    const offset = args?.offset || 0;

    try {
      // Query all conversations from the database
      const stmt = db.prepare(`
        SELECT key, value 
        FROM cursorDiskKV 
        WHERE key LIKE 'composerData:%'
        ORDER BY key
      `);
      
      const rows = stmt.all() as Array<{ key: string; value: string }>;
      const conversations = [];
      
      for (const row of rows) {
        const conv = parseConversation(row.key, row.value);
        if (conv) {
          const summary = getConversationSummary(conv);
          conversations.push({
            composer_id: summary.composerId,
            message_count: summary.messageCount,
            status: summary.status,
            preview: summary.preview,
            created_at: summary.createdAt ? new Date(summary.createdAt).toISOString() : null,
            updated_at: summary.lastUpdatedAt ? new Date(summary.lastUpdatedAt).toISOString() : null,
          });
        }
      }
      
      // Sort by updated date (most recent first)
      conversations.sort((a, b) => {
        const dateA = a.updated_at || a.created_at || '';
        const dateB = b.updated_at || b.created_at || '';
        return dateB.localeCompare(dateA);
      });
      
      // Apply pagination
      const paginatedConversations = conversations.slice(offset, offset + limit);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              total: conversations.length,
              returned: paginatedConversations.length,
              conversations: paginatedConversations,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error listing conversations: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  if (name === 'search_conversations') {
    const query = args?.query as string;
    const limit = args?.limit || 20;

    if (!query) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Query parameter is required',
          },
        ],
        isError: true,
      };
    }

    try {
      const stmt = db.prepare(`
        SELECT key, value 
        FROM cursorDiskKV 
        WHERE key LIKE 'composerData:%'
      `);
      
      const rows = stmt.all() as Array<{ key: string; value: string }>;
      const results = [];
      const lowerQuery = query.toLowerCase();
      
      for (const row of rows) {
        const conv = parseConversation(row.key, row.value);
        if (!conv) continue;
        
        const summary = getConversationSummary(conv);
        const matches = [];
        
        // Search through messages
        summary.messages.forEach((msg: any, index: number) => {
          if (msg.text && msg.text.toLowerCase().includes(lowerQuery)) {
            matches.push({
              type: msg.type,
              text: msg.text.substring(0, 200) + (msg.text.length > 200 ? '...' : ''),
              index,
            });
          }
        });
        
        if (matches.length > 0) {
          results.push({
            composer_id: summary.composerId,
            message_count: summary.messageCount,
            status: summary.status,
            preview: summary.preview,
            created_at: summary.createdAt ? new Date(summary.createdAt).toISOString() : null,
            updated_at: summary.lastUpdatedAt ? new Date(summary.lastUpdatedAt).toISOString() : null,
            matches: matches.slice(0, 3), // Limit matches per conversation
          });
        }
        
        if (results.length >= limit) break;
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error searching conversations: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  if (name === 'get_conversation') {
    const composerId = args?.composer_id as string;
    const format = args?.format || 'summary';

    if (!composerId) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: composer_id parameter is required',
          },
        ],
        isError: true,
      };
    }

    try {
      const stmt = db.prepare(`
        SELECT value 
        FROM cursorDiskKV 
        WHERE key = ?
      `);
      
      const row = stmt.get(`composerData:${composerId}`) as { value: string } | undefined;
      
      if (!row || !row.value || row.value === 'null') {
        return {
          content: [
            {
              type: 'text',
              text: `Error: Conversation ${composerId} not found`,
            },
          ],
          isError: true,
        };
      }
      
      const conversation = parseConversation(`composerData:${composerId}`, row.value);
      
      if (format === 'summary') {
        const summary = getConversationSummary(conversation);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(summary, null, 2),
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(conversation, null, 2),
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error retrieving conversation: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  if (name === 'search_conversations_advanced') {
    try {
      const dateFrom = args?.date_from ? new Date(args.date_from).getTime() : 0;
      const dateTo = args?.date_to ? new Date(args.date_to).getTime() : Date.now();
      const minMessages = args?.min_messages || 0;
      const maxMessages = args?.max_messages || Infinity;
      const status = args?.status || 'all';
      const sortBy = args?.sort_by || 'date';
      const sortOrder = args?.sort_order || 'desc';
      const limit = args?.limit || 20;

      const stmt = db.prepare(`
        SELECT key, value 
        FROM cursorDiskKV 
        WHERE key LIKE 'composerData:%'
      `);
      
      const rows = stmt.all() as Array<{ key: string; value: string }>;
      const results = [];
      
      for (const row of rows) {
        const conv = parseConversation(row.key, row.value);
        if (!conv) continue;
        
        const summary = getConversationSummary(conv);
        
        // Check date range
        const createdAt = summary.createdAt || 0;
        const lastUpdatedAt = summary.lastUpdatedAt || createdAt;
        
        if (lastUpdatedAt < dateFrom || createdAt > dateTo) continue;
        
        // Check message count range
        if (summary.messageCount < minMessages || summary.messageCount > maxMessages) continue;
        
        // Check status filter
        if (status !== 'all' && summary.status !== status) continue;
        
        results.push({
          composer_id: summary.composerId,
          message_count: summary.messageCount,
          status: summary.status,
          preview: summary.preview,
          created_at: createdAt ? new Date(createdAt).toISOString() : null,
          updated_at: lastUpdatedAt ? new Date(lastUpdatedAt).toISOString() : null,
        });
      }
      
      // Sort results
      results.sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'date':
            const dateA = a.updated_at || a.created_at || '';
            const dateB = b.updated_at || b.created_at || '';
            comparison = dateA.localeCompare(dateB);
            break;
          case 'message_count':
            comparison = a.message_count - b.message_count;
            break;
          case 'status':
            comparison = a.status.localeCompare(b.status);
            break;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
      
      // Apply limit
      const limitedResults = results.slice(0, limit);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              total_found: results.length,
              returned: limitedResults.length,
              conversations: limitedResults,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error in advanced search: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: `Unknown tool: ${name}`,
      },
    ],
    isError: true,
  };
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Cursor Conversations MCP server running on stdio');
  console.error(`Connected to database: ${DB_PATH}`);
}

// Cleanup on exit
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

main().catch((error) => {
  console.error('Server error:', error);
  db.close();
  process.exit(1);
});