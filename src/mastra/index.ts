import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { chatRoute } from "@mastra/ai-sdk";
import { ghibliAgent } from "./agents/ghibli-agent";

export const mastra = new Mastra({
  agents: {
    ghibliAgent,
  },
  storage: new LibSQLStore({
    url: ":memory:",
  }),
  server: {
    apiRoutes: [
      chatRoute({
        path: "/chat/:agentId",
      }),
    ],
  },
});
