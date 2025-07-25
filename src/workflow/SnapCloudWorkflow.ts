import { proxyActivities } from "@temporalio/workflow";

/**
 * Activity type definitions (to be implemented separately).
 * For now we declare the shape only to let the workflow compile.
 */
interface Activities {
    /**
     * Découpe le besoin client en tâches atomiques.
     */
    splitSnapTasks(input: { requirement: string }): Promise<string[]>;

    /**
     * Génère le diagramme AWS (Mermaid) et le template CloudFormation.
     */
    generateArchitecture(tasks: string[]): Promise<{
        diagramMermaid: string;
        cfnTemplate: string;
    }>;

    /**
     * (Stub) Analyse de sécurité de l'architecture générée.
     */
    runSecurityAudit(artefacts: { cfnTemplate: string }): Promise<{ report: string }>;


    generateBlueprint(tasks: string[]): Promise<{
        diagramUrl: string;
        templateUrl: string;
    }>;
}

// Create typed activity stubs with a generous default timeout.
const {
    splitSnapTasks,
    generateArchitecture,
    runSecurityAudit,
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
    diagramMermaid: string;
    cfnTemplate: string;
    // report?: string;
}> {
    // 1. Découpage des tâches (MiniMax)
    const tasks = await splitSnapTasks({ requirement });

    // 2. Génération de l’architecture (MiniMax ou Bedrock)
    const { diagramMermaid, cfnTemplate } = await generateArchitecture(tasks);

    // 3. (Optionnel) Audit sécurité (stub)
    // const { report } = await runSecurityAudit({ cfnTemplate });

    return {
        diagramMermaid,
        cfnTemplate,
        // report,
    };
}

// Re-export workflow type for the Temporal client
export type SnapCloudWorkflowResult = ReturnType<typeof SnapCloudWorkflow>;
