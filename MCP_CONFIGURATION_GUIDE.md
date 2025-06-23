# Claude MCP Self-Configuration Guide

## Setup Commands

```bash
# ALWAYS use absolute paths
claude mcp add cursor-conversations "node --experimental-strip-types /absolute/path/to/project/src/index.ts" -s user

# Verify setup
claude mcp get cursor-conversations
```

## Prerequisites Check

```bash
# Verify requirements first
node --version  # Must be 24.0.0+
ls -la "$HOME/Library/Application Support/Cursor/User/globalStorage/state.vscdb"  # Database must exist
```

## Troubleshooting

**"ENOENT" or "Server disconnected"**
```bash
# Test server directly
node --experimental-strip-types src/index.ts
# Should show: "Cursor Conversations MCP server running on stdio"
```

**"Cursor database not found"**
```bash
# Find database location
find ~ -name "state.vscdb" 2>/dev/null
export CURSOR_DB_PATH="/path/to/your/state.vscdb"
```

## File Locations

- **Database (macOS)**: `~/Library/Application Support/Cursor/User/globalStorage/state.vscdb`
- **Database (Windows)**: `%APPDATA%/Cursor/User/globalStorage/state.vscdb`
- **Database (Linux)**: `~/.config/Cursor/User/globalStorage/state.vscdb`