export const getConversationSummary = (conversation, getBubbleData = null) => {
  const messages = []
  
  // Handle old structure with conversation array
  if (conversation.conversation && Array.isArray(conversation.conversation)) {
    for (const msg of conversation.conversation) {
    const messageInfo = {
      type: msg.type === 1 ? 'user' : 'assistant',
      text: ''
    }
    
    // Extract text from user messages
    if (msg.type === 1) {
      messageInfo.text = msg.text || ''
    } else if (msg.type === 2) {
      // For assistant messages, check both text and responseParts
      if (msg.text) {
        messageInfo.text = msg.text
      } else {
        // Extract from responseParts if available
        const textParts = []
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
  
  // Handle new structure with conversationMap
  if (conversation.conversationMap && typeof conversation.conversationMap === 'object') {
    // conversationMap is an object where keys are message IDs
    for (const msgId of Object.keys(conversation.conversationMap)) {
      const msg = conversation.conversationMap[msgId]
      const messageInfo = {
        type: msg.type === 1 ? 'user' : 'assistant',
        text: ''
      }
      
      // Extract text from user messages
      if (msg.type === 1) {
        messageInfo.text = msg.text || ''
      } else if (msg.type === 2) {
        // For assistant messages, check both text and responseParts
        if (msg.text) {
          messageInfo.text = msg.text
        } else {
          // Extract from responseParts if available
          const textParts = []
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
  if (conversation.fullConversationHeadersOnly && Array.isArray(conversation.fullConversationHeadersOnly) && getBubbleData) {
    for (const header of conversation.fullConversationHeadersOnly) {
      // Fetch bubble data using the callback
      const bubbleData = getBubbleData(conversation.composerId, header.bubbleId)
      
      if (bubbleData) {
        const messageInfo = {
          type: bubbleData.type === 1 ? 'user' : 'assistant',
          text: ''
        }
        
        // Extract text
        if (bubbleData.type === 1) {
          messageInfo.text = bubbleData.text || ''
        } else if (bubbleData.type === 2) {
          // For assistant messages
          if (bubbleData.text) {
            messageInfo.text = bubbleData.text
          } else if (bubbleData.responseParts) {
            // Extract from responseParts if available
            const textParts = []
            for (const part of bubbleData.responseParts || []) {
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
  }
  
  return { 
    messageCount: messages.length,
    messages,
    preview: messages[0]?.text?.substring(0, 100) || 'No preview available',
    status: conversation.status || 'completed',
    createdAt: conversation.createdAt,
    updatedAt: conversation.lastUpdatedAt || conversation.createdAt
  }
}