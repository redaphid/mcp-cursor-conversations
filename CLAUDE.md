# Claude Code Configuration

This project contains an MCP server that provides direct access to Cursor's conversation database.

## MCP Server Configuration

The MCP server connects directly to Cursor's SQLite database to provide real-time access to your conversation history. It provides the following tools:

- `list_conversations` - List all conversations from the Cursor database with pagination
- `search_conversations` - Search conversations by content in the database
- `search_conversations_advanced` - Advanced search with date range, message count, and status filters
- `get_conversation` - Retrieve a specific conversation by ID from the database

## Available Commands

To start the MCP server:
```bash
npm start
```

To run tests:
```bash
npm test
```

To test advanced search:
```bash
node --experimental-strip-types test-advanced-search.ts
```

## MCP Tools

### list_conversations
Lists all conversations with basic metadata.
- Parameters:
  - `limit` (optional): Maximum number of conversations to return (default: 50)
  - `offset` (optional): Number of conversations to skip (default: 0)

### search_conversations
Search conversations by content.
- Parameters:
  - `query` (required): Search query to find in conversation content
  - `limit` (optional): Maximum number of results to return (default: 20)

### search_conversations_advanced
Advanced search with multiple filter options.
- Parameters:
  - `date_from` (optional): Start date for filtering (ISO 8601 format: YYYY-MM-DD)
  - `date_to` (optional): End date for filtering (ISO 8601 format: YYYY-MM-DD)
  - `min_messages` (optional): Minimum number of messages in conversation
  - `max_messages` (optional): Maximum number of messages in conversation
  - `status` (optional): Filter by conversation status ('completed', 'aborted', 'all', default: 'all')
  - `sort_by` (optional): Sort results by this field ('date', 'message_count', 'status', default: 'date')
  - `sort_order` (optional): Sort order ('asc', 'desc', default: 'desc')
  - `limit` (optional): Maximum number of results to return (default: 20)

Example usage:
```json
{
  "name": "search_conversations_advanced",
  "arguments": {
    "date_from": "2025-01-01",
    "min_messages": 50,
    "status": "completed",
    "sort_by": "message_count",
    "sort_order": "desc",
    "limit": 10
  }
}
```

### get_conversation
Retrieve a specific conversation by ID.
- Parameters:
  - `composer_id` (required): The composer ID of the conversation to retrieve
  - `format` (optional): Format of the conversation data to return ('summary' or 'full', default: 'summary')

## Environment Variables

- `CURSOR_DB_PATH`: Path to Cursor's SQLite database (optional)
  - Default on macOS: `~/Library/Application Support/Cursor/User/globalStorage/state.vscdb`
  - Default on Windows: `%APPDATA%/Cursor/User/globalStorage/state.vscdb`
  - Default on Linux: `~/.config/Cursor/User/globalStorage/state.vscdb`

## Requirements

- Node.js 24.0.0 or higher (required for native TypeScript support)
- Cursor IDE must be installed with an existing conversation database

## How It Works

The MCP server reads directly from Cursor's SQLite database (`state.vscdb`) located in your Cursor application data directory. It queries the `cursorDiskKV` table where conversations are stored with keys like `composerData:{uuid}`. This provides real-time access to all your Cursor conversations without needing to export or extract data.