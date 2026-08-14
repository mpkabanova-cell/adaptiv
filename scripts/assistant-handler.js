export const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";

export function getAssistantConfigFromEnv() {
  return {
    apiKey: process.env.ANTHROPIC_API_KEY || "",
    model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
  };
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function readRequestBody(req) {
  if (req.body !== undefined && req.body !== null) {
    return req.body;
  }

  const raw = await readRawBody(req);
  return raw ? JSON.parse(raw) : {};
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

async function callAnthropic({ apiKey, model, system, messages }) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
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

async function callOpenRouter({ apiKey, model, system, messages }) {
  const payloadMessages = system
    ? [{ role: "system", content: system }, ...messages]
    : messages;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: resolveOpenRouterModel(model),
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

export async function callAssistant({ apiKey, model, messages }) {
  const chatPayload = toChatPayload(messages || []);
  return isOpenRouterKey(apiKey)
    ? callOpenRouter({ apiKey, model, ...chatPayload })
    : callAnthropic({ apiKey, model, ...chatPayload });
}

function sendJson(res, statusCode, payload) {
  if (typeof res.status === "function") {
    res.status(statusCode).json(payload);
    return;
  }

  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

export async function handleAssistantRequest(req, res, config) {
  if (req.method !== "POST") {
    if (typeof res.status === "function") {
      res.status(405).end("Method Not Allowed");
    } else {
      res.statusCode = 405;
      res.end("Method Not Allowed");
    }
    return;
  }

  const apiKey = config?.apiKey || "";
  const model = config?.model || DEFAULT_MODEL;

  if (!apiKey) {
    sendJson(res, 503, {
      error: "API key not configured. Set ANTHROPIC_API_KEY on Render or llm.config.js locally.",
    });
    return;
  }

  try {
    const body = await readRequestBody(req);
    const text = await callAssistant({ apiKey, model, messages: body.messages || [] });
    sendJson(res, 200, { content: text });
  } catch (error) {
    sendJson(res, 502, { error: String(error) });
  }
}
