import { queryAll, makeContextKey, KEY_PATTERNS } from '../core/index.js'
import type { MessageContext } from '../core/types.js'

/**
 * List all contexts for a conversation (includes git status, project layout, etc.)
 */
export const listContexts = async (conversationId: string, options: { limit?: number } = {}) => {
  const { limit = 50 } = options
  const pattern = `${KEY_PATTERNS.CONTEXT}${conversationId}:%`

  const rows = queryAll<{ key: string; value: string }>(`
    SELECT key, value
    FROM cursorDiskKV
    WHERE key LIKE ?
    LIMIT ?
  `, [pattern, limit])

  const contexts: Array<{
    contextId: string
    hasGitStatus: boolean
    gitStatusPreview: string | null
    cursorRulesCount: number
    todosCount: number
    projectLayoutsCount: number
    terminalFilesCount: number
  }> = []

  for (const row of rows) {
    if (!row.value || row.value === 'null') continue
    try {
      const keyParts = row.key.split(':')
      const contextId = keyParts.slice(2).join(':')
      const data = JSON.parse(row.value)
      contexts.push({
        contextId,
        hasGitStatus: !!data.gitStatusRaw,
        gitStatusPreview: data.gitStatusRaw?.substring(0, 200) || null,
        cursorRulesCount: data.cursorRules?.length || 0,
        todosCount: data.todos?.length || 0,
        projectLayoutsCount: data.projectLayouts?.length || 0,
        terminalFilesCount: data.terminalFiles?.length || 0
      })
    } catch {
      continue
    }
  }

  return {
    conversationId,
    count: contexts.length,
    contexts
  }
}

/**
 * Get full context data
 */
export const getContext = async (conversationId: string, contextId: string): Promise<MessageContext> => {
  const key = makeContextKey(conversationId, contextId)
  const rows = queryAll<{ value: string }>('SELECT value FROM cursorDiskKV WHERE key = ?', [key])

  if (!rows.length || !rows[0].value || rows[0].value === 'null') {
    throw new Error(`Context ${contextId} not found in conversation ${conversationId}`)
  }

  const data = JSON.parse(rows[0].value)
  return {
    contextId,
    terminalFiles: data.terminalFiles || [],
    cursorRules: data.cursorRules || [],
    attachedFoldersListDirResults: data.attachedFoldersListDirResults || [],
    summarizedComposers: data.summarizedComposers || [],
    gitStatus: data.gitStatusRaw,
    todos: data.todos || [],
    projectLayouts: data.projectLayouts || []
  }
}

/**
 * Get context statistics
 */
export const getContextStats = async () => {
  const totalCount = queryAll<{ count: number }>(`
    SELECT COUNT(*) as count
    FROM cursorDiskKV
    WHERE key LIKE ?
  `, [`${KEY_PATTERNS.CONTEXT}%`])

  const samples = queryAll<{ key: string; value: string }>(`
    SELECT key, value
    FROM cursorDiskKV
    WHERE key LIKE ?
    LIMIT 50
  `, [`${KEY_PATTERNS.CONTEXT}%`])

  let withGitStatus = 0
  let withCursorRules = 0
  let withTodos = 0
  let withProjectLayouts = 0

  for (const row of samples) {
    if (!row.value || row.value === 'null') continue
    try {
      const ctx = JSON.parse(row.value)
      if (ctx.gitStatusRaw) withGitStatus++
      if (ctx.cursorRules?.length) withCursorRules++
      if (ctx.todos?.length) withTodos++
      if (ctx.projectLayouts?.length) withProjectLayouts++
    } catch {
      continue
    }
  }

  return {
    totalContexts: totalCount[0]?.count || 0,
    sampleSize: samples.length,
    sampleBreakdown: {
      withGitStatus,
      withCursorRules,
      withTodos,
      withProjectLayouts
    }
  }
}
