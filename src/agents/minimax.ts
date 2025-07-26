/**
 * Minimal MiniMax wrapper for SnapCloud
 * --------------------------------------
 * Provides two helpers:
 *   - splitSnapTasks(requirement): Promise<string[]>
 *   - generateArchitecture(tasks): Promise<{ diagramMermaid: string, cfnTemplate: string }>
 *
 * Requires the environment variable:
 *   MINIMAX_API_KEY
 */
import fetch from "node-fetch";

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_API_URL = process.env.MINIMAX_API_URL || "https://api.minimax.io/v1/text/chatcompletion_v2";

if (!MINIMAX_API_KEY) {
  throw new Error("MINIMAX_API_KEY missing from environment");
}

// Utility function to clean MiniMax responses
function cleanMiniMaxResponse(response: string): string {
  // Remove ```json``` code fences
  let cleaned = response
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .replace(/^[^\[\{]*/, '') // Drop everything before the first [ or {
    .replace(/[^\]\}]*$/, '') // Drop everything after the last ] or }
    .trim();

  // If the reply looks truncated, try to close the array
  if (cleaned.endsWith(',') || (!cleaned.endsWith(']') && !cleaned.endsWith('}') && cleaned.includes('['))) {
    cleaned = cleaned.replace(/,$/, '') + ']';
  }
  
  return cleaned;
}

export async function splitSnapTasks(requirement: string): Promise<string[]> {
  console.log(`[DEBUG] Splitting requirement: ${requirement}`);

  const prompt =
    `You are SnapCloud AI. Split the following user requirement into technical tasks ` +
    `to design the AWS architecture. ` +
    `Respond only with a JSON array of strings.\n\n` +
    `Requirement:\n${requirement}`;

  try {
    const raw = await callMiniMax(prompt);
    const cleaned = cleanMiniMaxResponse(raw);
    const tasks = JSON.parse(cleaned);
    if (Array.isArray(tasks)) {
      return tasks.map((t) => String(t));
    }
    console.warn('[splitSnapTasks] MiniMax response was not an array:', tasks);
  } catch (err) {
    console.error('[splitSnapTasks] Falling back to single task list:', err);
  }

  return [requirement];
}

export async function generateArchitecture(tasks: string[]): Promise<{
  diagramMermaid: string;
  cfnTemplate: string;
  costEstimation: {
    json: any;
    table: string;
  }
}> {
  console.log(`[DEBUG] Generating architecture for ${tasks.length} tasks`);

  const bulletTasks = tasks.map((t, i) => `${i + 1}. ${t}`).join('\n');
  const prompt =
    `You are SnapCloud AI. Based on the following tasks:\n${bulletTasks}` +
    `

Provide exactly four markdown code blocks in this order:\n` +
    `1. \`\`\`mermaid\n<diagram>\n\`\`\`\n` +
    `2. \`\`\`yaml\n<CloudFormation>\n\`\`\`\n` +
    `3. \`\`\`json\n<cost estimation json>\n\`\`\`\n` +
    `4. \`\`\`markdown\n<cost table>\n\`\`\``;

  const raw = await callMiniMax(prompt);

  const mermaidMatch = raw.match(/```mermaid[\s\S]*?```/i);
  const yamlMatch = raw.match(/```yaml[\s\S]*?```/i);
  const jsonMatch = raw.match(/```json[\s\S]*?```/i);
  const tableMatch = raw.match(/```(?:markdown|md)[\s\S]*?```/i);

  const cleanBlock = (block?: string) =>
    block ? block.replace(/```(mermaid|yaml|json|markdown|md)?/gi, '').trim() : '';

  let costJson: any = {};
  try {
    costJson = JSON.parse(cleanMiniMaxResponse(jsonMatch ? jsonMatch[0] : '{}'));
  } catch (err) {
    console.error('[generateArchitecture] Failed to parse cost JSON:', err);
  }

  return {
    diagramMermaid: cleanBlock(mermaidMatch?.[0]),
    cfnTemplate: cleanBlock(yamlMatch?.[0]),
    costEstimation: {
      json: costJson,
      table: cleanBlock(tableMatch?.[0]),
    },
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
  // The generated text is in data.choices[0].message.content
  return data.choices?.[0]?.message?.content || data.result || data;
}

// CLI self-test
if (import.meta.url === `file://${process.argv[1]}` && process.argv.length > 2) {
  (async () => {
    const requirement = process.argv.slice(2).join(" ");
    const tasks = await splitSnapTasks(requirement);
    console.log("Tasks:", tasks);
    const archi = await generateArchitecture(tasks);
    console.log("Diagram:\n", archi.diagramMermaid);
    console.log("CFN:\n", archi.cfnTemplate);
  })();
}
