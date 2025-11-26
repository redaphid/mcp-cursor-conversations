/**
 * Database key patterns for Cursor's cursorDiskKV table
 *
 * Cursor uses these internal key prefixes - we expose semantic names
 */

// Internal Cursor key prefixes (don't change these - they match the DB)
const CURSOR_KEYS = {
  CONVERSATION: 'composerData:',
  MESSAGE: 'bubbleId:',
  SNAPSHOT: 'checkpointId:',
  DIFF: 'codeBlockDiff:',
  CONTEXT: 'messageRequestContext:',
} as const

// Exported with semantic names
export const KEY_PATTERNS = {
  CONVERSATION: CURSOR_KEYS.CONVERSATION,
  MESSAGE: CURSOR_KEYS.MESSAGE,
  SNAPSHOT: CURSOR_KEYS.SNAPSHOT,
  DIFF: CURSOR_KEYS.DIFF,
  CONTEXT: CURSOR_KEYS.CONTEXT,
} as const

export const makeConversationKey = (conversationId: string): string =>
  `${KEY_PATTERNS.CONVERSATION}${conversationId}`

export const makeMessageKey = (conversationId: string, messageId: string): string =>
  `${KEY_PATTERNS.MESSAGE}${conversationId}:${messageId}`

export const makeSnapshotKey = (conversationId: string, snapshotId: string): string =>
  `${KEY_PATTERNS.SNAPSHOT}${conversationId}:${snapshotId}`

export const makeDiffKey = (conversationId: string, diffId: string): string =>
  `${KEY_PATTERNS.DIFF}${conversationId}:${diffId}`

export const makeContextKey = (conversationId: string, contextId: string): string =>
  `${KEY_PATTERNS.CONTEXT}${conversationId}:${contextId}`

export const parseConversationKey = (key: string): string | null => {
  if (!key.startsWith(KEY_PATTERNS.CONVERSATION)) return null
  return key.slice(KEY_PATTERNS.CONVERSATION.length)
}

export const parseMessageKey = (key: string): { conversationId: string; messageId: string } | null => {
  if (!key.startsWith(KEY_PATTERNS.MESSAGE)) return null
  const parts = key.slice(KEY_PATTERNS.MESSAGE.length).split(':')
  if (parts.length !== 2) return null
  return { conversationId: parts[0], messageId: parts[1] }
}

export const parseSnapshotKey = (key: string): { conversationId: string; snapshotId: string } | null => {
  if (!key.startsWith(KEY_PATTERNS.SNAPSHOT)) return null
  const rest = key.slice(KEY_PATTERNS.SNAPSHOT.length)
  const firstColon = rest.indexOf(':')
  if (firstColon === -1) return null
  return { conversationId: rest.slice(0, firstColon), snapshotId: rest.slice(firstColon + 1) }
}

export const parseDiffKey = (key: string): { conversationId: string; diffId: string } | null => {
  if (!key.startsWith(KEY_PATTERNS.DIFF)) return null
  const rest = key.slice(KEY_PATTERNS.DIFF.length)
  const firstColon = rest.indexOf(':')
  if (firstColon === -1) return null
  return { conversationId: rest.slice(0, firstColon), diffId: rest.slice(firstColon + 1) }
}

export const parseContextKey = (key: string): { conversationId: string; contextId: string } | null => {
  if (!key.startsWith(KEY_PATTERNS.CONTEXT)) return null
  const rest = key.slice(KEY_PATTERNS.CONTEXT.length)
  const firstColon = rest.indexOf(':')
  if (firstColon === -1) return null
  return { conversationId: rest.slice(0, firstColon), contextId: rest.slice(firstColon + 1) }
}
