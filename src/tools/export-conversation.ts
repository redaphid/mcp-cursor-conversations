import { writeFileSync } from 'fs'
import { join } from 'path'
import { queryOne, makeConversationKey } from '../core/index.js'
import { getConversationSummary, getMessageData } from './helpers.js'

export const exportConversation = async (
  conversationId: string,
  format: 'markdown' | 'json' = 'markdown'
): Promise<string> => {
  const key = makeConversationKey(conversationId)
  const row = queryOne<{ value: string }>('SELECT value FROM cursorDiskKV WHERE key = ?', [key])

  if (!row?.value || row.value === 'null') {
    throw new Error(`Conversation ${conversationId} not found`)
  }

  const conversation = JSON.parse(row.value)

  let content: string
  let extension: string

  if (format === 'json') {
    content = JSON.stringify({ ...conversation, conversationId }, null, 2)
    extension = 'json'
  } else {
    const summary = getConversationSummary(
      { ...conversation, conversationId },
      (convId, msgId) => getMessageData(convId, msgId)
    )

    const messageBlocks = summary.messages.map((msg, index) => {
      return `## Message ${index + 1} (${msg.type})

${msg.text || ''}

`
    }).join('')

    content = `# Conversation: ${conversationId}

**Created:** ${conversation.createdAt}
**Updated:** ${summary.updatedAt}
**Status:** ${summary.status}
**Messages:** ${summary.messageCount}

${messageBlocks}`
    extension = 'md'
  }

  const filename = `cursor-conversation-${conversationId}.${extension}`
  const filepath = join('/tmp', filename)

  writeFileSync(filepath, content, 'utf8')
  return filepath
}
