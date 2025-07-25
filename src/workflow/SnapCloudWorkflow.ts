import { proxyActivities } from "@temporalio/workflow";

/**
 * Activity type definitions (to be implemented separately).
 * For now we declare the shape only to let the workflow compile.
 */
interface Activities {
  /**
   * Split the client requirement into granular tasks.
   */
  planTasks(input: { requirement: string }): Promise<string[]>;

  /**
   * Generate an AWS architecture diagram URL and a CloudFormation template URL.
   */
  generateBlueprint(tasks: string[]): Promise<{
    diagramUrl: string;
    templateUrl: string;
  }>;
}

// Create typed activity stubs with a generous default timeout.
const {
  planTasks,
  generateBlueprint,
} = proxyActivities<Activities>({ startToCloseTimeout: "10 minutes" });

/**
 * SnapCloudWorkflow (stub)
 * --------------------------------------------
 * Orchestrates the end-to-end generation of an AWS blueprint from a plain-text
 * client need. The real business logic will land in the activities; this
 * workflow is a thin orchestration layer.
 *
 * Input  : client requirement string
 * Output : object containing URLs for the diagram and the CloudFormation template
 */
export async function SnapCloudWorkflow(requirement: string): Promise<{
  diagramUrl: string;
  templateUrl: string;
}> {
  // 1️⃣ Task planning via MiniMax wrapper
  const tasks = await planTasks({ requirement });

  // 2️⃣ Build diagram + template via Bedrock & agent wrappers
  const { diagramUrl, templateUrl } = await generateBlueprint(tasks);

  // 3️⃣ Return artefact links to caller (frontend / CLI)
  return { diagramUrl, templateUrl };
}

// Re-export workflow type for the Temporal client
export type SnapCloudWorkflowResult = ReturnType<typeof SnapCloudWorkflow>;
