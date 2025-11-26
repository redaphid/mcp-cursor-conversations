/**
 * MCP Tool Annotations
 *
 * Per MCP specification, tool annotations provide hints to LLMs about tool behavior.
 * These are HINTS only - not enforced by the protocol.
 */

export const TOOL_ANNOTATIONS = {
  /**
   * Read-only tools: get, search, list operations
   */
  READ_ONLY: {
    readOnlyHint: true,
  },

  /**
   * Search tools: results may vary over time
   */
  SEARCH: {
    readOnlyHint: true,
    openWorldHint: true,
  },

  /**
   * Export tools: write to filesystem but don't modify source data
   */
  EXPORT: {
    readOnlyHint: false,
    idempotentHint: true,
  },
} as const

export type ToolAnnotations = typeof TOOL_ANNOTATIONS[keyof typeof TOOL_ANNOTATIONS]
