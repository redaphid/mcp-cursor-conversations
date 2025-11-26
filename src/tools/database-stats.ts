import { queryAll, queryCount, KEY_PATTERNS } from '../core/index.js'

/**
 * Get comprehensive database statistics
 */
export const getDatabaseStats = async () => {
  const composerCount = queryCount(`
    SELECT COUNT(*) as count FROM cursorDiskKV WHERE key LIKE ?
  `, [`${KEY_PATTERNS.COMPOSER_DATA}%`])

  const bubbleCount = queryCount(`
    SELECT COUNT(*) as count FROM cursorDiskKV WHERE key LIKE ?
  `, [`${KEY_PATTERNS.BUBBLE_ID}%`])

  const checkpointCount = queryCount(`
    SELECT COUNT(*) as count FROM cursorDiskKV WHERE key LIKE ?
  `, [`${KEY_PATTERNS.CHECKPOINT_ID}%`])

  const codeBlockDiffCount = queryCount(`
    SELECT COUNT(*) as count FROM cursorDiskKV WHERE key LIKE ?
  `, [`${KEY_PATTERNS.CODE_BLOCK_DIFF}%`])

  const messageRequestContextCount = queryCount(`
    SELECT COUNT(*) as count FROM cursorDiskKV WHERE key LIKE ?
  `, [`${KEY_PATTERNS.MESSAGE_REQUEST_CONTEXT}%`])

  // Get all key prefixes to find any new patterns
  const keyPatterns = queryAll<{ prefix: string; cnt: number }>(`
    SELECT
      CASE
        WHEN key LIKE 'composerData:%' THEN 'composerData'
        WHEN key LIKE 'bubbleId:%' THEN 'bubbleId'
        WHEN key LIKE 'checkpointId:%' THEN 'checkpointId'
        WHEN key LIKE 'codeBlockDiff:%' THEN 'codeBlockDiff'
        WHEN key LIKE 'messageRequestContext:%' THEN 'messageRequestContext'
        WHEN key LIKE 'inlineDiffs-%' THEN 'inlineDiffs'
        WHEN key LIKE 'codeBlockPartialInlineDiffFates:%' THEN 'codeBlockPartialInlineDiffFates'
        ELSE 'other'
      END as prefix,
      COUNT(*) as cnt
    FROM cursorDiskKV
    GROUP BY prefix
    ORDER BY cnt DESC
  `, [])

  return {
    summary: {
      conversations: composerCount,
      messages: bubbleCount,
      checkpoints: checkpointCount,
      codeDiffs: codeBlockDiffCount,
      requestContexts: messageRequestContextCount
    },
    keyPatterns: keyPatterns.reduce((acc, row) => {
      acc[row.prefix] = row.cnt
      return acc
    }, {} as Record<string, number>),
    description: {
      conversations: 'Main conversation metadata and structure',
      messages: 'Individual message bubbles with full content, tool results, code blocks',
      checkpoints: 'File state snapshots during conversation',
      codeDiffs: 'Line-level code changes applied during conversation',
      requestContexts: 'Context at time of each request (git status, project layout, cursor rules)'
    }
  }
}
