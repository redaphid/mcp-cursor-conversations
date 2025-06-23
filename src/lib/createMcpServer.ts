import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { openDatabase } from './openDatabase.ts'
import { getDbPath } from './getDbPath.ts'
import { listConversations } from './listConversations.ts'
import { searchConversations } from './searchConversations.ts'
import { searchConversationsAdvanced } from './searchConversationsAdvanced.ts'
import { parseConversation } from './parseConversation.ts'
import { getConversationSummary } from './getConversationSummary.ts'
import { getBubbleData } from './getBubbleData.ts'

export const createMcpServer = () => {
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
  )

  // List tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
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
  }))

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params
    const dbPath = getDbPath()
    const db = await openDatabase(dbPath)

    try {
      if (name === 'list_conversations') {
        const result = await listConversations(db, args)
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        }
      }

      if (name === 'search_conversations') {
        const query = args?.query as string
        if (!query) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: Query parameter is required',
              },
            ],
            isError: true,
          }
        }

        const results = await searchConversations(db, query, args?.limit)
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2),
            },
          ],
        }
      }

      if (name === 'get_conversation') {
        const composerId = args?.composer_id as string
        if (!composerId) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: composer_id parameter is required',
              },
            ],
            isError: true,
          }
        }

        const stmt = db.prepare(`
          SELECT value 
          FROM cursorDiskKV 
          WHERE key = ?
        `)
        
        const row = stmt.get(`composerData:${composerId}`) as { value: string } | undefined
        
        if (!row || !row.value || row.value === 'null') {
          return {
            content: [
              {
                type: 'text',
                text: `Error: Conversation ${composerId} not found`,
              },
            ],
            isError: true,
          }
        }
        
        const conversation = parseConversation(`composerData:${composerId}`, row.value)
        
        if (args?.format === 'full') {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(conversation, null, 2),
              },
            ],
          }
        }
        
        const getBubbleDataForConversation = (composerId, bubbleId) => getBubbleData(db, composerId, bubbleId)
        const summary = getConversationSummary(conversation, getBubbleDataForConversation)
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(summary, null, 2),
            },
          ],
        }
      }

      if (name === 'search_conversations_advanced') {
        const results = await searchConversationsAdvanced(db, args)
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2),
            },
          ],
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
      }
    } finally {
      db.close()
    }
  })

  return server
}