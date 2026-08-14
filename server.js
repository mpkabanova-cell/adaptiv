import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import {
  getAssistantConfigFromEnv,
  handleAssistantRequest,
} from "./scripts/assistant-handler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT) || 3000;
const assistantConfig = getAssistantConfigFromEnv();

app.use(express.json({ limit: "1mb" }));

app.post("/api/assistant", (req, res) => {
  handleAssistantRequest(req, res, assistantConfig).catch((error) => {
    res.status(502).json({ error: String(error) });
  });
});

app.use(express.static(path.join(__dirname, "dist"), { index: false }));

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Adaptiv listening on http://0.0.0.0:${port}`);
});
