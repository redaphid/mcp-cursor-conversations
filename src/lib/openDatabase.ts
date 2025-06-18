import Database from 'better-sqlite3'

export const openDatabase = async (dbPath: string) => {
  return new Database(dbPath, { readonly: true })
}