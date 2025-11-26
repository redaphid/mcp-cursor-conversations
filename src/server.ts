import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { TOOL_ANNOTATIONS } from './utils/index.ts'
import {
  listConversations,
  searchConversations,
  searchConversationsAdvanced,
  getConversation,
  exportConversation,
  getBubble,
  listBubbles,
  getBubbleStats,
  listCheckpoints,
  getCheckpoint,
  getCheckpointStats,
  listCodeDiffs,
  getCodeDiffStats,
  listRequestContexts,
  getRequestContext,
  getRequestContextStats,
  getDatabaseStats,
} from './tools/index.ts'
import { allPrompts } from './prompts/index.ts'

export const createMcpServer = async () => {
  const mcpServer = new McpServer(
    {
      name: 'cursor-conversations',
      version: '2.0.0',
    },
    {
      capabilities: {
        tools: {},
        prompts: { listChanged: true },
      },
    }
  )

  // Register prompts
  for (const prompt of allPrompts) {
    mcpServer.prompt(prompt.name, prompt.metadata, prompt.handler as any)
  }

  // ============================================
  // CONVERSATION TOOLS (existing)
  // ============================================

  mcpServer.tool(
    'list_conversations',
    {
      description: 'List all available conversations from Cursor database',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Maximum number of conversations to return', default: 50 },
          offset: { type: 'number', description: 'Number of conversations to skip', default: 0 },
          sortBy: {
            type: 'string',
            enum: ['recent_activity', 'created', 'updated'],
            description: 'Sort conversations by: recent_activity, created, or updated',
            default: 'recent_activity',
          },
          sortOrder: { type: 'string', enum: ['desc', 'asc'], description: 'Sort order', default: 'desc' },
        },
      },
      annotations: TOOL_ANNOTATIONS.READ_ONLY,
    },
    async (args: any) => {
      const result = await listConversations(args)
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  mcpServer.tool(
    'search_conversations',
    {
      description: 'Search conversations by content in Cursor database',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query to find in conversation content' },
          limit: { type: 'number', description: 'Maximum number of results to return', default: 20 },
        },
        required: ['query'],
      },
      annotations: TOOL_ANNOTATIONS.SEARCH,
    },
    async (args: any) => {
      const results = await searchConversations(args.query, args.limit)
      return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] }
    }
  )

  mcpServer.tool(
    'get_conversation',
    {
      description: 'Retrieve a specific conversation by ID from Cursor database',
      inputSchema: {
        type: 'object',
        properties: {
          composer_id: { type: 'string', description: 'The composer ID of the conversation to retrieve' },
          format: {
            type: 'string',
            enum: ['summary', 'full'],
            description: 'Format of the conversation data to return',
            default: 'summary',
          },
        },
        required: ['composer_id'],
      },
      annotations: TOOL_ANNOTATIONS.READ_ONLY,
    },
    async (args: any) => {
      try {
        const result = await getConversation(args.composer_id, args.format)
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${(error as Error).message}` }], isError: true }
      }
    }
  )

  mcpServer.tool(
    'search_conversations_advanced',
    {
      description: 'Advanced search with filters for date range, message count, and status',
      inputSchema: {
        type: 'object',
        properties: {
          date_from: { type: 'string', description: 'Start date for filtering (ISO 8601 format: YYYY-MM-DD)' },
          date_to: { type: 'string', description: 'End date for filtering (ISO 8601 format: YYYY-MM-DD)' },
          min_messages: { type: 'number', description: 'Minimum number of messages in conversation' },
          max_messages: { type: 'number', description: 'Maximum number of messages in conversation' },
          status: { type: 'string', enum: ['completed', 'aborted', 'all'], description: 'Filter by conversation status', default: 'all' },
          sort_by: { type: 'string', enum: ['date', 'message_count', 'status'], description: 'Sort results by this field', default: 'date' },
          sort_order: { type: 'string', enum: ['asc', 'desc'], description: 'Sort order', default: 'desc' },
          limit: { type: 'number', description: 'Maximum number of results to return', default: 20 },
        },
      },
      annotations: TOOL_ANNOTATIONS.SEARCH,
    },
    async (args: any) => {
      const results = await searchConversationsAdvanced(args)
      return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] }
    }
  )

  mcpServer.tool(
    'export_conversation',
    {
      description: 'Export a conversation to a temporary file for Claude to read directly',
      inputSchema: {
        type: 'object',
        properties: {
          composer_id: { type: 'string', description: 'The composer ID of the conversation to export' },
          format: { type: 'string', enum: ['markdown', 'json'], description: 'Export format', default: 'markdown' },
        },
        required: ['composer_id'],
      },
      annotations: TOOL_ANNOTATIONS.EXPORT,
    },
    async (args: any) => {
      try {
        const filepath = await exportConversation(args.composer_id, args.format)
        return { content: [{ type: 'text', text: `Conversation exported to: ${filepath}` }] }
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${(error as Error).message}` }], isError: true }
      }
    }
  )

  // ============================================
  // BUBBLE (MESSAGE) TOOLS - NEW!
  // ============================================

  mcpServer.tool(
    'list_bubbles',
    {
      description: 'List all individual messages (bubbles) in a conversation with metadata',
      inputSchema: {
        type: 'object',
        properties: {
          composer_id: { type: 'string', description: 'The composer ID of the conversation' },
          limit: { type: 'number', description: 'Maximum number of bubbles to return', default: 100 },
        },
        required: ['composer_id'],
      },
      annotations: TOOL_ANNOTATIONS.READ_ONLY,
    },
    async (args: any) => {
      try {
        const result = await listBubbles(args.composer_id, { limit: args.limit })
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${(error as Error).message}` }], isError: true }
      }
    }
  )

  mcpServer.tool(
    'get_bubble',
    {
      description: 'Get full details of a specific message (bubble) including tool results, code blocks, and token counts',
      inputSchema: {
        type: 'object',
        properties: {
          composer_id: { type: 'string', description: 'The composer ID of the conversation' },
          bubble_id: { type: 'string', description: 'The bubble ID of the message' },
        },
        required: ['composer_id', 'bubble_id'],
      },
      annotations: TOOL_ANNOTATIONS.READ_ONLY,
    },
    async (args: any) => {
      try {
        const result = await getBubble(args.composer_id, args.bubble_id)
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${(error as Error).message}` }], isError: true }
      }
    }
  )

  mcpServer.tool(
    'get_bubble_stats',
    {
      description: 'Get statistics about all message bubbles in the database',
      inputSchema: { type: 'object', properties: {} },
      annotations: TOOL_ANNOTATIONS.READ_ONLY,
    },
    async () => {
      const result = await getBubbleStats()
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  // ============================================
  // CHECKPOINT TOOLS - NEW!
  // ============================================

  mcpServer.tool(
    'list_checkpoints',
    {
      description: 'List file state checkpoints for a conversation (files modified during the conversation)',
      inputSchema: {
        type: 'object',
        properties: {
          composer_id: { type: 'string', description: 'The composer ID of the conversation' },
          limit: { type: 'number', description: 'Maximum number of checkpoints to return', default: 50 },
        },
        required: ['composer_id'],
      },
      annotations: TOOL_ANNOTATIONS.READ_ONLY,
    },
    async (args: any) => {
      try {
        const result = await listCheckpoints(args.composer_id, { limit: args.limit })
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${(error as Error).message}` }], isError: true }
      }
    }
  )

  mcpServer.tool(
    'get_checkpoint',
    {
      description: 'Get full details of a specific checkpoint (files, folders, inline diffs)',
      inputSchema: {
        type: 'object',
        properties: {
          composer_id: { type: 'string', description: 'The composer ID of the conversation' },
          checkpoint_id: { type: 'string', description: 'The checkpoint ID' },
        },
        required: ['composer_id', 'checkpoint_id'],
      },
      annotations: TOOL_ANNOTATIONS.READ_ONLY,
    },
    async (args: any) => {
      try {
        const result = await getCheckpoint(args.composer_id, args.checkpoint_id)
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${(error as Error).message}` }], isError: true }
      }
    }
  )

  // ============================================
  // CODE DIFF TOOLS - NEW!
  // ============================================

  mcpServer.tool(
    'list_code_diffs',
    {
      description: 'List code diffs (line-level changes) made during a conversation',
      inputSchema: {
        type: 'object',
        properties: {
          composer_id: { type: 'string', description: 'The composer ID of the conversation' },
          limit: { type: 'number', description: 'Maximum number of diffs to return', default: 50 },
        },
        required: ['composer_id'],
      },
      annotations: TOOL_ANNOTATIONS.READ_ONLY,
    },
    async (args: any) => {
      try {
        const result = await listCodeDiffs(args.composer_id, { limit: args.limit })
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${(error as Error).message}` }], isError: true }
      }
    }
  )

  mcpServer.tool(
    'get_code_diff_stats',
    {
      description: 'Get statistics about all code diffs in the database',
      inputSchema: { type: 'object', properties: {} },
      annotations: TOOL_ANNOTATIONS.READ_ONLY,
    },
    async () => {
      const result = await getCodeDiffStats()
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  // ============================================
  // REQUEST CONTEXT TOOLS - NEW!
  // ============================================

  mcpServer.tool(
    'list_request_contexts',
    {
      description: 'List request contexts for a conversation (git status, project layout, cursor rules at time of each request)',
      inputSchema: {
        type: 'object',
        properties: {
          composer_id: { type: 'string', description: 'The composer ID of the conversation' },
          limit: { type: 'number', description: 'Maximum number of contexts to return', default: 50 },
        },
        required: ['composer_id'],
      },
      annotations: TOOL_ANNOTATIONS.READ_ONLY,
    },
    async (args: any) => {
      try {
        const result = await listRequestContexts(args.composer_id, { limit: args.limit })
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${(error as Error).message}` }], isError: true }
      }
    }
  )

  mcpServer.tool(
    'get_request_context',
    {
      description: 'Get full request context details (git status, project layout, cursor rules, todos)',
      inputSchema: {
        type: 'object',
        properties: {
          composer_id: { type: 'string', description: 'The composer ID of the conversation' },
          context_id: { type: 'string', description: 'The context ID' },
        },
        required: ['composer_id', 'context_id'],
      },
      annotations: TOOL_ANNOTATIONS.READ_ONLY,
    },
    async (args: any) => {
      try {
        const result = await getRequestContext(args.composer_id, args.context_id)
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${(error as Error).message}` }], isError: true }
      }
    }
  )

  // ============================================
  // DATABASE STATS TOOL - NEW!
  // ============================================

  mcpServer.tool(
    'get_database_stats',
    {
      description: 'Get comprehensive statistics about the Cursor database (conversations, messages, checkpoints, diffs, contexts)',
      inputSchema: { type: 'object', properties: {} },
      annotations: TOOL_ANNOTATIONS.READ_ONLY,
    },
    async () => {
      const result = await getDatabaseStats()
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  return { mcpServer }
}
