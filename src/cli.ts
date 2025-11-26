#!/usr/bin/env node
import {
  setDatabasePath,
  listConversations,
  getConversation,
  searchConversations,
  searchConversationsAdvanced,
  exportConversation,
  listMessages,
  getMessage,
  getMessageStats,
  listSnapshots,
  getSnapshot,
  listDiffs,
  getDiff,
  listContexts,
  getContext,
  getDatabaseStats,
} from './lib.js'

const [,, command, ...args] = process.argv

const usage = `
cursor-conversations - Access Cursor IDE conversation database

Usage: cursor-conversations <command> [options]

Commands:
  list [--limit N] [--sort recent_activity|created|updated]
    List conversations

  get <conversationId> [--format summary|full]
    Get a single conversation

  search <query> [--limit N]
    Search conversations by text

  search-advanced [--from DATE] [--to DATE] [--min N] [--max N] [--status completed|aborted|all]
    Advanced search with filters

  export <conversationId> [--format markdown|json]
    Export conversation to file

  messages <conversationId> [--limit N]
    List messages in a conversation

  message <conversationId> <messageId>
    Get a single message

  snapshots <conversationId> [--limit N]
    List snapshots in a conversation

  snapshot <conversationId> <snapshotId>
    Get a single snapshot

  diffs <conversationId> [--limit N]
    List diffs in a conversation

  diff <conversationId> <diffId>
    Get a single diff

  contexts <conversationId> [--limit N]
    List contexts in a conversation

  context <conversationId> <contextId>
    Get a single context

  stats
    Get database statistics

  message-stats
    Get message statistics

Environment:
  CURSOR_DB_PATH    Override default database location

Examples:
  cursor-conversations list --limit 5
  cursor-conversations search "authentication"
  cursor-conversations messages abc-123 --limit 10
  cursor-conversations export abc-123 --format markdown
`

const parseArgs = (args: string[]): Record<string, string> => {
  const result: Record<string, string> = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2)
      result[key] = args[i + 1] || 'true'
      i++
    }
  }
  return result
}

const output = (data: unknown) => {
  console.log(JSON.stringify(data, null, 2))
}

const run = async () => {
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    console.log(usage)
    process.exit(0)
  }

  const opts = parseArgs(args)
  const positional = args.filter(a => !a.startsWith('--'))

  try {
    switch (command) {
      case 'list': {
        const result = await listConversations({
          limit: opts.limit ? parseInt(opts.limit) : undefined,
          sortBy: opts.sort as any,
        })
        output(result)
        break
      }

      case 'get': {
        const [conversationId] = positional
        if (!conversationId) throw new Error('conversationId required')
        const result = await getConversation(conversationId, (opts.format as any) || 'summary')
        output(result)
        break
      }

      case 'search': {
        const query = positional.join(' ')
        if (!query) throw new Error('search query required')
        const result = await searchConversations(query, opts.limit ? parseInt(opts.limit) : undefined)
        output(result)
        break
      }

      case 'search-advanced': {
        const result = await searchConversationsAdvanced({
          date_from: opts.from,
          date_to: opts.to,
          min_messages: opts.min ? parseInt(opts.min) : undefined,
          max_messages: opts.max ? parseInt(opts.max) : undefined,
          status: opts.status as any,
          limit: opts.limit ? parseInt(opts.limit) : undefined,
        })
        output(result)
        break
      }

      case 'export': {
        const [conversationId] = positional
        if (!conversationId) throw new Error('conversationId required')
        const filepath = await exportConversation(conversationId, (opts.format as any) || 'markdown')
        console.log(filepath)
        break
      }

      case 'messages': {
        const [conversationId] = positional
        if (!conversationId) throw new Error('conversationId required')
        const result = await listMessages(conversationId, {
          limit: opts.limit ? parseInt(opts.limit) : undefined,
        })
        output(result)
        break
      }

      case 'message': {
        const [conversationId, messageId] = positional
        if (!conversationId || !messageId) throw new Error('conversationId and messageId required')
        const result = await getMessage(conversationId, messageId)
        output(result)
        break
      }

      case 'snapshots': {
        const [conversationId] = positional
        if (!conversationId) throw new Error('conversationId required')
        const result = await listSnapshots(conversationId, {
          limit: opts.limit ? parseInt(opts.limit) : undefined,
        })
        output(result)
        break
      }

      case 'snapshot': {
        const [conversationId, snapshotId] = positional
        if (!conversationId || !snapshotId) throw new Error('conversationId and snapshotId required')
        const result = await getSnapshot(conversationId, snapshotId)
        output(result)
        break
      }

      case 'diffs': {
        const [conversationId] = positional
        if (!conversationId) throw new Error('conversationId required')
        const result = await listDiffs(conversationId, {
          limit: opts.limit ? parseInt(opts.limit) : undefined,
        })
        output(result)
        break
      }

      case 'diff': {
        const [conversationId, diffId] = positional
        if (!conversationId || !diffId) throw new Error('conversationId and diffId required')
        const result = await getDiff(conversationId, diffId)
        output(result)
        break
      }

      case 'contexts': {
        const [conversationId] = positional
        if (!conversationId) throw new Error('conversationId required')
        const result = await listContexts(conversationId, {
          limit: opts.limit ? parseInt(opts.limit) : undefined,
        })
        output(result)
        break
      }

      case 'context': {
        const [conversationId, contextId] = positional
        if (!conversationId || !contextId) throw new Error('conversationId and contextId required')
        const result = await getContext(conversationId, contextId)
        output(result)
        break
      }

      case 'stats': {
        const result = await getDatabaseStats()
        output(result)
        break
      }

      case 'message-stats': {
        const result = await getMessageStats()
        output(result)
        break
      }

      default:
        console.error(`Unknown command: ${command}`)
        console.log(usage)
        process.exit(1)
    }
  } catch (err) {
    console.error(`Error: ${(err as Error).message}`)
    process.exit(1)
  }
}

run()
