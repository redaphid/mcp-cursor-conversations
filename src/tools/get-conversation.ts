import { queryOne, makeConversationKey } from '../core/index.js'
import { getConversationSummary, getMessageData } from './helpers.js'

export const getConversation = async (conversationId: string, format: 'summary' | 'full' = 'summary') => {
  const key = makeConversationKey(conversationId)
  const row = queryOne<{ value: string }>('SELECT value FROM cursorDiskKV WHERE key = ?', [key])

  if (!row?.value || row.value === 'null') {
    throw new Error(`Conversation ${conversationId} not found`)
  }

  const conversation = JSON.parse(row.value)

  if (format === 'full') {
    return { ...conversation, conversationId }
  }

  const summary = getConversationSummary(
    { ...conversation, conversationId },
    (convId, msgId) => getMessageData(convId, msgId)
  )
  return summary
}
