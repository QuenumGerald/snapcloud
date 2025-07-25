// src/workflow/activities.ts
// Activités MiniMax pour Temporal SnapCloud
import { splitSnapTasks, generateArchitecture } from "../agents/minimax.ts";

/**
 * Découpe le besoin client en tâches atomiques (MiniMax)
 */
export async function splitSnapTasksActivity(input: { requirement: string }): Promise<string[]> {
  return await splitSnapTasks(input.requirement);
}

/**
 * Génère le diagramme AWS (Mermaid) et le template CloudFormation (MiniMax)
 */
export async function generateArchitectureActivity(tasks: string[]): Promise<{ diagramMermaid: string; cfnTemplate: string }> {
  return await generateArchitecture(tasks);
}

/**
 * (Stub) Analyse de sécurité (Wiz, à implémenter plus tard)
 */
export async function runSecurityAuditActivity(artefacts: { cfnTemplate: string }): Promise<{ report: string }> {
  // Stub: renvoie un rapport fictif
  return { report: "Audit Wiz non implémenté (stub)." };
}

// Pour lier ces activités au worker, importe-les dans le fichier de démarrage du worker.
