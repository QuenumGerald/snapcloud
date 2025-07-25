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

app.post("/generate-architecture", async (req, res) => {
  const { input, currentDiagram } = req.body;

  if (!input || typeof input !== "string") {
    return res.status(400).json({ error: "Invalid input" });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is not set");
    return res.status(500).json({ error: "API key not configured" });
  }

  const { OpenAI } = await import("openai");
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const systemPrompt = `You are an expert AWS Solutions Architect. Create comprehensive AWS architecture diagrams using Mermaid syntax, focusing exclusively on Amazon Web Services.

IMPORTANT: You must respond with a JSON object containing exactly these three fields:
- diagram: Complete Mermaid flowchart code using AWS services
- components: Array of AWS components with name, type, and description
- explanation: Detailed AWS architecture explanation with best practices

AWS Services to prioritize:
COMPUTE: EC2, Lambda, ECS, EKS, Fargate, Batch
STORAGE: S3, EBS, EFS, FSx
DATABASE: RDS, DynamoDB, ElastiCache, Redshift, DocumentDB
NETWORKING: VPC, CloudFront, Route 53, API Gateway, Load Balancer (ALB/NLB)
SECURITY: IAM, Cognito, WAF, Shield, KMS, Secrets Manager
MONITORING: CloudWatch, X-Ray, CloudTrail
MESSAGING: SQS, SNS, EventBridge, Kinesis
ANALYTICS: Athena, QuickSight, EMR, Glue
DEVOPS: CodePipeline, CodeBuild, CodeDeploy, CloudFormation

For Mermaid diagrams:
- Use flowchart TD (top-down) format
- Use AWS service names in quotes with clear labels
- Show data flow with labeled arrows
- Group related services using subgraphs for different layers (Frontend, Backend, Database, etc.)
- Use different node shapes:
  - [Rectangle] for compute services (EC2, Lambda)
  - [(Database)] for database services (RDS, DynamoDB)
  - (Rounded) for user-facing services (CloudFront, Route 53)
  - {Diamond} for decision points (API Gateway routing)
  - [[Subroutine]] for managed services (S3, SQS)

Example AWS Mermaid format:
flowchart TD
    A("Route 53") --> B("CloudFront")
    B --> C["Application Load Balancer"]
    C --> D["EC2 Auto Scaling Group"]
    D --> E[("RDS MySQL")]
    D --> F[["S3 Bucket"]]
    
    subgraph "AWS Region"
        subgraph "Public Subnet"
            C
        end
        subgraph "Private Subnet"
            D
            E
        end
    end

${currentDiagram ? `Current AWS diagram to modify:\n${currentDiagram}\n\nUser wants to modify this AWS architecture based on: ${input}` : `Create a new AWS architecture for: ${input}`}

Focus on AWS best practices:
- Use appropriate AWS services for each use case
- Consider security, scalability, and cost optimization
- Include proper VPC design with public/private subnets
- Suggest appropriate instance types and storage options
- Include monitoring and logging services

Respond with valid JSON only.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Create AWS architecture for: ${input}` }
      ],
      temperature: 0.7,
      max_tokens: 1800,
    });

    let aiText = completion.choices[0]?.message?.content?.trim() || "";

    // Remove markdown code blocks if present
    if (aiText.startsWith("```json")) {
      aiText = aiText.replace(/```json\n?/, "").replace(/\n?```$/, "");
    } else if (aiText.startsWith("```")) {
      aiText = aiText.replace(/```\n?/, "").replace(/\n?```$/, "");
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiText);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      console.error("Raw response:", aiText);
      return res.status(500).json({
        error: "Failed to parse AI response",
        details: "The AI response was not in the expected JSON format",
        rawResponse: aiText.substring(0, 500),
      });
    }

    if (!parsedResponse.diagram || !parsedResponse.components || !parsedResponse.explanation) {
      console.error("Invalid response structure:", parsedResponse);
      return res.status(500).json({
        error: "Invalid response structure",
        details: "Missing required fields in AI response",
      });
    }

    if (!Array.isArray(parsedResponse.components)) {
      parsedResponse.components = [];
    }

    return res.json({
      diagram: parsedResponse.diagram,
      components: parsedResponse.components,
      explanation: parsedResponse.explanation,
    });
  } catch (error) {
    console.error("Error generating architecture:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[API] SnapCloud backend listening on port ${PORT}`);
});
