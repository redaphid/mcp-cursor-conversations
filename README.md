# Cursor Conversations Archive

This repository contains exported conversations from Cursor IDE, capturing the interaction history between users and AI assistants during coding sessions.

## Overview

Cursor stores conversation data in a SQLite database (`state.vscdb`) within its application support directory. This project extracts and organizes that data into a more accessible JSON format for analysis, backup, and portability.

## Repository Structure

```
cursor-conversations/
├── data/                     # Exported conversation files
│   ├── conversation_*_full.json      # Complete conversation data
│   ├── conversation_*_summary.json   # Simplified message-only versions
│   └── conversations_index.json      # Index of all conversations
├── schemas/                  # JSON schemas for data validation
│   └── conversation.schema.json      # Schema defining conversation structure
├── scripts/                  # Analysis and utility scripts
└── README.md                # This file
```

## Data Format

Each conversation is stored in two formats:

### Full Format (`*_full.json`)
Contains complete conversation data including:
- User messages (type: 1)
- Assistant messages (type: 2)
- Code suggestions and diffs
- File context and references
- Editor state and location history
- Capability execution logs

### Summary Format (`*_summary.json`)
Simplified version containing only:
- Conversation ID
- Message count
- Array of messages (text only)

## Schema

The conversation data follows the JSON schema defined in `schemas/conversation.schema.json`. Key properties include:

- `composerId`: Unique UUID for the conversation
- `conversation`: Array of message objects
- `type`: Message type (1 = user, 2 = assistant)
- `bubbleId`: Unique identifier for each message
- `suggestedCodeBlocks`: Code changes proposed by the assistant
- `relevantFiles`: Files referenced in the conversation
- `recentLocationsHistory`: Navigation history within the codebase

## Usage

### Viewing Conversations
Open any `*_summary.json` file to quickly read through a conversation's messages.

### Analyzing Code Suggestions
The `*_full.json` files contain detailed code suggestions with diffs that can be analyzed to understand what changes were proposed.

### Finding Specific Topics
Use the `conversations_index.json` file to browse conversation previews and find discussions on specific topics.

## Statistics

- Total conversations: 82
- Successfully exported: 78
- Message counts range from 1 to 342 messages
- Topics include: shader programming, web development, testing, and various coding tasks

## Data Privacy

These conversations may contain sensitive information including:
- Code snippets from private projects
- File paths revealing project structure
- Development workflows and practices

Please review the data before sharing publicly.

## Technical Details

The original data is stored in Cursor's SQLite database at:
- macOS: `~/Library/Application Support/Cursor/User/globalStorage/state.vscdb`
- Table: `cursorDiskKV`
- Key pattern: `composerData:{uuid}`

## Extraction Script

The `scripts/extract_conversations.py` script can be used to extract conversations from Cursor's SQLite database.

### Usage

```bash
# Extract using default paths
python scripts/extract_conversations.py

# Specify custom database path
python scripts/extract_conversations.py --db-path /path/to/state.vscdb

# Specify custom output directory
python scripts/extract_conversations.py --output-dir /path/to/output
```

### Default Database Locations

- **macOS**: `~/Library/Application Support/Cursor/User/globalStorage/state.vscdb`
- **Windows**: `%APPDATA%/Cursor/User/globalStorage/state.vscdb`
- **Linux**: `~/.config/Cursor/User/globalStorage/state.vscdb`

### What the Script Does

1. Connects to Cursor's SQLite database
2. Extracts all conversations from the `cursorDiskKV` table
3. Creates both full and summary versions of each conversation
4. Generates an index file for easy browsing
5. Creates a summary README with statistics

## Contributing

This is a personal archive repository. If you have similar Cursor conversation data and would like to contribute analysis scripts or tools, please open an issue first to discuss.

## License

The conversation data remains property of the original authors. Any analysis scripts or tools in this repository are provided as-is for educational purposes.