import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: Request) {
  try {
    const { input, currentDiagram } = await request.json()

    if (!input || typeof input !== "string") {
      return Response.json({ error: "Invalid input" }, { status: 400 })
    }

    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set")
      return Response.json({ error: "API key not configured" }, { status: 500 })
    }

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

Respond with valid JSON only.`

    const result = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: `Create AWS architecture for: ${input}

Consider these AWS-specific requirements:
- Use appropriate AWS services for the use case
- Include security best practices (IAM, VPC, security groups)
- Consider scalability with Auto Scaling, Load Balancers
- Include monitoring with CloudWatch
- Use managed services where appropriate (RDS vs self-managed databases)
- Consider cost optimization

Respond with a JSON object containing:
{
  "diagram": "mermaid flowchart code with AWS services",
  "components": [{"name": "AWS Service Name", "type": "compute|database|storage|networking|security|analytics|messaging", "description": "AWS service description and purpose"}],
  "explanation": "detailed AWS architecture explanation with best practices, security considerations, and cost implications"
}`,
    })

    console.log("AI Response:", result.text)

    // Try to parse the response as JSON
    let parsedResponse
    try {
      // Clean the response text to extract JSON
      let jsonText = result.text.trim()

      // Remove markdown code blocks if present
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/```json\n?/, "").replace(/\n?```$/, "")
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```\n?/, "").replace(/\n?```$/, "")
      }

      parsedResponse = JSON.parse(jsonText)
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError)
      console.error("Raw response:", result.text)

      // Fallback: try to extract components manually
      return Response.json(
        {
          error: "Failed to parse AI response",
          details: "The AI response was not in the expected JSON format",
          rawResponse: result.text.substring(0, 500), // First 500 chars for debugging
        },
        { status: 500 },
      )
    }

    // Validate the parsed response
    if (!parsedResponse.diagram || !parsedResponse.components || !parsedResponse.explanation) {
      console.error("Invalid response structure:", parsedResponse)
      return Response.json(
        {
          error: "Invalid response structure",
          details: "Missing required fields in AI response",
        },
        { status: 500 },
      )
    }

    // Ensure components is an array
    if (!Array.isArray(parsedResponse.components)) {
      parsedResponse.components = []
    }

    return Response.json({
      diagram: parsedResponse.diagram,
      components: parsedResponse.components,
      explanation: parsedResponse.explanation,
    })
  } catch (error) {
    console.error("Error generating architecture:", error)
    return Response.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
