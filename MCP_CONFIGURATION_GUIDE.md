# MCP Server Configuration, Debugging, and Validation Guide

## Overview
This guide provides instructions for configuring, debugging, and validating MCP (Model Context Protocol) servers in Claude Code.

## Configuration

### 1. Understanding MCP Server Types
MCP servers can use different transport protocols:
- **stdio**: Standard input/output (for local executables)
- **sse**: Server-Sent Events (for remote HTTP endpoints)
- **http**: HTTP POST requests

### 2. Adding MCP Servers

#### For SSE (Remote) Servers:
```bash
claude mcp add <name> <url> -s <scope> -t sse [-H "Header: Value"]
```

Example with authentication:
```bash
claude mcp add github https://api.githubcopilot.com/mcp -s user -t sse -H "Authorization: Bearer <token>"
```

#### For Local (stdio) Servers:
```bash
claude mcp add <name> <command> [args...] -s <scope>
```

Example:
```bash
claude mcp add my-tool node index.js -s project
```

### 3. Configuration Scopes
- **user**: Available in all projects (`-s user`)
- **project**: Only in current project (`-s project`)
- **local**: Local to current directory (`-s local`)

### 4. Authentication Methods

#### For GitHub MCP Server:
1. **OAuth** (default): No additional configuration needed
2. **Personal Access Token**: Use `-H "Authorization: Bearer <token>"`
3. **Environment Variable**: Set `GITHUB_PERSONAL_ACCESS_TOKEN`

## Debugging

### 1. List Current MCP Servers
```bash
claude mcp list
```

### 2. Get Detailed Server Information
```bash
claude mcp get <server-name>
```
This shows:
- Scope (user/project/local)
- Transport type (stdio/sse/http)
- URL or command
- Headers (if any)
- How to remove it

### 3. Common Issues and Solutions

#### Server Added as Wrong Type
If a server is added as stdio when it should be sse:
1. Remove it: `claude mcp remove <name> -s <scope>`
2. Re-add with correct transport: `-t sse`

#### Authentication Failures
- Verify token/credentials are correct
- Check if headers are properly formatted
- Ensure environment variables are set (if using that method)

#### Invalid Configuration Errors
- The `add-json` command requires specific JSON format
- Use the standard `add` command with flags instead for reliability

### 4. Checking MCP Server Availability
- SSE servers should respond to HTTP requests
- Test the endpoint directly: `curl -H "Authorization: Bearer <token>" <url>`

## Validation

### 1. Verify Server Configuration
After adding a server:
```bash
claude mcp get <server-name>
```

Check that:
- Transport type is correct
- URL/command is accurate
- Headers/authentication are present (if needed)

### 2. Test Server Functionality
Start a new Claude session and check if the MCP tools are available:
```bash
claude -c "What MCP tools do I have access to?"
```

### 3. Project-Specific Configuration
For project MCP servers, check `.mcp.json`:
```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["--experimental-strip-types", "src/index.ts"],
      "env": {}
    }
  }
}
```

### 4. SSE Server Configuration Format
For SSE servers in configuration files:
```json
{
  "mcpServers": {
    "github": {
      "transport": {
        "type": "sse",
        "url": "https://api.githubcopilot.com/mcp",
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

## Best Practices

1. **Always verify after adding**: Use `claude mcp get` to confirm configuration
2. **Use appropriate scope**: User scope for personal tools, project scope for project-specific tools
3. **Secure credentials**: Don't commit tokens to version control
4. **Test immediately**: Validate the server works before relying on it
5. **Document custom servers**: Include setup instructions in project documentation

## Quick Reference

### Essential Commands
```bash
# Add SSE server with auth
claude mcp add <name> <url> -s user -t sse -H "Authorization: Bearer <token>"

# List all servers
claude mcp list

# Get server details
claude mcp get <name>

# Remove server
claude mcp remove <name> -s <scope>

# Add local stdio server
claude mcp add <name> <command> [args...] -s project
```

### Debugging Checklist
- [ ] Correct transport type (stdio/sse/http)?
- [ ] Proper authentication headers?
- [ ] Correct scope (user/project/local)?
- [ ] Server endpoint accessible?
- [ ] No typos in URL/command?
- [ ] Environment variables set (if needed)?

This guide should help future Claude sessions properly configure, debug, and validate MCP servers efficiently.