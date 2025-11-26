import { queryOne, queryAll, makeMessageKey, KEY_PATTERNS } from '../core/index.js'
import type { Message, MessageSummary } from '../core/types.js'

/**
 * Get a single message by ID
 */
export const getMessage = async (conversationId: string, messageId: string): Promise<Message> => {
  const key = makeMessageKey(conversationId, messageId)
  const row = queryOne<{ value: string }>('SELECT value FROM cursorDiskKV WHERE key = ?', [key])

  if (!row?.value || row.value === 'null') {
    throw new Error(`Message ${messageId} not found in conversation ${conversationId}`)
  }

  const data = JSON.parse(row.value)
  return { ...data, messageId: data.bubbleId || messageId }
}

/**
 * List all messages for a conversation
 */
export const listMessages = async (conversationId: string, options: { limit?: number } = {}) => {
  const { limit = 100 } = options
  const pattern = `${KEY_PATTERNS.MESSAGE}${conversationId}:%`

  const rows = queryAll<{ key: string; value: string }>(`
    SELECT key, value
    FROM cursorDiskKV
    WHERE key LIKE ?
    LIMIT ?
  `, [pattern, limit])

  const messages: MessageSummary[] = []

  for (const row of rows) {
    if (!row.value || row.value === 'null') continue
    try {
      const parsed = JSON.parse(row.value)
      const messageId = parsed.bubbleId || row.key.split(':')[2]
      messages.push({
        messageId,
        role: parsed.type === 1 ? 'user' : 'assistant',
        text: parsed.text?.substring(0, 200) || '[No text content]',
        hasCodeBlocks: (parsed.codeBlocks?.length || 0) > 0,
        hasToolResults: (parsed.toolResults?.length || 0) > 0,
        isAgentic: parsed.isAgentic || false,
        tokenCount: parsed.tokenCount
      })
    } catch {
      continue
    }
  }

  return {
    conversationId,
    count: messages.length,
    messages
  }
}

/**
 * Get message statistics across all conversations
 */
export const getMessageStats = async () => {
  const totalCount = queryOne<{ count: number }>(`
    SELECT COUNT(*) as count
    FROM cursorDiskKV
    WHERE key LIKE ?
  `, [`${KEY_PATTERNS.MESSAGE}%`])

  const samples = queryAll<{ key: string; value: string }>(`
    SELECT key, value
    FROM cursorDiskKV
    WHERE key LIKE ?
    LIMIT 100
  `, [`${KEY_PATTERNS.MESSAGE}%`])

  let userMessages = 0
  let assistantMessages = 0
  let agenticMessages = 0
  let withCodeBlocks = 0
  let withToolResults = 0

  for (const row of samples) {
    if (!row.value || row.value === 'null') continue
    try {
      const msg = JSON.parse(row.value)
      if (msg.type === 1) userMessages++
      if (msg.type === 2) assistantMessages++
      if (msg.isAgentic) agenticMessages++
      if (msg.codeBlocks?.length) withCodeBlocks++
      if (msg.toolResults?.length) withToolResults++
    } catch {
      continue
    }
  }

  return {
    totalMessages: totalCount?.count || 0,
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
