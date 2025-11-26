/**
 * Cursor Conversations Type Definitions
 */

// ============================================
// CONVERSATION TYPES
// ============================================

export interface ConversationSummary {
  conversationId: string
  messageCount: number
  preview: string
  status: string
  createdAt: number
  updatedAt: number
}

export interface ConversationData {
  conversationId: string
  createdAt: number
  lastUpdatedAt?: number
  status?: string
  messages?: Message[]
}

// ============================================
// MESSAGE TYPES
// ============================================

export type MessageRole = 'user' | 'assistant'

export interface MessageSummary {
  messageId: string
  role: MessageRole
  text: string
  hasCodeBlocks: boolean
  hasToolResults: boolean
  isAgentic: boolean
  tokenCount?: { inputTokens: number; outputTokens: number }
}

export interface Message {
  _v: number
  type: number // 1 = user, 2 = assistant
  messageId: string
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

// ============================================
// SNAPSHOT TYPES (file state at a point in time)
// ============================================

export interface Snapshot {
  snapshotId: string
  files: string[]
  nonExistentFiles: string[]
  newlyCreatedFolders: string[]
  activeInlineDiffs: any[]
  inlineDiffNewlyCreatedResources?: {
    files: string[]
    folders: string[]
  }
}

// ============================================
// CODE DIFF TYPES
// ============================================

export interface CodeDiff {
  diffId: string
  changes: Array<{
    original: { startLineNumber: number; endLineNumberExclusive: number }
    modified: string[]
  }>
}

// ============================================
// CONTEXT TYPES (state when message was sent)
// ============================================

export interface MessageContext {
  contextId: string
  terminalFiles: string[]
  cursorRules: string[]
  attachedFoldersListDirResults: any[]
  summarizedComposers: any[]
  gitStatus?: string
  todos: any[]
  projectLayouts: string[]
}
