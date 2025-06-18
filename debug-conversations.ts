#!/usr/bin/env node
import Database from 'better-sqlite3';
import { homedir } from 'os';
import { join } from 'path';
import { existsSync } from 'fs';

// Database path detection
function getDefaultDbPath(): string {
  if (process.platform === 'darwin') {
    return join(homedir(), 'Library/Application Support/Cursor/User/globalStorage/state.vscdb');
  } else if (process.platform === 'win32') {
    return join(process.env.APPDATA || '', 'Cursor/User/globalStorage/state.vscdb');
  } else {
    return join(homedir(), '.config/Cursor/User/globalStorage/state.vscdb');
  }
}

const DB_PATH = process.env.CURSOR_DB_PATH || getDefaultDbPath();

if (!existsSync(DB_PATH)) {
  console.error(`Cursor database not found at: ${DB_PATH}`);
  process.exit(1);
}

const db = new Database(DB_PATH, { readonly: true });

// Get today's date range
const today = new Date('2025-06-18');
const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
const todayEnd = todayStart + 24 * 60 * 60 * 1000;

console.log('Looking for conversations from today:', new Date(todayStart).toISOString(), 'to', new Date(todayEnd).toISOString());
console.log('---');

try {
  // Query all conversations
  const stmt = db.prepare(`
    SELECT key, value 
    FROM cursorDiskKV 
    WHERE key LIKE 'composerData:%'
    ORDER BY key DESC
    LIMIT 10
  `);
  
  const rows = stmt.all() as Array<{ key: string; value: string }>;
  
  console.log(`Found ${rows.length} most recent conversations\n`);
  
  for (const row of rows) {
    if (!row.value || row.value === 'null') continue;
    
    try {
      const data = JSON.parse(row.value);
      const composerId = row.key.split(':', 2)[1];
      
      console.log(`\nConversation ID: ${composerId}`);
      console.log(`Created: ${data.createdAt ? new Date(data.createdAt).toISOString() : 'N/A'}`);
      console.log(`Updated: ${data.lastUpdatedAt ? new Date(data.lastUpdatedAt).toISOString() : 'N/A'}`);
      console.log(`Status: ${data.status || 'unknown'}`);
      
      // Check if this is from today
      const createdAt = data.createdAt || 0;
      const updatedAt = data.lastUpdatedAt || createdAt;
      const isToday = (createdAt >= todayStart && createdAt < todayEnd) || 
                      (updatedAt >= todayStart && updatedAt < todayEnd);
      
      if (isToday) {
        console.log('*** THIS IS FROM TODAY ***');
      }
      
      // Examine the conversation structure
      console.log('\nConversation structure:');
      console.log('- Has "conversation" field:', !!data.conversation);
      console.log('- Has "messages" field:', !!data.messages);
      console.log('- Has "bubbles" field:', !!data.bubbles);
      
      if (data.conversation) {
        console.log(`- conversation array length: ${data.conversation.length}`);
        
        // Look at first few messages
        for (let i = 0; i < Math.min(3, data.conversation.length); i++) {
          const msg = data.conversation[i];
          console.log(`\n  Message ${i}:`);
          console.log(`  - type: ${msg.type} (${msg.type === 1 ? 'user' : msg.type === 2 ? 'assistant' : 'unknown'})`);
          console.log(`  - bubbleId: ${msg.bubbleId}`);
          console.log(`  - has text field: ${!!msg.text}`);
          console.log(`  - has responseParts: ${!!msg.responseParts}`);
          
          if (msg.text) {
            console.log(`  - text preview: "${msg.text.substring(0, 50)}..."`);
          }
          
          if (msg.responseParts && Array.isArray(msg.responseParts)) {
            console.log(`  - responseParts count: ${msg.responseParts.length}`);
            for (let j = 0; j < Math.min(2, msg.responseParts.length); j++) {
              const part = msg.responseParts[j];
              console.log(`    Part ${j}: type=${part.type}, has rawText=${!!part.rawText}`);
              if (part.rawText) {
                console.log(`    rawText preview: "${part.rawText.substring(0, 50)}..."`);
              }
            }
          }
        }
      }
      
      if (data.messages) {
        console.log(`\n- messages array length: ${data.messages.length}`);
        // Look at structure of messages field if it exists
        for (let i = 0; i < Math.min(2, data.messages.length); i++) {
          const msg = data.messages[i];
          console.log(`  Message ${i} structure:`, Object.keys(msg));
        }
      }
      
      if (data.bubbles) {
        console.log(`\n- bubbles object keys: ${Object.keys(data.bubbles).slice(0, 5).join(', ')}...`);
      }
      
      console.log('\n---');
    } catch (e) {
      console.log(`Error parsing conversation ${row.key}:`, e);
    }
  }
  
} catch (error) {
  console.error('Error:', error);
} finally {
  db.close();
}