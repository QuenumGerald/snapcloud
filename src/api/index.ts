// src/api/index.ts
// API REST pour SnapCloud (lance un workflow Temporal)
import express from "express";
import { Connection, Client } from "@temporalio/client";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

const WORKFLOW = "SnapCloudWorkflow";
const TASK_QUEUE = "SNAPCLOUD_QUEUE";

app.post("/generate", async (req, res) => {
  const { requirement } = req.body;
  if (!requirement) return res.status(400).json({ error: "Champ 'requirement' manquant" });
  try {
    const connection = await Connection.connect();
    const client = new Client({ connection });
    const handle = await client.workflow.start(WORKFLOW, {
      args: [requirement],
      taskQueue: TASK_QUEUE,
      workflowId: `snapcloud-${Date.now()}`,
    });
    const result = await handle.result();
    res.json(result);
  } catch (err) {
    console.error("[API] Error:", err);
    const message = (err instanceof Error) ? err.message : String(err);
    res.status(500).json({ error: message || "Internal error" });
  }
});

app.get("/health", (req, res) => res.send("OK"));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[API] SnapCloud backend listening on port ${PORT}`);
});
