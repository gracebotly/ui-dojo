import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const webSearchTool = createTool({
  id: 'web-search',
  description: 'Search the internet for information and links',
  inputSchema: z.object({
    query: z.string().describe('Search query'),
  }),
  outputSchema: z.object({
    results: z.array(z.object({
      title: z.string(),
      url: z.string(),
      snippet: z.string(),
    })),
  }),
  execute: async ({ context }) => {
    // Using Brave Search API (free tier available)
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(context.query)}`,
      {
        headers: {
          'X-Subscription-Token': process.env.BRAVE_API_KEY || '',
          'Accept': 'application/json',
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      results: (data.web?.results || []).slice(0, 5).map((r: any) => ({
        title: r.title,
        url: r.url,
        snippet: r.description,
      }))
    };
  },
});
