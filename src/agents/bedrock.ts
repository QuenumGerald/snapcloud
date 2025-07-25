import pkg from "@aws-sdk/client-bedrock-runtime";
const { BedrockRuntimeClient, InvokeModelCommand } = pkg;
type InvokeModelCommandInput = ConstructorParameters<typeof InvokeModelCommand>[0];

/**
 * Minimal Bedrock wrapper for SnapCloud
 * --------------------------------------
 * Provides a single helper `invokeModel` that sends a prompt to a Bedrock model
 * (Titan, Claude, etc.) and returns the raw JSON response.
 *
 * Environment variables required:
 *   AWS_REGION            – e.g. "us-east-1"
 *   AWS_ACCESS_KEY_ID     – your AWS credentials
 *   AWS_SECRET_ACCESS_KEY – your AWS credentials
 *   BEDROCK_MODEL_ID      – model ID, e.g. "anthropic.claude-3-sonnet-20240229-v1:0"
 */
export class SnapcloudBedrock {
  private readonly client;
  private readonly modelId: string;

  constructor(region = process.env.AWS_REGION ?? "us-east-1") {
    this.client = new BedrockRuntimeClient({ region });
    this.modelId = process.env.BEDROCK_MODEL_ID ?? "amazon.titan-text-lite-v1";
  }

  /**
   * Invoke the Bedrock model with a simple text prompt.
   * The wrapper expects and returns JSON (Bedrock format).
   */
  public async invokeModel(prompt: string): Promise<any> {
    const payload = {
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 2048,
      temperature: 0.2,
    };

    const input: InvokeModelCommandInput = {
      body: Buffer.from(JSON.stringify(payload)),
      contentType: "application/json",
      accept: "application/json",
      modelId: this.modelId,
    };

    const command = new InvokeModelCommand(input);
    const response = await this.client.send(command);

    if (!response.body) {
      throw new Error("Bedrock response body is empty");
    }

    // Bedrock returns a Uint8ArrayBlobAdapter. Use its helper to get a string.
    const text = await response.body.transformToString("utf-8");
    return JSON.parse(text);
  }

  /**
   * High-level helper that crafts a prompt to Bedrock asking for both:
   *   1. An AWS architecture diagram in Mermaid format
   *   2. A CloudFormation template (YAML)
   * It then parses the model response and returns the two artefacts.
   */
  public async generateBlueprint(requirement: string): Promise<{
    diagramMermaid: string;
    cfnTemplate: string;
  }> {
    const prompt = `You are SnapCloud AI. Given the following client requirement, produce two outputs **only** in separate markdown code blocks in the given order:\n\n` +
      `1. \`\`\`mermaid\n<diagram>\n\`\`\`\n` +
      `2. \`\`\`yaml\n<cloudformation>\n\`\`\`\n\n` +
      `Client requirement:\n${requirement}`;

    const response = await this.invokeModel(prompt);

    // Extract content depending on the model provider shape; handle generic case.
    const content: string = (response?.choices?.[0]?.message?.content ??
      response?.outputs?.[0]?.text ??
      JSON.stringify(response));

    const mermaidMatch = content.match(/```mermaid[\s\S]*?```/i);
    const yamlMatch = content.match(/```yaml[\s\S]*?```/i);

    const cleanBlock = (block?: string) =>
      block ? block.replace(/```(mermaid|yaml)?/gi, "").trim() : "";

    return {
      diagramMermaid: cleanBlock(mermaidMatch?.[0]),
      cfnTemplate: cleanBlock(yamlMatch?.[0]),
    };
  }
}

// Quick self-test when executed directly (ESM-compatible)
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      const prompt = process.argv.slice(2).join(" ") || "Describe Amazon Bedrock in 2 sentences.";
      const bedrock = new SnapcloudBedrock();
      const result = await bedrock.invokeModel(prompt);
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  })();
}

