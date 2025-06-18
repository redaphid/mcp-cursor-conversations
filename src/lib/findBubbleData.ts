import { openDatabase } from './openDatabase.ts'
import { getDbPath } from './getDbPath.ts'

const findBubbleData = async () => {
  const dbPath = getDbPath()
  const db = await openDatabase(dbPath)
  
  try {
    // Look for bubble data with a specific ID from the June conversation
    const bubbleId = 'e0188e6d-d6a7-4b64-a093-7b3eb9a96566'
    
    console.log('=== Looking for bubble data patterns ===')
    
    // Try different key patterns
    const patterns = [
      `bubbleId:%${bubbleId}%`,
      `bubble:%${bubbleId}%`,
      `%e0188e6d-d6a7-4b64-a093-7b3eb9a96566%`,
      `messageRequestContext:%`,
      `%f73d97ac-baa6-4115-b64e-d898cf2b5a26%`  // First bubble ID from the conversation
    ]
    
    for (const pattern of patterns) {
      const stmt = db.prepare(`
        SELECT key, length(value) as value_length
        FROM cursorDiskKV 
        WHERE key LIKE ?
        LIMIT 5
      `)
      
      const rows = stmt.all(pattern)
      if (rows.length > 0) {
        console.log(`\nPattern "${pattern}" found ${rows.length} entries:`)
        rows.forEach(row => {
          console.log(`  ${row.key}: ${row.value_length} chars`)
        })
      }
    }
    
    // Check actual bubble entries
    console.log('\n=== All bubble-related keys ===')
    const bubbleStmt = db.prepare(`
      SELECT DISTINCT substr(key, 1, 30) as key_prefix, COUNT(*) as count
      FROM cursorDiskKV 
      WHERE key LIKE 'bubbleId:%'
      GROUP BY key_prefix
      ORDER BY count DESC
      LIMIT 10
    `)
    
    const bubblePrefixes = bubbleStmt.all()
    bubblePrefixes.forEach(row => {
      console.log(`  ${row.key_prefix}...: ${row.count} entries`)
    })
    
  } finally {
    db.close()
  }
}

findBubbleData().catch(console.error)