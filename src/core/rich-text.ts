/**
 * Parse Lexical editor richText JSON into plain text
 */

interface LexicalNode {
  type: string
  text?: string
  children?: LexicalNode[]
  mentionName?: string
}

interface LexicalRoot {
  root: LexicalNode
}

const extractText = (node: LexicalNode): string => {
  if (node.type === 'text') {
    return node.text || ''
  }

  if (node.type === 'mention') {
    return node.mentionName || node.text || ''
  }

  if (node.children) {
    const childText = node.children.map(extractText).join('')
    // Add newline after paragraphs
    if (node.type === 'paragraph') {
      return childText + '\n'
    }
    return childText
  }

  return ''
}

export const parseRichText = (richTextJson: string): string => {
  try {
    const parsed: LexicalRoot = JSON.parse(richTextJson)
    return extractText(parsed.root).trim()
  } catch {
    return richTextJson
  }
}

/**
 * Parse richText and replace it with parsed version in a message object
 */
export const parseMessageRichText = <T extends { richText?: string }>(message: T): T & { richTextParsed?: string } => {
  if (!message.richText) return message
  return {
    ...message,
    richTextParsed: parseRichText(message.richText)
  }
}
