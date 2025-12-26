import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import fs from 'fs/promises';

export const readFileTool = createTool({
  id: 'read-file',
  description: 'Read contents of a file from the filesystem',
  inputSchema: z.object({
    filePath: z.string().describe('Path to the file to read'),
  }),
  outputSchema: z.object({
    content: z.string(),
    fileName: z.string(),
  }),
  execute: async ({ context }) => {
    const content = await fs.readFile(context.filePath, 'utf-8');
    return {
      content,
      fileName: context.filePath.split('/').pop() || '',
    };
  },
});
