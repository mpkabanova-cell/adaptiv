import { anthropicApiKey, anthropicModel } from "../src/assistant/llm.config.js";
import { handleAssistantRequest } from "./assistant-handler.js";

const devConfig = {
  apiKey: anthropicApiKey,
  model: anthropicModel,
};

function attachAssistantMiddleware(server) {
  server.middlewares.use("/api/assistant", (req, res, next) => {
    handleAssistantRequest(req, res, devConfig).catch(next);
  });
}

export function assistantApiPlugin() {
  return {
    name: "assistant-api",
    configureServer(server) {
      attachAssistantMiddleware(server);
    },
    configurePreviewServer(server) {
      attachAssistantMiddleware(server);
    },
  };
}
