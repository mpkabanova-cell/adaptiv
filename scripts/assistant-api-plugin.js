import { handleAssistantRequest, DEFAULT_MODEL } from "./assistant-handler.js";

async function loadDevConfig() {
  try {
    const mod = await import("../src/assistant/llm.config.js");
    return {
      apiKey: mod.anthropicApiKey || "",
      model: mod.anthropicModel || DEFAULT_MODEL,
    };
  } catch {
    return { apiKey: "", model: DEFAULT_MODEL };
  }
}

function attachAssistantMiddleware(server, configPromise) {
  server.middlewares.use("/api/assistant", (req, res, next) => {
    configPromise
      .then((config) => handleAssistantRequest(req, res, config))
      .catch(next);
  });
}

export function assistantApiPlugin() {
  const devConfig = loadDevConfig();

  return {
    name: "assistant-api",
    configureServer(server) {
      attachAssistantMiddleware(server, devConfig);
    },
    configurePreviewServer(server) {
      attachAssistantMiddleware(server, devConfig);
    },
  };
}
