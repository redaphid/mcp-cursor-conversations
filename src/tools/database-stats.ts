import { queryAll, queryCount, KEY_PATTERNS } from '../core/index.js'

/**
 * Get comprehensive database statistics
 */
export const getDatabaseStats = async () => {
  const conversationCount = queryCount(`
    SELECT COUNT(*) as count FROM cursorDiskKV WHERE key LIKE ?
  `, [`${KEY_PATTERNS.CONVERSATION}%`])

  const messageCount = queryCount(`
    SELECT COUNT(*) as count FROM cursorDiskKV WHERE key LIKE ?
  `, [`${KEY_PATTERNS.MESSAGE}%`])

  const snapshotCount = queryCount(`
    SELECT COUNT(*) as count FROM cursorDiskKV WHERE key LIKE ?
  `, [`${KEY_PATTERNS.SNAPSHOT}%`])

  const diffCount = queryCount(`
    SELECT COUNT(*) as count FROM cursorDiskKV WHERE key LIKE ?
  `, [`${KEY_PATTERNS.DIFF}%`])

  const contextCount = queryCount(`
    SELECT COUNT(*) as count FROM cursorDiskKV WHERE key LIKE ?
  `, [`${KEY_PATTERNS.CONTEXT}%`])

  // Get all key prefixes
  const keyPatterns = queryAll<{ prefix: string; cnt: number }>(`
    SELECT
      CASE
        WHEN key LIKE 'composerData:%' THEN 'conversation'
        WHEN key LIKE 'bubbleId:%' THEN 'message'
        WHEN key LIKE 'checkpointId:%' THEN 'snapshot'
        WHEN key LIKE 'codeBlockDiff:%' THEN 'diff'
        WHEN key LIKE 'messageRequestContext:%' THEN 'context'
        WHEN key LIKE 'inlineDiffs-%' THEN 'inlineDiffs'
        WHEN key LIKE 'codeBlockPartialInlineDiffFates:%' THEN 'partialDiffFates'
        ELSE 'other'
      END as prefix,
      COUNT(*) as cnt
    FROM cursorDiskKV
    GROUP BY prefix
    ORDER BY cnt DESC
  `, [])

  return {
    summary: {
      conversations: conversationCount,
      messages: messageCount,
      snapshots: snapshotCount,
      diffs: diffCount,
      contexts: contextCount
    },
    keyPatterns: keyPatterns.reduce((acc, row) => {
      acc[row.prefix] = row.cnt
      return acc
    }, {} as Record<string, number>),
    description: {
      conversations: 'Main conversation metadata and structure',
      messages: 'Individual messages with full content, tool results, code blocks',
      snapshots: 'File state snapshots during conversation',
      diffs: 'Line-level code changes applied during conversation',
      contexts: 'Context at time of each message (git status, project layout, cursor rules)'
    }
  }
}
