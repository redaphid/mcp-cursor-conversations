// Conversation types

export interface ConversationHeader {
  bubbleId: string
  timestamp?: number
}

export interface ConversationData {
  composerId: string
  createdAt: number
  lastUpdatedAt?: number
  status?: string
  conversation?: any[]
  conversationMap?: Record<string, any>
  fullConversationHeadersOnly?: ConversationHeader[]
}

export interface ConversationSummary {
  composerId: string
  messageCount: number
  preview: string
  status: string
  createdAt: number
  updatedAt: number
}

export interface MessageInfo {
  type: 'user' | 'assistant'
  text: string
}

// Bubble data (individual messages) - new June 2025 format
export interface BubbleData {
  _v: number
  type: number // 1 = user, 2 = assistant
  bubbleId: string
  text?: string
  responseParts?: Array<{ type: string; rawText?: string }>
  codeBlocks?: any[]
  thinking?: string
  intermediateChunks?: any[]
  toolResults?: any[]
  suggestedCodeBlocks?: any[]
  attachedCodeChunks?: any[]
  fileLinks?: string[]
  webReferences?: any[]
  docsReferences?: any[]
  tokenCount?: { inputTokens: number; outputTokens: number }
  isAgentic?: boolean
  capabilities?: Record<string, any>
  capabilitiesRan?: Record<string, any[]>
  todos?: any[]
  usageUuid?: string
}

// Checkpoint data - file state snapshots
export interface CheckpointData {
  files: string[]
  nonExistentFiles: string[]
  newlyCreatedFolders: string[]
  activeInlineDiffs: any[]
  inlineDiffNewlyCreatedResources?: {
    files: string[]
    folders: string[]
  }
}

// Code block diff data
export interface CodeBlockDiff {
  newModelDiffWrtV0: Array<{
    original: { startLineNumber: number; endLineNumberExclusive: number }
    modified: string[]
  }>
  originalModelDiffWrtV0: any[]
}

// Message request context
export interface MessageRequestContext {
  terminalFiles: string[]
  cursorRules: string[]
  attachedFoldersListDirResults: any[]
  summarizedComposers: any[]
  gitStatusRaw?: string
  todos: any[]
  projectLayouts: string[]
}
