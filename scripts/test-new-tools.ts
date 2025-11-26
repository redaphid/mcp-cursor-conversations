#!/usr/bin/env node
// Quick test of new tools

import { getDatabaseStats } from '../src/tools/database-stats.ts'
import { listBubbles, getBubbleStats } from '../src/tools/get-bubble.ts'
import { listCheckpoints } from '../src/tools/get-checkpoints.ts'
import { listCodeDiffs, getCodeDiffStats } from '../src/tools/get-code-diffs.ts'
import { listRequestContexts, getRequestContextStats } from '../src/tools/get-request-context.ts'
import { searchConversationsAdvanced } from '../src/tools/search-conversations-advanced.ts'

async function main() {
  console.log('=== Testing New Tools ===\n')

  // 1. Database stats
  console.log('1. Database Stats:')
  const stats = await getDatabaseStats()
  console.log(JSON.stringify(stats, null, 2))
  console.log()

  // 2. Find a conversation with messages
  console.log('2. Finding a conversation with messages...')
  const convos = await searchConversationsAdvanced({ min_messages: 10, limit: 1 })
  if (convos.conversations.length === 0) {
    console.log('No conversations with 10+ messages found')
    return
  }
  const composerId = convos.conversations[0].composer_id
  console.log(`Using conversation: ${composerId}\n`)

  // 3. List bubbles
  console.log('3. List Bubbles:')
  const bubbles = await listBubbles(composerId, { limit: 5 })
  console.log(JSON.stringify(bubbles, null, 2))
  console.log()

  // 4. Bubble stats
  console.log('4. Bubble Stats:')
  const bubbleStats = await getBubbleStats()
  console.log(JSON.stringify(bubbleStats, null, 2))
  console.log()

  // 5. List checkpoints
  console.log('5. List Checkpoints:')
  const checkpoints = await listCheckpoints(composerId, { limit: 3 })
  console.log(JSON.stringify(checkpoints, null, 2))
  console.log()

  // 6. Code diff stats
  console.log('6. Code Diff Stats:')
  const diffStats = await getCodeDiffStats()
  console.log(JSON.stringify(diffStats, null, 2))
  console.log()

  // 7. List code diffs
  console.log('7. List Code Diffs:')
  const diffs = await listCodeDiffs(composerId, { limit: 3 })
  console.log(JSON.stringify(diffs, null, 2))
  console.log()

  // 8. Request context stats
  console.log('8. Request Context Stats:')
  const ctxStats = await getRequestContextStats()
  console.log(JSON.stringify(ctxStats, null, 2))
  console.log()

  // 9. List request contexts
  console.log('9. List Request Contexts:')
  const contexts = await listRequestContexts(composerId, { limit: 3 })
  console.log(JSON.stringify(contexts, null, 2))

  console.log('\n=== All tests passed! ===')
}

main().catch(console.error)
