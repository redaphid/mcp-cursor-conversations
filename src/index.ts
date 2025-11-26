#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createMcpServer } from './server.ts'
import { getDbPath } from './core/database/client.ts'
import { existsSync } from 'fs'

export const main = async () => {
  // Verify database exists
  const dbPath = getDbPath()
  if (!existsSync(dbPath)) {
    console.error(`Cursor database not found at: ${dbPath}`)
    console.error('Please set CURSOR_DB_PATH environment variable if your database is in a different location.')
    process.exit(1)
  }

  const { mcpServer } = await createMcpServer()
  const transport = new StdioServerTransport()
  await mcpServer.connect(transport)

  console.error('Cursor Conversations MCP server running on stdio')
  console.error(`Connected to database: ${dbPath}`)
}

// Auto-start when run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` ||
                     process.argv[1]?.endsWith('index.ts') ||
                     process.argv[1]?.endsWith('index.js')

if (isMainModule) {
  main().catch((error) => {
    console.error('Server error:', error)
    process.exit(1)
  })
}
