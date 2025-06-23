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
  
  // Find the first empty bubble
  const headers = conversation.fullConversationHeadersOnly;
  for (let i = 0; i < Math.min(10, headers.length); i++) {
    const header = headers[i];
    const bubbleData = getBubbleData(db, composerId, header.bubbleId);
    
    if (bubbleData && bubbleData.type === 2 && (!bubbleData.text || bubbleData.text.length === 0)) {
      console.log(`Empty bubble ${i + 1}:`, header);
      console.log('Bubble data keys:', Object.keys(bubbleData));
      console.log('Has responseParts:', Boolean(bubbleData.responseParts));
      if (bubbleData.responseParts) {
        console.log('ResponseParts length:', bubbleData.responseParts.length);
        console.log('First responsePart:', bubbleData.responseParts[0]);
      }
      console.log('---');
      break; // Just check the first empty one
    }
  }
}

db.close();