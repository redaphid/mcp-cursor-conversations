import { queryOne, makeMessageKey } from '../core/index.js'
import type { Message, ConversationData } from '../core/types.js'

export const getMessageData = (conversationId: string, messageId: string): Message | null => {
  const key = makeMessageKey(conversationId, messageId)
  const row = queryOne<{ value: string }>('SELECT value FROM cursorDiskKV WHERE key = ?', [key])

  if (!row?.value || row.value === 'null') return null

  try {
    const data = JSON.parse(row.value)
    return { ...data, messageId: data.bubbleId || messageId }
  } catch {
    return null
  }
}

interface MessageInfo {
  type: 'user' | 'assistant'
  text: string
}

export const getConversationSummary = (
  conversation: ConversationData & { conversationId: string },
  getMessageDataFn: ((conversationId: string, messageId: string) => Message | null) | null = null
) => {
  const messages: MessageInfo[] = []

  // Handle old structure with conversation array
  if ((conversation as any).conversation && Array.isArray((conversation as any).conversation)) {
    for (const msg of (conversation as any).conversation) {
      const messageInfo: MessageInfo = {
        type: msg.type === 1 ? 'user' : 'assistant',
        text: ''
      }

      if (msg.type === 1) {
        messageInfo.text = msg.text || ''
      } else if (msg.type === 2) {
        if (msg.text) {
          messageInfo.text = msg.text
        } else {
          const textParts: string[] = []
          for (const part of msg.responseParts || []) {
            if (part.type === 'text' && part.rawText) {
              textParts.push(part.rawText)
            }
          }
          messageInfo.text = textParts.join('')
        }
      }

      if (messageInfo.text) {
        messages.push(messageInfo)
      }
    }
  }

  // Handle structure with conversationMap
  if ((conversation as any).conversationMap && typeof (conversation as any).conversationMap === 'object') {
    for (const msgId of Object.keys((conversation as any).conversationMap)) {
      const msg = (conversation as any).conversationMap[msgId]
      const messageInfo: MessageInfo = {
        type: msg.type === 1 ? 'user' : 'assistant',
        text: ''
      }

      if (msg.type === 1) {
        messageInfo.text = msg.text || ''
      } else if (msg.type === 2) {
        if (msg.text) {
          messageInfo.text = msg.text
        } else {
          const textParts: string[] = []
          for (const part of msg.responseParts || []) {
            if (part.type === 'text' && part.rawText) {
              textParts.push(part.rawText)
            }
          }
          messageInfo.text = textParts.join('')
        }
      }

      if (messageInfo.text) {
        messages.push(messageInfo)
      }
    }
  }

  // Handle June 2025 structure with fullConversationHeadersOnly
  if ((conversation as any).fullConversationHeadersOnly && Array.isArray((conversation as any).fullConversationHeadersOnly) && getMessageDataFn) {
    for (const header of (conversation as any).fullConversationHeadersOnly) {
      const msgData = getMessageDataFn(conversation.conversationId, header.bubbleId)

      if (msgData) {
        const messageInfo: MessageInfo = {
          type: msgData.type === 1 ? 'user' : 'assistant',
          text: ''
        }

        if (msgData.type === 1) {
          messageInfo.text = msgData.text || ''
        } else if (msgData.type === 2) {
          const textParts: string[] = []

          if (msgData.text?.trim()) {
            textParts.push(msgData.text)
          }

          if (msgData.responseParts?.length) {
            for (const part of msgData.responseParts) {
              if (part.type === 'text' && part.rawText) {
                textParts.push(part.rawText)
              }
            }
          }

          if (msgData.codeBlocks?.length) {
            textParts.push(`[${msgData.codeBlocks.length} code block(s)]`)
          }

          if (msgData.thinking?.trim()) {
            textParts.push('[AI thinking content]')
          }

          if (msgData.intermediateChunks?.length) {
            textParts.push(`[${msgData.intermediateChunks.length} intermediate chunk(s)]`)
          }

          messageInfo.text = textParts.join(' ')
        }

        if (messageInfo.text || msgData.codeBlocks?.length || msgData.thinking) {
          if (!messageInfo.text) {
            messageInfo.text = '[Content without text]'
          }
          messages.push(messageInfo)
        }
      }
    }
  }

  return {
    messageCount: messages.length,
    messages,
    preview: messages[0]?.text?.substring(0, 100) || 'No preview available',
    status: (conversation as any).status || 'none',
    createdAt: conversation.createdAt,
    updatedAt: conversation.lastUpdatedAt || conversation.createdAt
  }
}
