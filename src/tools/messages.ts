import { queryOne, queryAll, makeMessageKey, KEY_PATTERNS, parseRichText } from '../core/index.js'
import type { Message } from '../core/types.js'

const processMessage = (data: any, messageId: string): Message => {
  const msg = { ...data, messageId: data.bubbleId || messageId }
  // Parse richText and use as text, then remove richText field
  if (msg.richText) {
    msg.text = parseRichText(msg.richText)
    delete msg.richText
  }
  return msg
}

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
  return processMessage(data, messageId)
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

  const messages: Message[] = []

  for (const row of rows) {
    if (!row.value || row.value === 'null') continue
    try {
      const parsed = JSON.parse(row.value)
      const messageId = parsed.bubbleId || row.key.split(':')[2]
      messages.push(processMessage(parsed, messageId))
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
