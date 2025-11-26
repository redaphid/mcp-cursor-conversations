import { queryAll, makeDiffKey, KEY_PATTERNS } from '../core/index.js'
import type { CodeDiff } from '../core/types.js'

/**
 * List all code diffs for a conversation
 */
export const listDiffs = async (conversationId: string, options: { limit?: number } = {}) => {
  const { limit = 50 } = options
  const pattern = `${KEY_PATTERNS.DIFF}${conversationId}:%`

  const rows = queryAll<{ key: string; value: string }>(`
    SELECT key, value
    FROM cursorDiskKV
    WHERE key LIKE ?
    LIMIT ?
  `, [pattern, limit])

  const diffs: CodeDiff[] = []

  for (const row of rows) {
    if (!row.value || row.value === 'null') continue
    try {
      const keyParts = row.key.split(':')
      const diffId = keyParts.slice(2).join(':')
      const data = JSON.parse(row.value)
      diffs.push({
        diffId,
        changes: data.newModelDiffWrtV0?.map((change: any) => ({
          original: change.original,
          modified: change.modified
        })) || []
      })
    } catch {
      continue
    }
  }

  return {
    conversationId,
    count: diffs.length,
    diffs: diffs.map(d => ({
      diffId: d.diffId,
      changesCount: d.changes.length,
      changes: d.changes.map(change => ({
        startLine: change.original.startLineNumber,
        endLine: change.original.endLineNumberExclusive,
        linesAdded: change.modified.length,
        preview: change.modified.slice(0, 3).join('\n').substring(0, 200)
      }))
    }))
  }
}

/**
 * Get a specific diff
 */
export const getDiff = async (conversationId: string, diffId: string): Promise<CodeDiff> => {
  const key = makeDiffKey(conversationId, diffId)
  const rows = queryAll<{ value: string }>('SELECT value FROM cursorDiskKV WHERE key = ?', [key])

  if (!rows.length || !rows[0].value || rows[0].value === 'null') {
    throw new Error(`Diff ${diffId} not found in conversation ${conversationId}`)
  }

  const data = JSON.parse(rows[0].value)
  return {
    diffId,
    changes: data.newModelDiffWrtV0 || []
  }
}

/**
 * Get diff statistics
 */
export const getDiffStats = async () => {
  const totalCount = queryAll<{ count: number }>(`
    SELECT COUNT(*) as count
    FROM cursorDiskKV
    WHERE key LIKE ?
  `, [`${KEY_PATTERNS.DIFF}%`])

  const samples = queryAll<{ key: string; value: string }>(`
    SELECT key, value
    FROM cursorDiskKV
    WHERE key LIKE ?
    LIMIT 50
  `, [`${KEY_PATTERNS.DIFF}%`])

  let totalChanges = 0
  let totalLinesModified = 0

  for (const row of samples) {
    if (!row.value || row.value === 'null') continue
    try {
      const diff = JSON.parse(row.value)
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
    totalDiffs: totalCount[0]?.count || 0,
    sampleSize: samples.length,
    sampleStats: {
      totalChanges,
      totalLinesModified,
      avgChangesPerDiff: samples.length ? (totalChanges / samples.length).toFixed(2) : 0
    }
  }
}
