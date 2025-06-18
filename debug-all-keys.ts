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

try {
  // First, let's see what tables exist
  console.log('Tables in database:');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  tables.forEach((table: any) => console.log(`- ${table.name}`));
  console.log('\n');
  
  // Let's look at all unique key patterns in cursorDiskKV
  console.log('Examining key patterns in cursorDiskKV table:');
  const keyPatterns = new Map<string, number>();
  
  const stmt = db.prepare("SELECT key FROM cursorDiskKV");
  const rows = stmt.all() as Array<{ key: string }>;
  
  rows.forEach(row => {
    if (!row.key) return;
    // Extract the prefix before the first colon
    const prefix = row.key.split(':')[0];
    keyPatterns.set(prefix, (keyPatterns.get(prefix) || 0) + 1);
  });
  
  console.log('Key prefixes and their counts:');
  Array.from(keyPatterns.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([prefix, count]) => {
      console.log(`- ${prefix}: ${count}`);
    });
  
  console.log('\n');
  
  // Look for composer-related keys with different patterns
  console.log('Looking for composer/conversation related keys:');
  const composerKeys = db.prepare(`
    SELECT key 
    FROM cursorDiskKV 
    WHERE key LIKE '%composer%' OR key LIKE '%conversation%' OR key LIKE '%chat%'
    LIMIT 20
  `).all() as Array<{ key: string }>;
  
  composerKeys.forEach(row => console.log(`- ${row.key}`));
  
  console.log('\n');
  
  // Check recent updates by looking at keys with timestamps
  console.log('Checking for recent activity (keys with today\'s date):');
  const today = new Date('2025-06-18');
  const todayStr = today.toISOString().split('T')[0];
  
  const recentKeys = db.prepare(`
    SELECT key, LENGTH(value) as value_length
    FROM cursorDiskKV 
    WHERE key LIKE '%2025-06%' OR value LIKE '%2025-06-18%'
    LIMIT 20
  `).all() as Array<{ key: string, value_length: number }>;
  
  if (recentKeys.length > 0) {
    recentKeys.forEach(row => console.log(`- ${row.key} (value length: ${row.value_length})`));
  } else {
    console.log('No keys found with today\'s date in them');
  }
  
  // Look at the most recently modified composerData entries
  console.log('\n\nChecking timestamps in composerData values:');
  const composerDataStmt = db.prepare(`
    SELECT key, value 
    FROM cursorDiskKV 
    WHERE key LIKE 'composerData:%'
    LIMIT 50
  `);
  
  const composerRows = composerDataStmt.all() as Array<{ key: string; value: string }>;
  const timestampData: Array<{ key: string, created: Date | null, updated: Date | null }> = [];
  
  composerRows.forEach(row => {
    if (row.value && row.value !== 'null') {
      try {
        const data = JSON.parse(row.value);
        timestampData.push({
          key: row.key,
          created: data.createdAt ? new Date(data.createdAt) : null,
          updated: data.lastUpdatedAt ? new Date(data.lastUpdatedAt) : null
        });
      } catch (e) {
        // Skip invalid JSON
      }
    }
  });
  
  // Sort by most recent activity
  timestampData.sort((a, b) => {
    const dateA = a.updated || a.created || new Date(0);
    const dateB = b.updated || b.created || new Date(0);
    return dateB.getTime() - dateA.getTime();
  });
  
  console.log('Most recent composerData entries:');
  timestampData.slice(0, 10).forEach(item => {
    console.log(`- ${item.key}`);
    console.log(`  Created: ${item.created?.toISOString() || 'N/A'}`);
    console.log(`  Updated: ${item.updated?.toISOString() || 'N/A'}`);
  });
  
} catch (error) {
  console.error('Error:', error);
} finally {
  db.close();
}