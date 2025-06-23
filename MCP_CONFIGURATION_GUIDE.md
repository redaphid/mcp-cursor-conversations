# Claude MCP Self-Configuration Guide

## For Claude: How to Set Up MCP Servers

When asked to configure MCP servers, use these commands and file operations:

### Claude Code Setup
```bash
# Add this project's MCP server
claude mcp add cursor-conversations "node --experimental-strip-types /path/to/project/src/index.ts" -s user

# Verify setup
claude mcp get cursor-conversations

# Remove if needed
claude mcp remove cursor-conversations -s user
```

### Claude Desktop Setup
Edit or create: `~/Library/Application Support/Claude/claude_desktop_config.json`
```json
{
  "mcpServers": {
    "cursor-conversations": {
      "command": "node",
      "args": ["--experimental-strip-types", "/path/to/project/src/index.ts"],
      "env": {}
    }
  }
}
```

### Cursor Setup  
Create `.mcp.json` in project directory:
```json
{
  "mcpServers": {
    "cursor-conversations": {
      "command": "node", 
      "args": ["--experimental-strip-types", "src/index.ts"],
      "env": {}
    }
  }
}
```

## Common User Requests

**"Set up the MCP server for all environments"**
- Run Claude Code command
- Create/update Claude Desktop config file
- Create Cursor .mcp.json file
- Tell user to restart Claude Desktop

**"Update the path to /new/path"**
- Update all three configurations with new path
- Use `claude mcp remove` then `claude mcp add` for Claude Code

**"The server isn't working"**
- Check file paths exist
- Verify JSON syntax
- Confirm Node.js 24+ installed
- Remind about Claude Desktop restart

## File Locations
- Claude Code: Uses `claude mcp` commands
- Claude Desktop: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Cursor: `.mcp.json` in project root