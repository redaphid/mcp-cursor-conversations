import { queryOne, queryAll, makeSnapshotKey, KEY_PATTERNS } from '../core/index.js'
import type { Snapshot } from '../core/types.js'

/**
 * List all snapshots for a conversation
 */
export const listSnapshots = async (conversationId: string, options: { limit?: number } = {}) => {
  const { limit = 50 } = options
  const pattern = `${KEY_PATTERNS.SNAPSHOT}${conversationId}:%`

  const rows = queryAll<{ key: string; value: string }>(`
    SELECT key, value
    FROM cursorDiskKV
    WHERE key LIKE ?
    LIMIT ?
  `, [pattern, limit])

  const snapshots: Array<{
    snapshotId: string
    fileCount: number
    newFoldersCount: number
    hasInlineDiffs: boolean
  }> = []

  for (const row of rows) {
    if (!row.value || row.value === 'null') continue
    try {
      const keyParts = row.key.split(':')
      const snapshotId = keyParts.slice(2).join(':')
      const data = JSON.parse(row.value)
      snapshots.push({
        snapshotId,
        fileCount: data.files?.length || 0,
        newFoldersCount: data.newlyCreatedFolders?.length || 0,
        hasInlineDiffs: (data.activeInlineDiffs?.length || 0) > 0
      })
    } catch {
      continue
    }
  }

  return {
    conversationId,
    count: snapshots.length,
    snapshots
  }
}

/**
 * Get a specific snapshot's full data
 */
export const getSnapshot = async (conversationId: string, snapshotId: string): Promise<Snapshot> => {
  const key = makeSnapshotKey(conversationId, snapshotId)
  const row = queryOne<{ value: string }>('SELECT value FROM cursorDiskKV WHERE key = ?', [key])

  if (!row?.value || row.value === 'null') {
    throw new Error(`Snapshot ${snapshotId} not found in conversation ${conversationId}`)
  }

  return { snapshotId, ...JSON.parse(row.value) }
}

/**
 * Get snapshot statistics
 */
export const getSnapshotStats = async () => {
  const totalCount = queryOne<{ count: number }>(`
    SELECT COUNT(*) as count
    FROM cursorDiskKV
    WHERE key LIKE ?
  `, [`${KEY_PATTERNS.SNAPSHOT}%`])

  return {
    totalSnapshots: totalCount?.count || 0
  }
}
