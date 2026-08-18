import { copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = [
  "src/CourseApp.jsx",
  "src/pages/HomePage.jsx",
  "src/data/courses.js",
  "src/data/learning-data-math.json",
  "src/data/learning-data-fingram.json",
];

const llmExample = join(root, "src/assistant/llm.config.example.js");
const llmConfig = join(root, "src/assistant/llm.config.js");

let hasErrors = false;

for (const relativePath of requiredFiles) {
  const absolutePath = join(root, relativePath);
  if (!existsSync(absolutePath)) {
    console.error(`[setup] Missing required file: ${relativePath}`);
    hasErrors = true;
  }
}

if (!existsSync(llmConfig) && existsSync(llmExample)) {
  copyFileSync(llmExample, llmConfig);
  console.log("[setup] Created src/assistant/llm.config.js from example");
}

const missingData = requiredFiles
  .filter((path) => path.endsWith(".json"))
  .some((path) => !existsSync(join(root, path)));

if (missingData) {
  console.log("[setup] Generating course data from Excel...");
  const result = spawnSync("python3", ["scripts/extract_learning_data.py"], {
    cwd: root,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    console.error("[setup] Failed to generate learning data");
    hasErrors = true;
  }
}

if (hasErrors) {
  console.error(
    "[setup] Local project is incomplete. Run `npm run data` and ensure all source files exist.",
  );
  process.exit(1);
}

console.log("[setup] Local environment ready");
