import { openDatabase } from './openDatabase.ts'
import { getDbPath } from './getDbPath.ts'

const readBubbleData = async () => {
  const dbPath = getDbPath()
  const db = await openDatabase(dbPath)
  
  try {
    // Get a specific bubble entry
    const stmt = db.prepare(`
      SELECT value 
      FROM cursorDiskKV 
      WHERE key = 'bubbleId:e0188e6d-d6a7-4b64-a093-7b3eb9a96566:f73d97ac-baa6-4115-b64e-d898cf2b5a26'
    `)
    
    const row = stmt.get()
    if (!row || !row.value) {
      console.log('Bubble not found')
      return
    }
    
    const bubble = JSON.parse(row.value)
    
    console.log('=== Bubble Data ===')
    console.log('Type:', bubble.type)
    console.log('BubbleId:', bubble.bubbleId)
    console.log('Has text:', !!bubble.text)
    console.log('Has richText:', !!bubble.richText)
    console.log('Has responseParts:', !!bubble.responseParts)
    
    if (bubble.text) {
      console.log('\nText:', bubble.text)
    }
    
    if (bubble.richText) {
      console.log('\nRichText preview:', bubble.richText.substring(0, 200) + '...')
    }
    
    if (bubble.responseParts && bubble.responseParts.length > 0) {
      console.log('\nResponse parts:', bubble.responseParts.length)
      bubble.responseParts.slice(0, 2).forEach((part, i) => {
        console.log(`\nPart ${i}:`)
        console.log('  Type:', part.type)
        if (part.rawText) {
          console.log('  Text preview:', part.rawText.substring(0, 100) + '...')
        }
      })
    }
    
    // Show all keys
    console.log('\n=== All Bubble Keys ===')
    Object.keys(bubble).forEach(key => {
      const value = bubble[key]
      let info = typeof value
      if (Array.isArray(value)) info = `array[${value.length}]`
      else if (value && typeof value === 'object') info = `object`
      console.log(`  ${key}: ${info}`)
    })
    
  } finally {
    db.close()
  }
}

readBubbleData().catch(console.error)