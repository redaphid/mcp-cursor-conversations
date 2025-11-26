import { queryOne, makeBubbleKey } from '../core/index.js'
import type { BubbleData, ConversationData, MessageInfo } from '../core/types.js'

export const getBubbleData = (composerId: string, bubbleId: string): BubbleData | null => {
  const key = makeBubbleKey(composerId, bubbleId)
  const row = queryOne<{ value: string }>('SELECT value FROM cursorDiskKV WHERE key = ?', [key])

  if (!row?.value || row.value === 'null') return null

  try {
    return JSON.parse(row.value) as BubbleData
  } catch {
    return null
  }
}

export const getConversationSummary = (
  conversation: ConversationData,
  getBubbleDataFn: ((composerId: string, bubbleId: string) => BubbleData | null) | null = null
) => {
  const messages: MessageInfo[] = []

  // Handle old structure with conversation array
  if (conversation.conversation && Array.isArray(conversation.conversation)) {
    for (const msg of conversation.conversation) {
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
  if (conversation.conversationMap && typeof conversation.conversationMap === 'object') {
    for (const msgId of Object.keys(conversation.conversationMap)) {
      const msg = conversation.conversationMap[msgId]
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
  if (conversation.fullConversationHeadersOnly && Array.isArray(conversation.fullConversationHeadersOnly) && getBubbleDataFn) {
    for (const header of conversation.fullConversationHeadersOnly) {
      const bubbleData = getBubbleDataFn(conversation.composerId, header.bubbleId)

      if (bubbleData) {
        const messageInfo: MessageInfo = {
          type: bubbleData.type === 1 ? 'user' : 'assistant',
          text: ''
        }

        if (bubbleData.type === 1) {
          messageInfo.text = bubbleData.text || ''
        } else if (bubbleData.type === 2) {
          const textParts: string[] = []

          if (bubbleData.text?.trim()) {
            textParts.push(bubbleData.text)
          }

          if (bubbleData.responseParts?.length) {
            for (const part of bubbleData.responseParts) {
              if (part.type === 'text' && part.rawText) {
                textParts.push(part.rawText)
              }
            }
          }

          if (bubbleData.codeBlocks?.length) {
            textParts.push(`[${bubbleData.codeBlocks.length} code block(s)]`)
          }

          if (bubbleData.thinking?.trim()) {
            textParts.push('[AI thinking content]')
          }

          if (bubbleData.intermediateChunks?.length) {
            textParts.push(`[${bubbleData.intermediateChunks.length} intermediate chunk(s)]`)
          }

          messageInfo.text = textParts.join(' ')
        }

        if (messageInfo.text || bubbleData.codeBlocks?.length || bubbleData.thinking) {
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
    status: conversation.status || 'none',
    createdAt: conversation.createdAt,
    updatedAt: conversation.lastUpdatedAt || conversation.createdAt
  }
}
