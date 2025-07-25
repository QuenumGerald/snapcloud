/**
 * Minimal MiniMax wrapper for SnapCloud
 * --------------------------------------
 * Fournit deux helpers :
 *   - splitSnapTasks(requirement): Promise<string[]>
 *   - generateArchitecture(tasks): Promise<{ diagramMermaid: string, cfnTemplate: string }>
 *
 * Nécessite la variable d'environnement :
 *   MINIMAX_API_KEY
 */
import fetch from "node-fetch";

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_API_URL = process.env.MINIMAX_API_URL || "https://api.minimax.io/v1/text/chatcompletion_v2";

if (!MINIMAX_API_KEY) {
  throw new Error("MINIMAX_API_KEY manquant dans l'environnement");
}

export async function splitSnapTasks(requirement: string): Promise<string[]> {
  const prompt = `Découpe l'exigence suivante en tâches atomiques, retourne uniquement une liste JSON de chaînes :\n${requirement}`;
  const response = await callMiniMax(prompt);

  // Si la réponse est déjà un tableau
  if (Array.isArray(response)) return response;

  // Si la réponse est un objet avec .choices[0].message.content
  if (typeof response === "object" && response.choices && response.choices[0]?.message?.content) {
    try {
      return JSON.parse(response.choices[0].message.content);
    } catch (e) {
      throw new Error("Impossible de parser le contenu MiniMax : " + response.choices[0].message.content);
    }
  }

  // Si la réponse est une string JSON
  if (typeof response === "string") {
    try {
      return JSON.parse(response);
    } catch (e) {
      throw new Error("Impossible de parser la string MiniMax : " + response);
    }
  }

  throw new Error("Format de réponse MiniMax inattendu : " + JSON.stringify(response));
}

export async function generateArchitecture(tasks: string[]): Promise<{ diagramMermaid: string; cfnTemplate: string }> {
  const prompt = `Pour les tâches suivantes, génère :\n1. Un diagramme AWS en Mermaid (dans un bloc markdown)\n2. Un template CloudFormation YAML (dans un bloc markdown)\n\nTâches :\n${tasks.join("\n")}`;
  const response = await callMiniMax(prompt);
  // Extraction basique des blocs mermaid/yaml
  const mermaidMatch = response.match(/```mermaid[\s\S]*?```/i);
  const yamlMatch = response.match(/```yaml[\s\S]*?```/i);
  const cleanBlock = (block?: string) => block ? block.replace(/```(mermaid|yaml)?/gi, "").trim() : "";
  return {
    diagramMermaid: cleanBlock(mermaidMatch?.[0]),
    cfnTemplate: cleanBlock(yamlMatch?.[0]),
  };
}

async function callMiniMax(prompt: string): Promise<any> {
  const body = {
    model: "MiniMax-M1",
    messages: [
      { role: "system", name: "MiniMax AI" },
      { role: "user", name: "user", content: prompt },
    ],
    max_tokens: 2048,
    temperature: 0.2,
    top_p: 0.95,
    mask_sensitive_info: false,
  };
  const res = await fetch(MINIMAX_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${MINIMAX_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`MiniMax API error: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  // Le texte généré est dans data.choices[0].message.content
  return data.choices?.[0]?.message?.content || data.result || data;
}

// Si tu veux tester en CLI :
if (import.meta.url === `file://${process.argv[1]}` && process.argv.length > 2) {
  (async () => {
    const requirement = process.argv.slice(2).join(" ");
    const tasks = await splitSnapTasks(requirement);
    console.log("Tâches :", tasks);
    const archi = await generateArchitecture(tasks);
    console.log("Diagramme :\n", archi.diagramMermaid);
    console.log("CFN :\n", archi.cfnTemplate);
  })();
}
