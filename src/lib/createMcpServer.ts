import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { writeFileSync } from 'fs'
import { join } from 'path'
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
        prompts: {},
      },
    }
  )

  // Define prompts
  const PROMPTS = {
    recent_coding_work: {
      name: 'recent_coding_work',
      description: 'Find and analyze recent coding conversations from the last few days',
      arguments: [
        {
          name: 'days',
          description: 'Number of days to look back (default: 7)',
          required: false,
        },
        {
          name: 'focus',
          description: 'What to focus on in the analysis (e.g., "bugs", "features", "refactoring")',
          required: false,
        },
      ],
    },
    find_conversations_about: {
      name: 'find_conversations_about',
      description: 'Search for conversations containing specific topics or keywords',
      arguments: [
        {
          name: 'topic',
          description: 'The topic or keywords to search for',
          required: true,
        },
        {
          name: 'limit',
          description: 'Maximum number of conversations to find (default: 10)',
          required: false,
        },
      ],
    },
    analyze_conversation: {
      name: 'analyze_conversation',
      description: 'Export and analyze a specific conversation in detail',
      arguments: [
        {
          name: 'conversation_id',
          description: 'The composer ID of the conversation to analyze',
          required: true,
        },
        {
          name: 'analysis_type',
          description: 'Type of analysis: "summary", "code_review", "learning_notes", or "issues"',
          required: false,
        },
      ],
    },
    project_conversation_timeline: {
      name: 'project_conversation_timeline',
      description: 'Create a timeline of conversations for a specific project or topic',
      arguments: [
        {
          name: 'project_name',
          description: 'Name or keywords related to the project',
          required: true,
        },
        {
          name: 'time_range',
          description: 'Time range in days to look back (default: 30)',
          required: false,
        },
      ],
    },
  }

  // List prompts handler
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: Object.values(PROMPTS),
  }))

  // Get prompt handler
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params
    const prompt = PROMPTS[name]
    
    if (!prompt) {
      throw new Error(`Prompt not found: ${name}`)
    }

    if (name === 'recent_coding_work') {
      const days = args?.days ? parseInt(args.days) : 7
      const focus = args?.focus || 'general development work'
      
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Analyze my recent coding conversations from the last ${days} days, focusing on ${focus}. 

First, use the search_conversations_advanced tool to find conversations from the last ${days} days with more than 3 messages. Then examine the most relevant ones to understand what I've been working on.

Please provide:
1. A summary of the main projects or topics I've been working on
2. Key technical challenges or decisions that came up
3. Any patterns in the types of problems I've been solving
4. Suggestions for follow-up work or areas that might need attention

Use the export_conversation tool for any conversations that seem particularly important for detailed analysis.`,
            },
          },
        ],
      }
    }

    if (name === 'find_conversations_about') {
      const topic = args?.topic
      const limit = args?.limit ? parseInt(args.limit) : 10
      
      if (!topic) {
        throw new Error('Topic argument is required')
      }
      
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Find conversations about "${topic}" in my Cursor history.

Use the search_conversations tool to search for "${topic}" with a limit of ${limit}. Then:

1. List the most relevant conversations found
2. For each conversation, provide:
   - Date and basic info
   - Brief summary of what was discussed
   - Key takeaways or decisions made
3. If any conversations look particularly detailed or important, use export_conversation to analyze them more thoroughly

Focus on practical insights and actionable information from these conversations.`,
            },
          },
        ],
      }
    }

    if (name === 'analyze_conversation') {
      const conversationId = args?.conversation_id
      const analysisType = args?.analysis_type || 'summary'
      
      if (!conversationId) {
        throw new Error('conversation_id argument is required')
      }
      
      const analysisPrompts = {
        summary: 'Provide a comprehensive summary of this conversation, highlighting key points, decisions made, and outcomes.',
        code_review: 'Analyze this conversation from a code review perspective. Look for code quality discussions, architectural decisions, bug fixes, and technical improvements.',
        learning_notes: 'Extract learning points and educational content from this conversation. What new concepts, techniques, or best practices were discussed?',
        issues: 'Identify any problems, bugs, or issues discussed in this conversation, along with their solutions or current status.',
      }
      
      const analysisPrompt = analysisPrompts[analysisType] || analysisPrompts.summary
      
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Analyze conversation ${conversationId} in detail.

First, use the export_conversation tool to export the conversation to a file, then read the full conversation using the Read tool.

Analysis focus: ${analysisPrompt}

Please structure your analysis with:
1. **Context**: When and what this conversation was about
2. **Key Points**: Main topics and decisions discussed  
3. **Technical Details**: Any code, architecture, or technical decisions
4. **Outcomes**: What was accomplished or decided
5. **Follow-up**: Any unresolved items or next steps mentioned`,
            },
          },
        ],
      }
    }

    if (name === 'project_conversation_timeline') {
      const projectName = args?.project_name
      const timeRange = args?.time_range ? parseInt(args.time_range) : 30
      
      if (!projectName) {
        throw new Error('project_name argument is required')
      }
      
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Create a timeline of conversations related to "${projectName}" over the last ${timeRange} days.

Use search_conversations to find conversations mentioning "${projectName}", then use search_conversations_advanced to get conversations from the last ${timeRange} days sorted by date.

Create a chronological timeline showing:
1. **Date**: When each relevant conversation occurred
2. **Topic**: Main focus of each conversation  
3. **Progress**: What was accomplished or decided
4. **Evolution**: How the project evolved over time
5. **Current Status**: Based on the most recent conversations

For conversations with significant detail, use export_conversation to get the full context.

Present this as a clear timeline that shows the project's development journey.`,
            },
          },
        ],
      }
    }

    throw new Error(`Unhandled prompt: ${name}`)
  })

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
            sortBy: {
              type: 'string',
              enum: ['recent_activity', 'created', 'updated'],
              description: 'Sort conversations by: recent_activity (updated or created), created (creation time), updated (last update time)',
              default: 'recent_activity',
            },
            sortOrder: {
              type: 'string',
              enum: ['desc', 'asc'],
              description: 'Sort order: desc (newest first) or asc (oldest first)',
              default: 'desc',
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
      {
        name: 'export_conversation',
        description: 'Export a conversation to a temporary file for Claude to read directly',
        inputSchema: {
          type: 'object',
          properties: {
            composer_id: {
              type: 'string',
              description: 'The composer ID of the conversation to export',
            },
            format: {
              type: 'string',
              enum: ['markdown', 'json'],
              description: 'Export format: markdown (readable) or json (full data)',
              default: 'markdown',
            },
          },
          required: ['composer_id'],
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

      if (name === 'export_conversation') {
        const composerId = args?.composer_id as string
        const format = (args?.format as string) || 'markdown'
        
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
        const getBubbleDataForConversation = (composerId, bubbleId) => getBubbleData(db, composerId, bubbleId)
        
        let content: string
        let extension: string
        
        if (format === 'json') {
          content = JSON.stringify(conversation, null, 2)
          extension = 'json'
        } else {
          // Convert to markdown format
          const messageCount = conversation.messages?.length || 0
          const messageBlocks = conversation.messages?.map((message, index) => {
            const codeBlocksText = message.codeBlocks?.length > 0 
              ? `**Code blocks:**\n${message.codeBlocks.map(block => 
                  `\`\`\`${block.language || ''}\n${block.code}\n\`\`\``
                ).join('\n\n')}\n\n`
              : ''
            
            return `## Message ${index + 1} (${message.role})

${message.content || ''}

${codeBlocksText}`
          }).join('') || ''
          
          content = `# Conversation: ${conversation.composerId}

**Created:** ${conversation.createdAt}
**Updated:** ${conversation.updatedAt}
**Status:** ${conversation.status}
**Messages:** ${messageCount}

${messageBlocks}`
          extension = 'md'
        }
        
        const filename = `cursor-conversation-${composerId}.${extension}`
        const filepath = join('/tmp', filename)
        
        try {
          writeFileSync(filepath, content, 'utf8')
          return {
            content: [
              {
                type: 'text',
                text: `Conversation exported to: ${filepath}`,
              },
            ],
          }
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error writing file: ${error.message}`,
              },
            ],
            isError: true,
          }
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