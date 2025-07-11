#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createMcpServer } from './lib/createMcpServer.ts'
import { getDbPath } from './lib/getDbPath.ts'
import { existsSync } from 'fs'

// Start the server
async function main() {
  // Verify database exists
  const dbPath = getDbPath()
  if (!existsSync(dbPath)) {
    console.error(`Cursor database not found at: ${dbPath}`)
    console.error('Please set CURSOR_DB_PATH environment variable if your database is in a different location.')
    process.exit(1)
  }

  const server = createMcpServer()
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('Cursor Conversations MCP server running on stdio')
  console.error(`Connected to database: ${dbPath}`)
}

main().catch((error) => {
  console.error('Server error:', error)
  process.exit(1)
})