export const recentCodingWorkPrompt = {
  name: 'recent_coding_work',
  metadata: {
    description: 'Find and analyze recent coding conversations from the last few days',
  },
  handler: async ({ days = '7', focus = 'general development work' }: { days?: string; focus?: string }) => ({
    messages: [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Analyze my recent coding conversations from the last ${days} days, focusing on ${focus}.

First, use the search_conversations_advanced tool to find conversations from the last ${days} days with more than 3 messages. Then examine the most relevant ones to understand what I've been working on.

Please provide:
1. A summary of the main projects or topics I've been working on
2. Key technical challenges or decisions that came up
3. Any patterns in the types of problems I've been solving
4. Suggestions for follow-up work or areas that might need attention

Use the export_conversation tool for any conversations that seem particularly important for detailed analysis.`,
        },
      },
    ],
  }),
}

export const findConversationsAboutPrompt = {
  name: 'find_conversations_about',
  metadata: {
    description: 'Search for conversations containing specific topics or keywords',
  },
  handler: async ({ topic, limit = '10' }: { topic: string; limit?: string }) => {
    if (!topic) {
      throw new Error('Topic argument is required')
    }

    return {
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Find conversations about "${topic}" in my Cursor history.

Use the search_conversations tool to search for "${topic}" with a limit of ${limit}. Then:

1. List the most relevant conversations found
2. For each conversation, provide:
   - Date and basic info
   - Brief summary of what was discussed
   - Key takeaways or decisions made
3. If any conversations look particularly detailed or important, use export_conversation to analyze them more thoroughly

Focus on practical insights and actionable information from these conversations.`,
          },
        },
      ],
    }
  },
}

export const analyzeConversationPrompt = {
  name: 'analyze_conversation',
  metadata: {
    description: 'Export and analyze a specific conversation in detail',
  },
  handler: async ({ conversation_id, analysis_type = 'summary' }: { conversation_id: string; analysis_type?: string }) => {
    if (!conversation_id) {
      throw new Error('conversation_id argument is required')
    }

    const analysisPrompts: Record<string, string> = {
      summary: 'Provide a comprehensive summary of this conversation, highlighting key points, decisions made, and outcomes.',
      code_review: 'Analyze this conversation from a code review perspective. Look for code quality discussions, architectural decisions, bug fixes, and technical improvements.',
      learning_notes: 'Extract learning points and educational content from this conversation. What new concepts, techniques, or best practices were discussed?',
      issues: 'Identify any problems, bugs, or issues discussed in this conversation, along with their solutions or current status.',
    }

    const analysisPrompt = analysisPrompts[analysis_type] || analysisPrompts.summary

    return {
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Analyze conversation ${conversation_id} in detail.

First, use the export_conversation tool to export the conversation to a file, then read the full conversation using the Read tool.

Analysis focus: ${analysisPrompt}

Please structure your analysis with:
1. **Context**: When and what this conversation was about
2. **Key Points**: Main topics and decisions discussed
3. **Technical Details**: Any code, architecture, or technical decisions
4. **Outcomes**: What was accomplished or decided
5. **Follow-up**: Any unresolved items or next steps mentioned`,
          },
        },
      ],
    }
  },
}

export const projectTimelinePrompt = {
  name: 'project_conversation_timeline',
  metadata: {
    description: 'Create a timeline of conversations for a specific project or topic',
  },
  handler: async ({ project_name, time_range = '30' }: { project_name: string; time_range?: string }) => {
    if (!project_name) {
      throw new Error('project_name argument is required')
    }

    return {
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Create a timeline of conversations related to "${project_name}" over the last ${time_range} days.

Use search_conversations to find conversations mentioning "${project_name}", then use search_conversations_advanced to get conversations from the last ${time_range} days sorted by date.

Create a chronological timeline showing:
1. **Date**: When each relevant conversation occurred
2. **Topic**: Main focus of each conversation
3. **Progress**: What was accomplished or decided
4. **Evolution**: How the project evolved over time
5. **Current Status**: Based on the most recent conversations

For conversations with significant detail, use export_conversation to get the full context.

Present this as a clear timeline that shows the project's development journey.`,
          },
        },
      ],
    }
  },
}

export const allPrompts = [
  recentCodingWorkPrompt,
  findConversationsAboutPrompt,
  analyzeConversationPrompt,
  projectTimelinePrompt,
]
