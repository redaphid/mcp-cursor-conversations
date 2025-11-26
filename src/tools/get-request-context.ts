import { queryAll, KEY_PATTERNS } from '../core/index.ts'
import type { MessageRequestContext } from '../core/types.ts'

/**
 * Get all request contexts for a conversation (includes git status, project layout, etc.)
 */
export const listRequestContexts = async (composerId: string, options: { limit?: number } = {}) => {
  const { limit = 50 } = options
  const pattern = `${KEY_PATTERNS.MESSAGE_REQUEST_CONTEXT}${composerId}:%`

  const rows = queryAll<{ key: string; value: string }>(`
    SELECT key, value
    FROM cursorDiskKV
    WHERE key LIKE ?
    LIMIT ?
  `, [pattern, limit])

  const contexts: Array<{ contextId: string; data: MessageRequestContext }> = []

  for (const row of rows) {
    if (!row.value || row.value === 'null') continue
    try {
      const keyParts = row.key.split(':')
      const contextId = keyParts.slice(2).join(':')

      const data = JSON.parse(row.value) as MessageRequestContext
      contexts.push({ contextId, data })
    } catch {
      continue
    }
  }

  return {
    composerId,
    count: contexts.length,
    contexts: contexts.map(c => ({
      contextId: c.contextId,
      hasGitStatus: !!c.data.gitStatusRaw,
      gitStatusPreview: c.data.gitStatusRaw?.substring(0, 200) || null,
      cursorRulesCount: c.data.cursorRules?.length || 0,
      todosCount: c.data.todos?.length || 0,
      projectLayoutsCount: c.data.projectLayouts?.length || 0,
      terminalFilesCount: c.data.terminalFiles?.length || 0
    }))
  }
}

/**
 * Get full request context data
 */
export const getRequestContext = async (composerId: string, contextId: string): Promise<MessageRequestContext> => {
  const key = `${KEY_PATTERNS.MESSAGE_REQUEST_CONTEXT}${composerId}:${contextId}`
  const rows = queryAll<{ value: string }>('SELECT value FROM cursorDiskKV WHERE key = ?', [key])

  if (!rows.length || !rows[0].value || rows[0].value === 'null') {
    throw new Error(`Request context ${contextId} not found in conversation ${composerId}`)
  }

  return JSON.parse(rows[0].value) as MessageRequestContext
}

/**
 * Get request context statistics
 */
export const getRequestContextStats = async () => {
  const totalCount = queryAll<{ count: number }>(`
    SELECT COUNT(*) as count
    FROM cursorDiskKV
    WHERE key LIKE ?
  `, [`${KEY_PATTERNS.MESSAGE_REQUEST_CONTEXT}%`])

  // Sample to get statistics
  const samples = queryAll<{ key: string; value: string }>(`
    SELECT key, value
    FROM cursorDiskKV
    WHERE key LIKE ?
    LIMIT 50
  `, [`${KEY_PATTERNS.MESSAGE_REQUEST_CONTEXT}%`])

  let withGitStatus = 0
  let withCursorRules = 0
  let withTodos = 0
  let withProjectLayouts = 0

  for (const row of samples) {
    if (!row.value || row.value === 'null') continue
    try {
      const ctx = JSON.parse(row.value) as MessageRequestContext
      if (ctx.gitStatusRaw) withGitStatus++
      if (ctx.cursorRules?.length) withCursorRules++
      if (ctx.todos?.length) withTodos++
      if (ctx.projectLayouts?.length) withProjectLayouts++
    } catch {
      continue
    }
  }

  return {
    totalContextRecords: totalCount[0]?.count || 0,
    sampleSize: samples.length,
    sampleBreakdown: {
      withGitStatus,
      withCursorRules,
      withTodos,
      withProjectLayouts
    }
  }
}
