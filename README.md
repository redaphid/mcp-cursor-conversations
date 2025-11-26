# @redaphid/cursor-conversations

A library for programmatically accessing Cursor IDE's conversation database. Query conversations, messages, code diffs, file snapshots, and context data.

## Installation

```bash
# From GitHub Packages
npm install @redaphid/cursor-conversations --registry=https://npm.pkg.github.com

# Or link locally for development
pnpm link /path/to/mcp-cursor-conversations
```

## Quick Start

```ts
import {
  listConversations,
  listMessages,
  searchConversations
} from '@redaphid/cursor-conversations'

// List recent conversations
const { conversations } = await listConversations({ limit: 10 })

// Get messages from a conversation
const { messages } = await listMessages(conversations[0].conversationId)

// Search across all conversations
const results = await searchConversations('authentication', 20)
```

## API Reference

### Conversations

#### `listConversations(options?)`

List all conversations from the Cursor database.

```ts
const { conversations, total } = await listConversations({
  limit: 50,           // Max results (default: 50)
  offset: 0,           // Skip N results (default: 0)
  sortBy: 'recent_activity', // 'recent_activity' | 'created' | 'updated'
  sortOrder: 'desc'    // 'asc' | 'desc'
})

// Returns: { conversations: ConversationSummary[], total: number }
```

#### `getConversation(conversationId, format?)`

Get a single conversation by ID.

```ts
// Get summary
const summary = await getConversation('abc-123')

// Get full raw data
const full = await getConversation('abc-123', 'full')
```

#### `searchConversations(query, limit?)`

Search conversations by text content.

```ts
const results = await searchConversations('refactor database', 20)

// Returns array of matches with context:
// [{ conversationId, messageCount, preview, matches: [...] }]
```

#### `searchConversationsAdvanced(options?)`

Advanced search with filters.

```ts
const { conversations, totalFound } = await searchConversationsAdvanced({
  date_from: '2024-01-01',
  date_to: '2024-12-31',
  min_messages: 5,
  max_messages: 100,
  status: 'completed',  // 'completed' | 'aborted' | 'all'
  sort_by: 'date',      // 'date' | 'message_count' | 'status'
  sort_order: 'desc',
  limit: 20
})
```

#### `exportConversation(conversationId, format?)`

Export a conversation to a file.

```ts
// Export as markdown
const mdPath = await exportConversation('abc-123', 'markdown')

// Export as JSON
const jsonPath = await exportConversation('abc-123', 'json')

// Returns: '/tmp/cursor-conversation-abc-123.md'
```

---

### Messages

#### `listMessages(conversationId, options?)`

List all messages in a conversation.

```ts
const { messages, count } = await listMessages('abc-123', { limit: 100 })

// Each message includes:
// { messageId, role, text, hasCodeBlocks, hasToolResults, isAgentic, tokenCount }
```

#### `getMessage(conversationId, messageId)`

Get a single message with full data.

```ts
const message = await getMessage('abc-123', 'msg-456')

// Returns full Message object with:
// { messageId, type, text, codeBlocks, toolResults, thinking, ... }
```

#### `getMessageStats()`

Get statistics about messages across all conversations.

```ts
const stats = await getMessageStats()

// { totalMessages, sampleSize, sampleBreakdown: { userMessages, assistantMessages, ... } }
```

---

### Snapshots

File state snapshots captured during conversations.

#### `listSnapshots(conversationId, options?)`

```ts
const { snapshots } = await listSnapshots('abc-123', { limit: 50 })

// [{ snapshotId, fileCount, newFoldersCount, hasInlineDiffs }]
```

#### `getSnapshot(conversationId, snapshotId)`

```ts
const snapshot = await getSnapshot('abc-123', 'snap-789')

// { snapshotId, files, nonExistentFiles, newlyCreatedFolders, activeInlineDiffs }
```

---

### Diffs

Code changes applied during conversations.

#### `listDiffs(conversationId, options?)`

```ts
const { diffs } = await listDiffs('abc-123', { limit: 50 })

// [{ diffId, changesCount, changes: [{ startLine, endLine, linesAdded, preview }] }]
```

#### `getDiff(conversationId, diffId)`

```ts
const diff = await getDiff('abc-123', 'diff-101')

// { diffId, changes: [{ original, modified }] }
```

---

### Context

Context data captured when messages were sent (git status, project layout, etc.).

#### `listContexts(conversationId, options?)`

```ts
const { contexts } = await listContexts('abc-123', { limit: 50 })

// [{ contextId, hasGitStatus, gitStatusPreview, cursorRulesCount, todosCount, ... }]
```

#### `getContext(conversationId, contextId)`

```ts
const ctx = await getContext('abc-123', 'ctx-202')

// { contextId, gitStatus, cursorRules, todos, projectLayouts, terminalFiles, ... }
```

---

### Database Utilities

#### `getDatabaseStats()`

Get overall database statistics.

```ts
const stats = await getDatabaseStats()

// {
//   summary: { conversations, messages, snapshots, diffs, contexts },
//   keyPatterns: { conversation: 685, message: 19542, ... },
//   description: { ... }
// }
```

#### Direct Database Access

For custom queries:

```ts
import { queryAll, queryOne, KEY_PATTERNS } from '@redaphid/cursor-conversations/core'

// Run custom SQL
const rows = queryAll<{ key: string }>(`
  SELECT key FROM cursorDiskKV
  WHERE key LIKE ?
  LIMIT 10
`, [`${KEY_PATTERNS.MESSAGE}%`])

// Get single row
const row = queryOne<{ value: string }>(`
  SELECT value FROM cursorDiskKV WHERE key = ?
`, ['composerData:abc-123'])
```

---

## Types

```ts
import type {
  // Conversations
  ConversationSummary,
  ConversationData,

  // Messages
  Message,
  MessageSummary,
  MessageRole,  // 'user' | 'assistant'

  // Snapshots
  Snapshot,

  // Diffs
  CodeDiff,

  // Context
  MessageContext,
} from '@redaphid/cursor-conversations'
```

---

## Configuration

By default, the library reads from Cursor's default database location:

- **macOS**: `~/Library/Application Support/Cursor/User/globalStorage/state.vscdb`
- **Windows**: `%APPDATA%\Cursor\User\globalStorage\state.vscdb`
- **Linux**: `~/.config/Cursor/User/globalStorage/state.vscdb`

### Programmatic Configuration

```ts
import { setDatabasePath, resetDatabasePath } from '@redaphid/cursor-conversations'

// Set a custom database path
setDatabasePath('/path/to/state.vscdb')

// All subsequent calls will use this path
const { conversations } = await listConversations()

// Reset to default behavior
resetDatabasePath()
```

### Environment Variable

```bash
CURSOR_DB_PATH=/path/to/state.vscdb node your-script.js
```

**Priority order:** `setDatabasePath()` > `CURSOR_DB_PATH` env var > platform default

---

## MCP Server

This package also includes an MCP server for use with Claude Code. See [MCP Setup](docs/mcp-setup.md) for details.

---

## License

MIT
