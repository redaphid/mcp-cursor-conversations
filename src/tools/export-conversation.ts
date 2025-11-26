import { writeFileSync } from 'fs'
import { join } from 'path'
import { queryOne, makeComposerKey } from '../core/index.ts'
import { getConversationSummary, getBubbleData } from './helpers.ts'

export const exportConversation = async (
  composerId: string,
  format: 'markdown' | 'json' = 'markdown'
): Promise<string> => {
  const key = makeComposerKey(composerId)
  const row = queryOne<{ value: string }>('SELECT value FROM cursorDiskKV WHERE key = ?', [key])

  if (!row?.value || row.value === 'null') {
    throw new Error(`Conversation ${composerId} not found`)
  }

  const conversation = JSON.parse(row.value)
  conversation.composerId = composerId

  let content: string
  let extension: string

  if (format === 'json') {
    content = JSON.stringify(conversation, null, 2)
    extension = 'json'
  } else {
    const summary = getConversationSummary(conversation, (cId, bId) => getBubbleData(cId, bId))

    const messageBlocks = summary.messages.map((msg, index) => {
      return `## Message ${index + 1} (${msg.type})

${msg.text || ''}

`
    }).join('')

    content = `# Conversation: ${composerId}

**Created:** ${conversation.createdAt}
**Updated:** ${summary.updatedAt}
**Status:** ${summary.status}
**Messages:** ${summary.messageCount}

${messageBlocks}`
    extension = 'md'
  }

  const filename = `cursor-conversation-${composerId}.${extension}`
  const filepath = join('/tmp', filename)

  writeFileSync(filepath, content, 'utf8')
  return filepath
}
