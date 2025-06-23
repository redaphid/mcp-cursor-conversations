# Cursor Conversations MCP Server

An MCP (Model Context Protocol) server that provides direct access to your Cursor IDE conversation history. Connect to Claude Code to search and analyze your past AI conversations.

## Quick Start

### 1. Prerequisites
- **Node.js 24.0.0+** (required for TypeScript support)
- **Cursor IDE** with existing conversations

### 2. Clone and Install

```bash
git clone https://github.com/your-username/mcp-cursor-conversations.git
cd mcp-cursor-conversations
npm install
```

### 3. Set Up with Claude Code

```bash
# Add MCP server (use your actual project path)
claude mcp add cursor-conversations "node --experimental-strip-types /absolute/path/to/project/src/index.ts" -s user

# Verify setup
claude mcp get cursor-conversations
```

### 4. Start Using

Ask Claude to search your conversations:
```
Search my Cursor conversations for "React components"
```

```
List my most recent conversations from the past week
```

```
Find conversations with more than 50 messages about debugging
```

## Available Tools

- **`list_conversations`** - List all conversations with pagination
- **`search_conversations`** - Search by content with basic filters  
- **`search_conversations_advanced`** - Advanced search with date/count/status filters
- **`get_conversation`** - Retrieve specific conversation by ID

## System Requirements

- **Node.js 24.0.0+** (required for TypeScript support)
- **Cursor IDE** with existing conversations

## How It Works

The MCP server reads directly from Cursor's SQLite database (`state.vscdb`) located in your Cursor application data directory. It queries the `cursorDiskKV` table where conversations are stored, providing real-time access without needing to export data.

## Troubleshooting

### Quick Diagnostics

```bash
# Verify Node.js version
node --version  # Should be 24.0.0+

# Test database connection
node --experimental-strip-types src/index.ts
# Should show: "Cursor Conversations MCP server running on stdio"

# Check database exists
ls -la "$HOME/Library/Application Support/Cursor/User/globalStorage/state.vscdb"
```

### Common Issues

#### "ENOENT: no such file or directory"
**Problem**: Can't find node or database

**Solutions**:
1. Use full path to node: `which node` then use that path in config
2. Set custom database path: `export CURSOR_DB_PATH="/path/to/state.vscdb"`

#### "Cursor database not found"
**Problem**: Database not at expected location

**Solution**:
```bash
# Find your database
find ~ -name "state.vscdb" 2>/dev/null

# Set custom path
export CURSOR_DB_PATH="/path/to/your/state.vscdb"
```

## Database Locations

- **macOS**: `~/Library/Application Support/Cursor/User/globalStorage/state.vscdb`
- **Windows**: `%APPDATA%/Cursor/User/globalStorage/state.vscdb`  
- **Linux**: `~/.config/Cursor/User/globalStorage/state.vscdb`

## Advanced Configuration

### Environment Variables
```bash
# Custom database location
export CURSOR_DB_PATH="/path/to/custom/state.vscdb"

# Debug logging
export DEBUG="cursor-conversations:*"
```

### MCP Server Commands
```bash
claude mcp list    # Show all configured servers
claude mcp remove cursor-conversations -s user  # Remove if needed
```

## Privacy Note

This tool accesses your local Cursor conversation data. No data is sent to external services - everything runs locally on your machine.

## License

MIT License - see LICENSE file for details.