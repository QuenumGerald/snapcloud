// src/workflow/worker.ts
// Worker Temporal pour SnapCloud (MiniMax)
import { Worker } from "@temporalio/worker";
import * as activities from "./activities.ts";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const worker = await Worker.create({
    workflowsPath: path.join(__dirname, "SnapCloudWorkflow.ts"),
    activities,
    taskQueue: "SNAPCLOUD_QUEUE",
  });
  await worker.run();
}

run().catch((err) => {
  console.error("[Worker] Fatal error:", err);
  process.exit(1);
});
