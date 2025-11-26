import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import {
  listConversations,
  searchConversations,
  searchConversationsAdvanced,
  getConversation,
  exportConversation,
  getMessage,
  listMessages,
  getMessageStats,
  listSnapshots,
  getSnapshot,
  getSnapshotStats,
  listDiffs,
  getDiff,
  getDiffStats,
  listContexts,
  getContext,
  getContextStats,
  getDatabaseStats,
} from './tools/index.js'

export const createMcpServer = async () => {
  const mcpServer = new McpServer(
    {
      name: 'cursor-conversations',
      version: '2.2.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  )

  // Conversation tools
  mcpServer.tool(
    'list_conversations',
    'List all available conversations from Cursor database',
    {
      limit: z.number().optional().default(50).describe('Maximum number of conversations to return'),
      offset: z.number().optional().default(0).describe('Number of conversations to skip'),
      sortBy: z.enum(['recent_activity', 'created', 'updated']).optional().default('recent_activity'),
    },
    async (args) => {
      const result = await listConversations(args)
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  mcpServer.tool(
    'search_conversations',
    'Search conversations by content',
    {
      query: z.string().describe('Search query'),
      limit: z.number().optional().default(20),
    },
    async (args) => {
      const results = await searchConversations(args.query, args.limit)
      return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] }
    }
  )

  mcpServer.tool(
    'get_conversation',
    'Get a specific conversation by ID',
    {
      conversation_id: z.string().describe('The conversation ID'),
      format: z.enum(['summary', 'full']).optional().default('summary'),
    },
    async (args) => {
      const result = await getConversation(args.conversation_id, args.format)
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  mcpServer.tool(
    'search_conversations_advanced',
    'Advanced search with filters for date range, message count, and status',
    {
      date_from: z.string().optional().describe('Start date (YYYY-MM-DD)'),
      date_to: z.string().optional().describe('End date (YYYY-MM-DD)'),
      min_messages: z.number().optional(),
      max_messages: z.number().optional(),
      status: z.enum(['completed', 'aborted', 'all']).optional().default('all'),
      limit: z.number().optional().default(20),
    },
    async (args) => {
      const results = await searchConversationsAdvanced(args)
      return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] }
    }
  )

  mcpServer.tool(
    'export_conversation',
    'Export a conversation to a file',
    {
      conversation_id: z.string().describe('The conversation ID'),
      format: z.enum(['markdown', 'json']).optional().default('markdown'),
    },
    async (args) => {
      const filepath = await exportConversation(args.conversation_id, args.format)
      return { content: [{ type: 'text', text: `Exported to: ${filepath}` }] }
    }
  )

  // Message tools
  mcpServer.tool(
    'list_messages',
    'List all messages in a conversation',
    {
      conversation_id: z.string().describe('The conversation ID'),
      limit: z.number().optional().default(100),
    },
    async (args) => {
      const result = await listMessages(args.conversation_id, { limit: args.limit })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  mcpServer.tool(
    'get_message',
    'Get a specific message by ID',
    {
      conversation_id: z.string().describe('The conversation ID'),
      message_id: z.string().describe('The message ID'),
    },
    async (args) => {
      const result = await getMessage(args.conversation_id, args.message_id)
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  mcpServer.tool(
    'get_message_stats',
    'Get statistics about all messages',
    {},
    async () => {
      const result = await getMessageStats()
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  // Snapshot tools
  mcpServer.tool(
    'list_snapshots',
    'List file state snapshots for a conversation',
    {
      conversation_id: z.string().describe('The conversation ID'),
      limit: z.number().optional().default(50),
    },
    async (args) => {
      const result = await listSnapshots(args.conversation_id, { limit: args.limit })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  mcpServer.tool(
    'get_snapshot',
    'Get a specific snapshot',
    {
      conversation_id: z.string().describe('The conversation ID'),
      snapshot_id: z.string().describe('The snapshot ID'),
    },
    async (args) => {
      const result = await getSnapshot(args.conversation_id, args.snapshot_id)
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  mcpServer.tool(
    'get_snapshot_stats',
    'Get statistics about all snapshots',
    {},
    async () => {
      const result = await getSnapshotStats()
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  // Diff tools
  mcpServer.tool(
    'list_diffs',
    'List code diffs for a conversation',
    {
      conversation_id: z.string().describe('The conversation ID'),
      limit: z.number().optional().default(50),
    },
    async (args) => {
      const result = await listDiffs(args.conversation_id, { limit: args.limit })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  mcpServer.tool(
    'get_diff',
    'Get a specific diff',
    {
      conversation_id: z.string().describe('The conversation ID'),
      diff_id: z.string().describe('The diff ID'),
    },
    async (args) => {
      const result = await getDiff(args.conversation_id, args.diff_id)
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  mcpServer.tool(
    'get_diff_stats',
    'Get statistics about all diffs',
    {},
    async () => {
      const result = await getDiffStats()
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  // Context tools
  mcpServer.tool(
    'list_contexts',
    'List request contexts for a conversation (git status, project layout, etc.)',
    {
      conversation_id: z.string().describe('The conversation ID'),
      limit: z.number().optional().default(50),
    },
    async (args) => {
      const result = await listContexts(args.conversation_id, { limit: args.limit })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  mcpServer.tool(
    'get_context',
    'Get a specific request context',
    {
      conversation_id: z.string().describe('The conversation ID'),
      context_id: z.string().describe('The context ID'),
    },
    async (args) => {
      const result = await getContext(args.conversation_id, args.context_id)
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  mcpServer.tool(
    'get_context_stats',
    'Get statistics about all contexts',
    {},
    async () => {
      const result = await getContextStats()
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  // Database stats
  mcpServer.tool(
    'get_database_stats',
    'Get comprehensive statistics about the Cursor database',
    {},
    async () => {
      const result = await getDatabaseStats()
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  return { mcpServer }
}
