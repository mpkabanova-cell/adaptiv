import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { assistantApiPlugin } from "./scripts/assistant-api-plugin.js";

export default defineConfig({
  plugins: [react(), assistantApiPlugin()],
});
