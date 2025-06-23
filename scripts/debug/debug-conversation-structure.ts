import { openDatabase } from './src/lib/openDatabase.ts';
import { getDbPath } from './src/lib/getDbPath.ts';

const dbPath = getDbPath();
const db = await openDatabase(dbPath);

const stmt = db.prepare('SELECT value FROM cursorDiskKV WHERE key = ? LIMIT 1');
const row = stmt.get('composerData:ffdbf365-2f94-4989-b9d9-a74ea75d19b6');

if (row) {
  const conversation = JSON.parse(row.value);
  console.log('Conversation keys:', Object.keys(conversation));
  console.log('Has conversation array:', Boolean(conversation.conversation));
  console.log('Has conversationMap:', Boolean(conversation.conversationMap));
  console.log('Has fullConversationHeadersOnly:', Boolean(conversation.fullConversationHeadersOnly));
  console.log('\nSample fields:');
  for (const [key, value] of Object.entries(conversation)) {
    if (typeof value === 'string' && value.length > 100) {
      console.log(`  ${key}: <long string ${value.length} chars>`);
    } else if (Array.isArray(value)) {
      console.log(`  ${key}: Array[${value.length}]`);
      if (value.length > 0) {
        console.log(`    First item keys: ${Object.keys(value[0] || {}).join(', ')}`);
      }
    } else if (typeof value === 'object' && value !== null) {
      console.log(`  ${key}: Object with keys [${Object.keys(value).join(', ')}]`);
    } else {
      console.log(`  ${key}: ${value}`);
    }
  }
}

db.close();