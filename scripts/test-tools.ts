#!/usr/bin/env node
/**
 * CLI tool to test business logic directly
 * Usage: CURSOR_DB_PATH=./db/2025-11-25.db node --experimental-strip-types scripts/test-tools.ts [command] [args...]
 *
 * Commands:
 *   stats                          - Get database statistics
 *   bubbles <composer_id> [limit]  - List bubbles for a conversation
 *   diffs <composer_id> [limit]    - List code diffs for a conversation
 *   contexts <composer_id> [limit] - List request contexts for a conversation
 *   checkpoints <composer_id>      - List checkpoints for a conversation
 *   search <query> [limit]         - Search conversations
 *   composers [limit]              - List composer IDs with bubble counts
 */

import { getDatabaseStats } from '../src/tools/database-stats.ts'
import { listBubbles, getBubbleStats } from '../src/tools/get-bubble.ts'
import { listCodeDiffs, getCodeDiffStats } from '../src/tools/get-code-diffs.ts'
import { listRequestContexts } from '../src/tools/get-request-context.ts'
import { listCheckpoints } from '../src/tools/get-checkpoints.ts'
import { searchConversations } from '../src/tools/search-conversations.ts'
import { queryAll, KEY_PATTERNS } from '../src/core/index.ts'

const [,, command, ...args] = process.argv

async function main() {
  if (!process.env.CURSOR_DB_PATH) {
    console.log('Tip: Set CURSOR_DB_PATH to use a specific database')
    console.log('Example: CURSOR_DB_PATH=./db/2025-11-25.db node --experimental-strip-types scripts/test-tools.ts stats\n')
  }

  switch (command) {
    case 'stats': {
      const stats = await getDatabaseStats()
      console.log(JSON.stringify(stats, null, 2))
      break
    }

    case 'bubbles': {
      const [composerId, limit = '10'] = args
      if (!composerId) {
        console.error('Usage: bubbles <composer_id> [limit]')
        process.exit(1)
      }
      const result = await listBubbles(composerId, { limit: parseInt(limit) })
      console.log(JSON.stringify(result, null, 2))
      break
    }

    case 'diffs': {
      const [composerId, limit = '10'] = args
      if (!composerId) {
        console.error('Usage: diffs <composer_id> [limit]')
        process.exit(1)
      }
      const result = await listCodeDiffs(composerId, { limit: parseInt(limit) })
      console.log(JSON.stringify(result, null, 2))
      break
    }

    case 'contexts': {
      const [composerId, limit = '10'] = args
      if (!composerId) {
        console.error('Usage: contexts <composer_id> [limit]')
        process.exit(1)
      }
      const result = await listRequestContexts(composerId, { limit: parseInt(limit) })
      console.log(JSON.stringify(result, null, 2))
      break
    }

    case 'checkpoints': {
      const [composerId, limit = '10'] = args
      if (!composerId) {
        console.error('Usage: checkpoints <composer_id> [limit]')
        process.exit(1)
      }
      const result = await listCheckpoints(composerId, { limit: parseInt(limit) })
      console.log(JSON.stringify(result, null, 2))
      break
    }

    case 'search': {
      const [query, limit = '10'] = args
      if (!query) {
        console.error('Usage: search <query> [limit]')
        process.exit(1)
      }
      const result = await searchConversations(query, parseInt(limit))
      console.log(JSON.stringify(result, null, 2))
      break
    }

    case 'composers': {
      const [limit = '20'] = args
      // Get distinct composer IDs that have bubbles
      const rows = queryAll<{ composer_id: string; cnt: number }>(`
        SELECT
          substr(key, 10, 36) as composer_id,
          COUNT(*) as cnt
        FROM cursorDiskKV
        WHERE key LIKE ?
        GROUP BY composer_id
        ORDER BY cnt DESC
        LIMIT ?
      `, [`${KEY_PATTERNS.BUBBLE_ID}%`, parseInt(limit)])
      console.log('Composer IDs with bubble counts:')
      console.log(JSON.stringify(rows, null, 2))
      break
    }

    default:
      console.log(`
Usage: CURSOR_DB_PATH=./db/2025-11-25.db node --experimental-strip-types scripts/test-tools.ts [command] [args...]

Commands:
  stats                          - Get database statistics
  bubbles <composer_id> [limit]  - List bubbles for a conversation
  diffs <composer_id> [limit]    - List code diffs for a conversation
  contexts <composer_id> [limit] - List request contexts for a conversation
  checkpoints <composer_id>      - List checkpoints for a conversation
  search <query> [limit]         - Search conversations
  composers [limit]              - List composer IDs with bubble counts
`)
  }
}

main().catch(console.error)
