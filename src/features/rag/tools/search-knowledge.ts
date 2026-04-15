import 'server-only';

import { tool } from '@langchain/core/tools';
import { z } from 'zod';

import { searchKnowledge, formatSearchResults } from '@/features/rag/services/search';

/**
 * Creates a search_knowledge tool scoped to a specific user.
 * The userId is baked in at creation time so the LLM cannot access other users' data.
 */
export function createSearchKnowledgeTool(userId: string) {
  return tool(
    async ({ query }) => {
      try {
        const results = await searchKnowledge(query, userId, 20, 0.1);

        if (results.length === 0) {
          return "No relevant information found in the user's knowledge base.";
        }

        return formatSearchResults(results);
      } catch (error) {
        console.error('[search-knowledge tool]', error instanceof Error ? error.message : error);
        return 'Knowledge base search failed. Please try again.';
      }
    },
    {
      name: 'search_knowledge',
      description:
        "Search the user's personal knowledge base for relevant information. " +
        'Use this when the user asks about their documents, notes, or uploaded files, ' +
        'or when you need additional context about something the user may have stored.',
      schema: z.object({
        query: z
          .string()
          .describe("The search query to find relevant information in the user's knowledge base"),
      }),
    }
  );
}
