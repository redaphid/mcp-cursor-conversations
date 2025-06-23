import { openDatabase } from './src/lib/openDatabase.ts';
import { getDbPath } from './src/lib/getDbPath.ts';
import { getBubbleData } from './src/lib/getBubbleData.ts';

const dbPath = getDbPath();
const db = await openDatabase(dbPath);

// Get the conversation with fullConversationHeadersOnly
const stmt = db.prepare('SELECT value FROM cursorDiskKV WHERE key = ? LIMIT 1');
const row = stmt.get('composerData:ffdbf365-2f94-4989-b9d9-a74ea75d19b6');

if (row) {
  const conversation = JSON.parse(row.value);
  const composerId = conversation.composerId;
  
  console.log(`Conversation has ${conversation.fullConversationHeadersOnly.length} bubble headers`);
  
  // Check first few bubble IDs
  const firstFewHeaders = conversation.fullConversationHeadersOnly.slice(0, 5);
  console.log('\nChecking first 5 bubble IDs:');
  
  for (let i = 0; i < firstFewHeaders.length; i++) {
    const header = firstFewHeaders[i];
    console.log(`\n${i + 1}. Header:`, header);
    
    const bubbleData = getBubbleData(db, composerId, header.bubbleId);
    if (bubbleData) {
      console.log(`   Found bubble data: type ${bubbleData.type}, text length: ${(bubbleData.text || '').length}`);
      if (bubbleData.text && bubbleData.text.length > 0) {
        console.log(`   Preview: "${bubbleData.text.substring(0, 50)}..."`);
      }
    } else {
      console.log('   No bubble data found');
      
      // Check what keys exist for this pattern
      const keyPattern = `bubbleId:${composerId}:${header.bubbleId}`;
      const checkStmt = db.prepare('SELECT COUNT(*) as count FROM cursorDiskKV WHERE key = ?');
      const exists = checkStmt.get(keyPattern);
      console.log(`   Key ${keyPattern} exists: ${exists.count > 0}`);
    }
  }
}

db.close();