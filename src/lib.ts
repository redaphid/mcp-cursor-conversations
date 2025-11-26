/**
 * Cursor Conversations Library
 *
 * Pure business logic for accessing Cursor's conversation database.
 * No MCP dependencies - use this for direct programmatic access.
 *
 * @example
 * ```ts
 * import { listConversations, searchConversations, getDatabase } from '@redaphid/cursor-conversations-mcp'
 *
 * // List recent conversations
 * const conversations = await listConversations({ limit: 10 })
 *
 * // Search for specific content
 * const results = await searchConversations('authentication', 20)
 *
 * // Direct database access
 * import { queryAll, KEY_PATTERNS } from '@redaphid/cursor-conversations-mcp/core'
 * const rows = queryAll('SELECT * FROM cursorDiskKV WHERE key LIKE ?', [`${KEY_PATTERNS.BUBBLE_ID}%`])
 * ```
 */

// Core database utilities
export * from './core/index.js'

// Business logic tools
export * from './tools/index.js'
