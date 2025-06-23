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
  
  // Check the empty bubble
  const header = { bubbleId: 'e59c9f6f-3902-4f31-a330-364d4d617fb0', type: 2 };
  const bubbleData = getBubbleData(db, composerId, header.bubbleId);
  
  if (bubbleData) {
    console.log('Text field:', JSON.stringify(bubbleData.text));
    console.log('Text field type:', typeof bubbleData.text);
    console.log('Text field length:', bubbleData.text ? bubbleData.text.length : 'null/undefined');
    console.log('Has codeBlocks:', Boolean(bubbleData.codeBlocks));
    console.log('CodeBlocks length:', bubbleData.codeBlocks ? bubbleData.codeBlocks.length : 'null/undefined');
    console.log('Has intermediateChunks:', Boolean(bubbleData.intermediateChunks));
    console.log('IntermediateChunks length:', bubbleData.intermediateChunks ? bubbleData.intermediateChunks.length : 'null/undefined');
    console.log('Has thinking:', Boolean(bubbleData.thinking));
    console.log('Thinking length:', bubbleData.thinking ? bubbleData.thinking.length : 'null/undefined');
    
    if (bubbleData.intermediateChunks && bubbleData.intermediateChunks.length > 0) {
      console.log('First intermediate chunk:', bubbleData.intermediateChunks[0]);
    }
  }
}

db.close();