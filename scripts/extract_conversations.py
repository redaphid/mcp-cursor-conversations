#!/usr/bin/env python3
"""
Extract Cursor conversations from the SQLite database.

This script reads conversation data from Cursor's state.vscdb SQLite database
and exports it to JSON files for easier access and analysis.

Usage:
    python extract_conversations.py [--db-path PATH] [--output-dir DIR]

Default paths:
    - macOS: ~/Library/Application Support/Cursor/User/globalStorage/state.vscdb
    - Windows: %APPDATA%/Cursor/User/globalStorage/state.vscdb
    - Linux: ~/.config/Cursor/User/globalStorage/state.vscdb
"""

import sqlite3
import json
import os
from pathlib import Path
import argparse
import sys
from typing import Dict, List, Optional, Tuple


def get_default_db_path() -> Path:
    """Get the default Cursor database path based on the operating system."""
    if sys.platform == "darwin":  # macOS
        return Path.home() / "Library/Application Support/Cursor/User/globalStorage/state.vscdb"
    elif sys.platform == "win32":  # Windows
        return Path(os.environ["APPDATA"]) / "Cursor/User/globalStorage/state.vscdb"
    else:  # Linux and others
        return Path.home() / ".config/Cursor/User/globalStorage/state.vscdb"


def extract_conversations(db_path: Path) -> Tuple[List[Dict], int]:
    """Extract all conversations from the Cursor SQLite database."""
    if not db_path.exists():
        raise FileNotFoundError(f"Database not found at: {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get all composer data entries
    cursor.execute("""
        SELECT key, value 
        FROM cursorDiskKV 
        WHERE key LIKE 'composerData:%'
    """)
    
    conversations = []
    null_count = 0
    
    for key, value in cursor.fetchall():
        composer_id = key.split(':', 1)[1]
        
        if value is None or value == 'null':
            null_count += 1
            continue
            
        try:
            conversation_data = json.loads(value)
            conversation_data['composerId'] = composer_id
            conversations.append(conversation_data)
        except json.JSONDecodeError:
            print(f"Warning: Could not parse JSON for conversation {composer_id}")
            null_count += 1
    
    conn.close()
    return conversations, null_count


def create_summary(conversation: Dict) -> Dict:
    """Create a simplified summary of a conversation."""
    messages = []
    
    for msg in conversation.get('conversation', []):
        message_summary = {
            'type': 'user' if msg.get('type') == 1 else 'assistant',
            'text': msg.get('text', '')
        }
        
        # For assistant messages, try to extract text from responseParts
        if msg.get('type') == 2 and not message_summary['text']:
            response_parts = msg.get('responseParts', [])
            text_parts = []
            for part in response_parts:
                if part.get('type') == 'text' and part.get('rawText'):
                    text_parts.append(part['rawText'])
            message_summary['text'] = ''.join(text_parts)
        
        if message_summary['text']:  # Only add non-empty messages
            messages.append(message_summary)
    
    return {
        'composerId': conversation.get('composerId'),
        'messageCount': len(messages),
        'messages': messages
    }


def save_conversations(conversations: List[Dict], output_dir: Path):
    """Save conversations to JSON files."""
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Create index for easy browsing
    index = []
    
    for conv in conversations:
        composer_id = conv.get('composerId', 'unknown')
        
        # Save full conversation
        full_path = output_dir / f"conversation_{composer_id}_full.json"
        with open(full_path, 'w', encoding='utf-8') as f:
            json.dump(conv, f, indent=2, ensure_ascii=False)
        
        # Create and save summary
        summary = create_summary(conv)
        summary_path = output_dir / f"conversation_{composer_id}_summary.json"
        with open(summary_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        
        # Add to index
        first_message = summary['messages'][0]['text'][:100] if summary['messages'] else "Empty conversation"
        index.append({
            'composerId': composer_id,
            'messageCount': summary['messageCount'],
            'preview': first_message + "..." if len(first_message) == 100 else first_message
        })
    
    # Save index
    index_path = output_dir / "conversations_index.json"
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(index, f, indent=2, ensure_ascii=False)
    
    # Create summary README
    readme_path = output_dir / "README.md"
    with open(readme_path, 'w') as f:
        f.write("# Cursor Conversations Export\n\n")
        f.write(f"Total conversations: {len(conversations)}\n\n")
        f.write("## Conversations by Message Count\n\n")
        
        # Sort by message count
        sorted_convs = sorted(index, key=lambda x: x['messageCount'], reverse=True)
        
        for i, conv in enumerate(sorted_convs[:10]):  # Top 10
            f.write(f"{i+1}. **{conv['composerId']}** ({conv['messageCount']} messages)\n")
            f.write(f"   - {conv['preview']}\n\n")


def main():
    parser = argparse.ArgumentParser(
        description="Extract Cursor conversations from SQLite database"
    )
    parser.add_argument(
        "--db-path",
        type=Path,
        default=get_default_db_path(),
        help="Path to Cursor's state.vscdb database"
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("exported_conversations"),
        help="Directory to save exported conversations"
    )
    
    args = parser.parse_args()
    
    try:
        print(f"Extracting conversations from: {args.db_path}")
        conversations, null_count = extract_conversations(args.db_path)
        
        print(f"Found {len(conversations)} conversations ({null_count} empty/null entries skipped)")
        
        if conversations:
            save_conversations(conversations, args.output_dir)
            print(f"Conversations saved to: {args.output_dir}")
            print(f"- Full conversations: conversation_*_full.json")
            print(f"- Summaries: conversation_*_summary.json")
            print(f"- Index: conversations_index.json")
        else:
            print("No conversations found to export")
            
    except Exception as e:
        print(f"Error: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main())