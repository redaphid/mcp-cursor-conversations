// Database key patterns for Cursor's cursorDiskKV table

export const KEY_PATTERNS = {
  COMPOSER_DATA: 'composerData:',
  BUBBLE_ID: 'bubbleId:',
  CHECKPOINT_ID: 'checkpointId:',
  CODE_BLOCK_DIFF: 'codeBlockDiff:',
  MESSAGE_REQUEST_CONTEXT: 'messageRequestContext:',
} as const

export const makeComposerKey = (composerId: string): string =>
  `${KEY_PATTERNS.COMPOSER_DATA}${composerId}`

export const makeBubbleKey = (composerId: string, bubbleId: string): string =>
  `${KEY_PATTERNS.BUBBLE_ID}${composerId}:${bubbleId}`

export const makeCheckpointKey = (composerId: string, checkpointId: string): string =>
  `${KEY_PATTERNS.CHECKPOINT_ID}${composerId}:${checkpointId}`

export const makeCodeBlockDiffKey = (composerId: string, diffId: string): string =>
  `${KEY_PATTERNS.CODE_BLOCK_DIFF}${composerId}:${diffId}`

export const makeMessageRequestContextKey = (composerId: string, contextId: string): string =>
  `${KEY_PATTERNS.MESSAGE_REQUEST_CONTEXT}${composerId}:${contextId}`

export const parseComposerKey = (key: string): string | null => {
  if (!key.startsWith(KEY_PATTERNS.COMPOSER_DATA)) return null
  return key.slice(KEY_PATTERNS.COMPOSER_DATA.length)
}

export const parseBubbleKey = (key: string): { composerId: string; bubbleId: string } | null => {
  if (!key.startsWith(KEY_PATTERNS.BUBBLE_ID)) return null
  const parts = key.slice(KEY_PATTERNS.BUBBLE_ID.length).split(':')
  if (parts.length !== 2) return null
  return { composerId: parts[0], bubbleId: parts[1] }
}

export const parseCheckpointKey = (key: string): { composerId: string; checkpointId: string } | null => {
  if (!key.startsWith(KEY_PATTERNS.CHECKPOINT_ID)) return null
  const rest = key.slice(KEY_PATTERNS.CHECKPOINT_ID.length)
  const firstColon = rest.indexOf(':')
  if (firstColon === -1) return null
  return { composerId: rest.slice(0, firstColon), checkpointId: rest.slice(firstColon + 1) }
}

export const parseCodeBlockDiffKey = (key: string): { composerId: string; diffId: string } | null => {
  if (!key.startsWith(KEY_PATTERNS.CODE_BLOCK_DIFF)) return null
  const rest = key.slice(KEY_PATTERNS.CODE_BLOCK_DIFF.length)
  const firstColon = rest.indexOf(':')
  if (firstColon === -1) return null
  return { composerId: rest.slice(0, firstColon), diffId: rest.slice(firstColon + 1) }
}
