import { Mastra } from "@mastra/core/mastra";
import { registerCopilotKit } from "@ag-ui/mastra/copilotkit";
import { LibSQLStore } from "@mastra/libsql";
import { chatRoute, workflowRoute } from "@mastra/ai-sdk";
import { ghibliAgent } from "./agents/ghibli-agent";
import { weatherAgent } from "./agents/weather-agent";
import { weatherWorkflow } from "./workflows/weather-workflow";

export const mastra = new Mastra({
  agents: {
    ghibliAgent,
    weatherAgent,
  },
  workflows: {
    weatherWorkflow,
  },
  storage: new LibSQLStore({
    url: ":memory:",
  }),
  server: {
    cors: {
      origin: "*",
      allowMethods: ["*"],
      allowHeaders: ["*"],
    },
    apiRoutes: [
      chatRoute({
        path: "/chat/:agentId",
      }),
      workflowRoute({
        path: "/workflow/:workflowId",
      }),
      registerCopilotKit({
        path: "/copilotkit",
        resourceId: "ghibliAgent",
      }),
    ],
  },
});
