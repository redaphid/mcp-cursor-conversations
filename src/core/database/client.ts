import Database from 'better-sqlite3'
import { homedir } from 'os'
import { existsSync } from 'fs'

// Global configuration that can be set programmatically
let configuredDbPath: string | null = null

/**
 * Configure the database path programmatically.
 * Takes precedence over environment variable.
 */
export const setDatabasePath = (path: string): void => {
  configuredDbPath = path
}

/**
 * Get the currently configured database path (or null if using defaults)
 */
export const getDatabasePath = (): string | null => configuredDbPath

/**
 * Reset to default database path behavior
 */
export const resetDatabasePath = (): void => {
  configuredDbPath = null
}

export const getDbPath = (): string => {
  if (configuredDbPath) return configuredDbPath
  if (process.env.CURSOR_DB_PATH) return process.env.CURSOR_DB_PATH
  if (process.platform === 'darwin') return `${homedir()}/Library/Application Support/Cursor/User/globalStorage/state.vscdb`
  if (process.platform === 'win32') return `${homedir()}\\AppData\\Roaming\\Cursor\\User\\globalStorage\\state.vscdb`
  return `${homedir()}/.config/Cursor/User/globalStorage/state.vscdb`
}

export const getDatabase = (): Database.Database => {
  const dbPath = getDbPath()
  if (!existsSync(dbPath)) {
    throw new Error(`Cursor database not found at: ${dbPath}. Set CURSOR_DB_PATH environment variable or use setDatabasePath() if your database is in a different location.`)
  }
  // Open fresh connection each time to avoid stale reads
  return new Database(dbPath, { readonly: true })
}

// Query helpers
export const queryOne = <T>(sql: string, params: any[] = []): T | undefined => {
  const db = getDatabase()
  const stmt = db.prepare(sql)
  return stmt.get(...params) as T | undefined
}

export const queryAll = <T>(sql: string, params: any[] = []): T[] => {
  const db = getDatabase()
  const stmt = db.prepare(sql)
  return stmt.all(...params) as T[]
}

export const queryCount = (sql: string, params: any[] = []): number => {
  const result = queryOne<{ count: number }>(sql, params)
  return result?.count ?? 0
}
