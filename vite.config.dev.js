import { mergeConfig } from "vite";
import base from "./vite.config.js";
import { assistantApiPlugin } from "./scripts/assistant-api-plugin.js";

export default mergeConfig(base, {
  plugins: [assistantApiPlugin()],
});
