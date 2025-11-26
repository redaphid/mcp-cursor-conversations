# Claude Code Configuration

This project contains an MCP server that provides direct access to Cursor's conversation database.

## Setup Commands

```bash
# Install dependencies
pnpm install

# Add to Claude Code (use absolute path)
claude mcp add cursor-conversations "pnpm --dir /absolute/path/to/project tsx src/index.ts" -s user
```

## Requirements

- **Node.js 24.0.0+**
- **pnpm** (package manager)
- **Cursor IDE** with existing conversations
- **Database location**: `~/Library/Application Support/Cursor/User/globalStorage/state.vscdb` (macOS)

## Troubleshooting

```bash
# Test database connection
pnpm start
# Should output: "Cursor Conversations MCP server running on stdio"

# Find database if not in default location
find ~ -name "state.vscdb" 2>/dev/null
export CURSOR_DB_PATH="/path/to/your/state.vscdb"
```

## How It Works

Reads directly from Cursor's SQLite database (`state.vscdb`), querying the `cursorDiskKV` table where conversations are stored with keys like `composerData:{uuid}`.
