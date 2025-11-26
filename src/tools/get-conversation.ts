import { queryOne, makeComposerKey } from '../core/index.js'
import { getConversationSummary, getBubbleData } from './helpers.js'

export const getConversation = async (composerId: string, format: 'summary' | 'full' = 'summary') => {
  const key = makeComposerKey(composerId)
  const row = queryOne<{ value: string }>('SELECT value FROM cursorDiskKV WHERE key = ?', [key])

  if (!row?.value || row.value === 'null') {
    throw new Error(`Conversation ${composerId} not found`)
  }

  const conversation = JSON.parse(row.value)
  conversation.composerId = composerId

  if (format === 'full') {
    return conversation
  }

  const summary = getConversationSummary(conversation, (cId, bId) => getBubbleData(cId, bId))
  return summary
}
