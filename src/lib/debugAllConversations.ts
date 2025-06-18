import { openDatabase } from './openDatabase.ts'
import { getDbPath } from './getDbPath.ts'

const debugAllConversations = async () => {
  const dbPath = getDbPath()
  const db = await openDatabase(dbPath)
  
  try {
    // First, let's see what keys exist in the database
    console.log('=== Checking all cursorDiskKV keys ===')
    
    const keysStmt = db.prepare(`
      SELECT DISTINCT substr(key, 1, 20) as key_prefix, COUNT(*) as count
      FROM cursorDiskKV 
      GROUP BY key_prefix
      ORDER BY count DESC
      LIMIT 20
    `)
    
    const keyPrefixes = keysStmt.all()
    console.log('Key prefixes in database:')
    keyPrefixes.forEach(row => {
      console.log(`  ${row.key_prefix}... : ${row.count} entries`)
    })
    
    // Look for conversation-related keys
    console.log('\n=== Conversation-related keys ===')
    const convStmt = db.prepare(`
      SELECT key 
      FROM cursorDiskKV 
      WHERE key LIKE '%conversation%' 
      OR key LIKE '%composer%'
      OR key LIKE '%chat%'
      LIMIT 20
    `)
    
    const convKeys = convStmt.all()
    console.log('Found keys:')
    convKeys.forEach(row => {
      console.log(`  ${row.key}`)
    })
    
    // Check a specific recent composerData entry
    console.log('\n=== Checking recent composerData entries ===')
    const recentStmt = db.prepare(`
      SELECT key, length(value) as value_length, 
             CASE WHEN value = 'null' THEN 'null string' 
                  WHEN value IS NULL THEN 'NULL' 
                  ELSE 'has data' END as value_status
      FROM cursorDiskKV 
      WHERE key LIKE 'composerData:%'
      ORDER BY key DESC
      LIMIT 10
    `)
    
    const recentEntries = recentStmt.all()
    console.log('Recent composer entries:')
    recentEntries.forEach(row => {
      console.log(`  ${row.key}: ${row.value_status} (${row.value_length} chars)`)
    })
    
    // Let's also check if there are other tables
    console.log('\n=== Database tables ===')
    const tablesStmt = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table'
    `)
    
    const tables = tablesStmt.all()
    console.log('Tables in database:')
    tables.forEach(row => {
      console.log(`  ${row.name}`)
    })
    
  } finally {
    db.close()
  }
}

debugAllConversations().catch(console.error)