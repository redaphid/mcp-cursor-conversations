import { queryAll, KEY_PATTERNS } from '../core/index.ts'
import type { CodeBlockDiff } from '../core/types.ts'

/**
 * Get all code diffs for a conversation
 */
export const listCodeDiffs = async (composerId: string, options: { limit?: number } = {}) => {
  const { limit = 50 } = options
  const pattern = `${KEY_PATTERNS.CODE_BLOCK_DIFF}${composerId}:%`

  const rows = queryAll<{ key: string; value: string }>(`
    SELECT key, value
    FROM cursorDiskKV
    WHERE key LIKE ?
    LIMIT ?
  `, [pattern, limit])

  const diffs: Array<{ diffId: string; data: CodeBlockDiff }> = []

  for (const row of rows) {
    if (!row.value || row.value === 'null') continue
    try {
      const keyParts = row.key.split(':')
      const diffId = keyParts.slice(2).join(':')

      const data = JSON.parse(row.value) as CodeBlockDiff
      diffs.push({ diffId, data })
    } catch {
      continue
    }
  }

  return {
    composerId,
    count: diffs.length,
    diffs: diffs.map(d => ({
      diffId: d.diffId,
      changesCount: d.data.newModelDiffWrtV0?.length || 0,
      changes: d.data.newModelDiffWrtV0?.map(change => ({
        startLine: change.original.startLineNumber,
        endLine: change.original.endLineNumberExclusive,
        linesAdded: change.modified.length,
        preview: change.modified.slice(0, 3).join('\n').substring(0, 200)
      })) || []
    }))
  }
}

/**
 * Get code diff statistics
 */
export const getCodeDiffStats = async () => {
  const totalCount = queryAll<{ count: number }>(`
    SELECT COUNT(*) as count
    FROM cursorDiskKV
    WHERE key LIKE ?
  `, [`${KEY_PATTERNS.CODE_BLOCK_DIFF}%`])

  // Sample some diffs to get statistics
  const samples = queryAll<{ key: string; value: string }>(`
    SELECT key, value
    FROM cursorDiskKV
    WHERE key LIKE ?
    LIMIT 50
  `, [`${KEY_PATTERNS.CODE_BLOCK_DIFF}%`])

  let totalChanges = 0
  let totalLinesModified = 0

  for (const row of samples) {
    if (!row.value || row.value === 'null') continue
    try {
      const diff = JSON.parse(row.value) as CodeBlockDiff
      const changes = diff.newModelDiffWrtV0 || []
      totalChanges += changes.length
      for (const change of changes) {
        totalLinesModified += change.modified.length
      }
    } catch {
      continue
    }
  }

  return {
    totalDiffRecords: totalCount[0]?.count || 0,
    sampleSize: samples.length,
    sampleStats: {
      totalChanges,
      totalLinesModified,
      avgChangesPerDiff: samples.length ? (totalChanges / samples.length).toFixed(2) : 0
    }
  }
}
