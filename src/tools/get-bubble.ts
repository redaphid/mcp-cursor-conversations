import { queryOne, queryAll, makeBubbleKey, KEY_PATTERNS } from '../core/index.ts'
import type { BubbleData } from '../core/types.ts'

/**
 * Get a single bubble (message) by ID
 */
export const getBubble = async (composerId: string, bubbleId: string): Promise<BubbleData> => {
  const key = makeBubbleKey(composerId, bubbleId)
  const row = queryOne<{ value: string }>('SELECT value FROM cursorDiskKV WHERE key = ?', [key])

  if (!row?.value || row.value === 'null') {
    throw new Error(`Bubble ${bubbleId} not found in conversation ${composerId}`)
  }

  return JSON.parse(row.value) as BubbleData
}

/**
 * List all bubbles (messages) for a conversation
 */
export const listBubbles = async (composerId: string, options: { limit?: number } = {}) => {
  const { limit = 100 } = options
  const pattern = `${KEY_PATTERNS.BUBBLE_ID}${composerId}:%`

  const rows = queryAll<{ key: string; value: string }>(`
    SELECT key, value
    FROM cursorDiskKV
    WHERE key LIKE ?
    LIMIT ?
  `, [pattern, limit])

  const bubbles: Array<BubbleData & { bubbleKey: string }> = []

  for (const row of rows) {
    if (!row.value || row.value === 'null') continue
    try {
      const parsed = JSON.parse(row.value) as BubbleData
      bubbles.push({
        ...parsed,
        bubbleKey: row.key.split(':')[2] // Extract bubbleId from key
      })
    } catch {
      continue
    }
  }

  return {
    composerId,
    count: bubbles.length,
    bubbles: bubbles.map(b => ({
      bubbleId: b.bubbleId || b.bubbleKey,
      type: b.type === 1 ? 'user' : 'assistant',
      text: b.text?.substring(0, 200) || '[No text content]',
      hasCodeBlocks: (b.codeBlocks?.length || 0) > 0,
      hasToolResults: (b.toolResults?.length || 0) > 0,
      isAgentic: b.isAgentic || false,
      tokenCount: b.tokenCount
    }))
  }
}

/**
 * Get bubble statistics across all conversations
 */
export const getBubbleStats = async () => {
  const totalCount = queryOne<{ count: number }>(`
    SELECT COUNT(*) as count
    FROM cursorDiskKV
    WHERE key LIKE ?
  `, [`${KEY_PATTERNS.BUBBLE_ID}%`])

  // Get sample to understand data distribution
  const samples = queryAll<{ key: string; value: string }>(`
    SELECT key, value
    FROM cursorDiskKV
    WHERE key LIKE ?
    LIMIT 100
  `, [`${KEY_PATTERNS.BUBBLE_ID}%`])

  let userMessages = 0
  let assistantMessages = 0
  let agenticMessages = 0
  let withCodeBlocks = 0
  let withToolResults = 0

  for (const row of samples) {
    if (!row.value || row.value === 'null') continue
    try {
      const bubble = JSON.parse(row.value) as BubbleData
      if (bubble.type === 1) userMessages++
      if (bubble.type === 2) assistantMessages++
      if (bubble.isAgentic) agenticMessages++
      if (bubble.codeBlocks?.length) withCodeBlocks++
      if (bubble.toolResults?.length) withToolResults++
    } catch {
      continue
    }
  }

  return {
    totalBubbles: totalCount?.count || 0,
    sampleSize: samples.length,
    sampleBreakdown: {
      userMessages,
      assistantMessages,
      agenticMessages,
      withCodeBlocks,
      withToolResults
    }
  }
}
