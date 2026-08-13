import { anthropicApiKey, anthropicModel } from "../src/assistant/llm.config.js";

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function toChatPayload(messages) {
  const system = messages
    .filter((item) => item.role === "system")
    .map((item) => item.content)
    .join("\n\n");
  const chatMessages = messages
    .filter((item) => item.role === "user" || item.role === "assistant")
    .map((item) => ({ role: item.role, content: item.content }));

  return { system, messages: chatMessages };
}

function resolveOpenRouterModel(model) {
  if (model.includes("/")) return model;
  if (/claude-sonnet-4-5/i.test(model)) return "anthropic/claude-sonnet-4.5";
  if (/claude-sonnet-4/i.test(model)) return "anthropic/claude-sonnet-4";
  return `anthropic/${model}`;
}

function isOpenRouterKey(key) {
  return key.startsWith("sk-or-");
}

async function callAnthropic({ system, messages }) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: anthropicModel,
      max_tokens: 1024,
      system,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();
  return data.content?.find((block) => block.type === "text")?.text || "";
}

async function callOpenRouter({ system, messages }) {
  const payloadMessages = system
    ? [{ role: "system", content: system }, ...messages]
    : messages;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anthropicApiKey}`,
    },
    body: JSON.stringify({
      model: resolveOpenRouterModel(anthropicModel),
      max_tokens: 1024,
      messages: payloadMessages,
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function handleAssistant(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end("Method Not Allowed");
    return;
  }

  if (!anthropicApiKey) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "API key not configured in llm.config.js" }));
    return;
  }

  try {
    const body = JSON.parse(await readBody(req));
    const chatPayload = toChatPayload(body.messages || []);
    const text = isOpenRouterKey(anthropicApiKey)
      ? await callOpenRouter(chatPayload)
      : await callAnthropic(chatPayload);

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ content: text }));
  } catch (error) {
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: String(error) }));
  }
}

function attachAssistantMiddleware(server) {
  server.middlewares.use("/api/assistant", (req, res, next) => {
    handleAssistant(req, res).catch(next);
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
