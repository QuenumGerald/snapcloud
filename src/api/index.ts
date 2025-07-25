// src/api/index.ts
// API REST pour SnapCloud (appelle MiniMax directement)
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { splitSnapTasks, generateArchitecture } from "../agents/minimax.ts";

const app = express();
app.use(express.json());

app.post("/generate", async (req, res) => {
  const { requirement } = req.body;
  if (!requirement) return res.status(400).json({ error: "Champ 'requirement' manquant" });
  try {
    // Étape 1: Découper le besoin en tâches atomiques
    const tasks = await splitSnapTasks(requirement);
    
    // Étape 2: Générer l'architecture AWS et le template CloudFormation
    const { diagramMermaid, cfnTemplate, costEstimation } = await generateArchitecture(tasks);
    
    res.json({
      tasks,
      deliverables: {
        diagramMermaid,
        cfnTemplate,
        costEstimation
      }
    });
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
