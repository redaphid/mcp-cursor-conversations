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

// IDs found with today's date
const todayComposerIds = [
  '33f6d943-03b7-48c4-b69e-20c0e6bcc337',
  'e0188e6d-d6a7-4b64-a093-7b3eb9a96566',
  'ccdaa921-ca29-472b-96f4-d125f4b3e393',
  '348caff7-80c3-469a-a945-e61681730ef6'
];

console.log('Checking conversations from today (2025-06-18):\n');

try {
  for (const composerId of todayComposerIds) {
    console.log(`\nChecking composer ID: ${composerId}`);
    console.log('='.repeat(60));
    
    // Check if composerData exists
    const composerDataStmt = db.prepare('SELECT value FROM cursorDiskKV WHERE key = ?');
    const composerRow = composerDataStmt.get(`composerData:${composerId}`) as { value: string } | undefined;
    
    if (composerRow) {
      console.log('✓ Found composerData entry');
      
      if (composerRow.value && composerRow.value !== 'null') {
        try {
          const data = JSON.parse(composerRow.value);
          console.log(`  Created: ${data.createdAt ? new Date(data.createdAt).toISOString() : 'N/A'}`);
          console.log(`  Updated: ${data.lastUpdatedAt ? new Date(data.lastUpdatedAt).toISOString() : 'N/A'}`);
          console.log(`  Status: ${data.status || 'unknown'}`);
          console.log(`  Conversation array length: ${data.conversation?.length || 0}`);
          
          // Show message count by type
          if (data.conversation && Array.isArray(data.conversation)) {
            let userMessages = 0;
            let assistantMessages = 0;
            let otherMessages = 0;
            
            data.conversation.forEach((msg: any) => {
              if (msg.type === 1) userMessages++;
              else if (msg.type === 2) assistantMessages++;
              else otherMessages++;
            });
            
            console.log(`  Messages: ${userMessages} user, ${assistantMessages} assistant, ${otherMessages} other`);
          }
        } catch (e) {
          console.log('  Error parsing JSON:', e);
        }
      } else {
        console.log('  Value is null or empty');
      }
    } else {
      console.log('✗ No composerData entry found');
    }
    
    // Check for related bubbleId entries
    const bubbleStmt = db.prepare(`
      SELECT key, LENGTH(value) as value_length 
      FROM cursorDiskKV 
      WHERE key LIKE 'bubbleId:${composerId}:%'
      LIMIT 5
    `);
    const bubbleRows = bubbleStmt.all() as Array<{ key: string, value_length: number }>;
    
    if (bubbleRows.length > 0) {
      console.log(`\n  Related bubble entries (${bubbleRows.length} found):`);
      bubbleRows.forEach(row => {
        console.log(`  - ${row.key} (${row.value_length} bytes)`);
      });
    }
    
    // Check for messageRequestContext entries
    const messageStmt = db.prepare(`
      SELECT key, LENGTH(value) as value_length 
      FROM cursorDiskKV 
      WHERE key LIKE 'messageRequestContext:${composerId}:%'
      LIMIT 5
    `);
    const messageRows = messageStmt.all() as Array<{ key: string, value_length: number }>;
    
    if (messageRows.length > 0) {
      console.log(`\n  Related message context entries (${messageRows.length} found):`);
      messageRows.forEach(row => {
        console.log(`  - ${row.key} (${row.value_length} bytes)`);
      });
    }
  }
  
  // Let's also check if there are any composerData entries created today that we missed
  console.log('\n\nSearching for any composerData entries created today...');
  const allComposerStmt = db.prepare(`
    SELECT key, value 
    FROM cursorDiskKV 
    WHERE key LIKE 'composerData:%'
  `);
  
  const allComposerRows = allComposerStmt.all() as Array<{ key: string; value: string }>;
  const todayStart = new Date('2025-06-18').getTime();
  const todayEnd = todayStart + 24 * 60 * 60 * 1000;
  
  const todayConversations: any[] = [];
  
  allComposerRows.forEach(row => {
    if (row.value && row.value !== 'null') {
      try {
        const data = JSON.parse(row.value);
        const createdAt = data.createdAt || 0;
        const updatedAt = data.lastUpdatedAt || createdAt;
        
        if ((createdAt >= todayStart && createdAt < todayEnd) || 
            (updatedAt >= todayStart && updatedAt < todayEnd)) {
          todayConversations.push({
            key: row.key,
            created: new Date(createdAt).toISOString(),
            updated: updatedAt ? new Date(updatedAt).toISOString() : null,
            messageCount: data.conversation?.length || 0
          });
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }
  });
  
  if (todayConversations.length > 0) {
    console.log(`\nFound ${todayConversations.length} conversations from today:`);
    todayConversations.forEach(conv => {
      console.log(`- ${conv.key}`);
      console.log(`  Created: ${conv.created}`);
      console.log(`  Updated: ${conv.updated}`);
      console.log(`  Messages: ${conv.messageCount}`);
    });
  } else {
    console.log('\nNo composerData entries found from today');
  }
  
} catch (error) {
  console.error('Error:', error);
} finally {
  db.close();
}