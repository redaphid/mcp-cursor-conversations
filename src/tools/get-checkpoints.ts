import { queryOne, queryAll, KEY_PATTERNS } from '../core/index.ts'
import type { CheckpointData } from '../core/types.ts'

/**
 * Get all checkpoints for a conversation
 */
export const listCheckpoints = async (composerId: string, options: { limit?: number } = {}) => {
  const { limit = 50 } = options
  const pattern = `${KEY_PATTERNS.CHECKPOINT_ID}${composerId}:%`

  const rows = queryAll<{ key: string; value: string }>(`
    SELECT key, value
    FROM cursorDiskKV
    WHERE key LIKE ?
    LIMIT ?
  `, [pattern, limit])

  const checkpoints: Array<{ checkpointId: string; data: CheckpointData }> = []

  for (const row of rows) {
    if (!row.value || row.value === 'null') continue
    try {
      // Extract checkpointId from key (format: checkpointId:composerId:checkpointId)
      const keyParts = row.key.split(':')
      const checkpointId = keyParts.slice(2).join(':')

      const data = JSON.parse(row.value) as CheckpointData
      checkpoints.push({ checkpointId, data })
    } catch {
      continue
    }
  }

  return {
    composerId,
    count: checkpoints.length,
    checkpoints: checkpoints.map(c => ({
      checkpointId: c.checkpointId,
      filesCount: c.data.files?.length || 0,
      newFoldersCount: c.data.newlyCreatedFolders?.length || 0,
      activeInlineDiffsCount: c.data.activeInlineDiffs?.length || 0,
      hasNewResources: !!(c.data.inlineDiffNewlyCreatedResources?.files?.length ||
                         c.data.inlineDiffNewlyCreatedResources?.folders?.length)
    }))
  }
}

/**
 * Get a specific checkpoint's full data
 */
export const getCheckpoint = async (composerId: string, checkpointId: string): Promise<CheckpointData> => {
  const key = `${KEY_PATTERNS.CHECKPOINT_ID}${composerId}:${checkpointId}`
  const row = queryOne<{ value: string }>('SELECT value FROM cursorDiskKV WHERE key = ?', [key])

  if (!row?.value || row.value === 'null') {
    throw new Error(`Checkpoint ${checkpointId} not found in conversation ${composerId}`)
  }

  return JSON.parse(row.value) as CheckpointData
}

/**
 * Get checkpoint statistics
 */
export const getCheckpointStats = async () => {
  const totalCount = queryOne<{ count: number }>(`
    SELECT COUNT(*) as count
    FROM cursorDiskKV
    WHERE key LIKE ?
  `, [`${KEY_PATTERNS.CHECKPOINT_ID}%`])

  return {
    totalCheckpoints: totalCount?.count || 0
  }
}
