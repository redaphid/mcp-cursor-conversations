import Database from 'better-sqlite3';
import { homedir } from 'os';
import { join } from 'path';

const dbPath = join(homedir(), 'Library/Application Support/Cursor/User/globalStorage/state.vscdb');
const db = new Database(dbPath, { readonly: true });

// Get recent conversations
const stmt = db.prepare("SELECT key, value FROM cursorDiskKV WHERE key LIKE 'composerData:%' ORDER BY key DESC LIMIT 5");
const rows = stmt.all();

for (const row of rows) {
  console.log('\nKey:', row.key);
  if (row.value && row.value !== 'null') {
    try {
      const data = JSON.parse(row.value);
      console.log('Data structure keys:', Object.keys(data));
      if (data.messages) {
        console.log('Has messages array with', data.messages.length, 'messages');
        if (data.messages.length > 0) {
          console.log('First message:', JSON.stringify(data.messages[0]).substring(0, 200));
        }
      }
      if (data.conversation) {
        console.log('Has conversation array with', data.conversation.length, 'items');
        if (data.conversation.length > 0) {
          console.log('First conversation item:', JSON.stringify(data.conversation[0]).substring(0, 200));
        }
      }
    } catch (e) {
      console.log('Failed to parse:', e.message);
    }
  } else {
    console.log('Value is null or empty');
  }
}

db.close();