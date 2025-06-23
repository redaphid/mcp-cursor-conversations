# Claude Code Configuration

This project contains an MCP server that provides direct access to Cursor's conversation database.

## Setup Commands

```bash
# Install dependencies
npm install

# Add to Claude Code (use absolute path)
claude mcp add cursor-conversations "node --experimental-strip-types /absolute/path/to/project/src/index.ts" -s user
```

## Requirements

- **Node.js 24.0.0+** (required for `--experimental-strip-types` flag)
- **Cursor IDE** with existing conversations
- **Database location**: `~/Library/Application Support/Cursor/User/globalStorage/state.vscdb` (macOS)

## Troubleshooting

```bash
# Test database connection
node --experimental-strip-types src/index.ts
# Should output: "Cursor Conversations MCP server running on stdio"

# Find database if not in default location
find ~ -name "state.vscdb" 2>/dev/null
export CURSOR_DB_PATH="/path/to/your/state.vscdb"
```

## How It Works

Reads directly from Cursor's SQLite database (`state.vscdb`), querying the `cursorDiskKV` table where conversations are stored with keys like `composerData:{uuid}`.