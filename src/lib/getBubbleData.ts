export const getBubbleData = (db, composerId: string, bubbleId: string) => {
  const key = `bubbleId:${composerId}:${bubbleId}`
  const stmt = db.prepare('SELECT value FROM cursorDiskKV WHERE key = ?')
  const row = stmt.get(key)
  
  if (!row || !row.value || row.value === 'null') return null
  
  try {
    return JSON.parse(row.value)
  } catch {
    return null
  }
}