import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { VisionProvider } from "./providers";
import { unavailableVisualQA, visualScoreKeys } from "./visual-qa";
import type { VisualQAInput, VisualQAReport } from "../types/creative-qa";
import { MemoryVisualQACache, visualQACacheKey, type VisualQACache } from "../services/visual-qa-cache";

const score = z.number().min(0).max(10).nullable();
const applicability = z.enum(["APPLICABLE", "NOT_APPLICABLE"]);
export const openAIVisualQAResponseSchema = z.object({
  status: z.enum(["PASS", "WARNING", "FAIL"]),
  scores: z.object({ specificationMatch: score, visualCoherence: score, composition: score, colour: score, lighting: score, readability: score, polish: score, categorySpecificQuality: score }).strict(),
  applicability: z.object({ specificationMatch: applicability, visualCoherence: applicability, composition: applicability, colour: applicability, lighting: applicability, readability: applicability, polish: applicability, categorySpecificQuality: applicability }).strict(),
  overallScore: z.number().min(0).max(10), confidence: z.number().min(0).max(1),
  findings: z.array(z.object({ type: z.enum(["SPECIFICATION", "COMPOSITION", "COLOUR", "LIGHTING", "READABILITY", "POLISH", "CATEGORY", "ARTEFACT"]), severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]), description: z.string().min(1), evidence: z.string().min(1), recommendedChange: z.string().min(1) }).strict()),
  strengths: z.array(z.string()), limitations: z.array(z.string()), iterationRecommended: z.boolean(), iterationPriority: z.enum(["LOW", "MEDIUM", "HIGH", "NONE"]),
}).strict().superRefine((value, context) => {
  for (const key of visualScoreKeys) {
    if (value.applicability[key] === "NOT_APPLICABLE" && value.scores[key] !== null) context.addIssue({ code: "custom", path: ["scores", key], message: "A not-applicable score must be null." });
    if (value.applicability[key] === "APPLICABLE" && value.scores[key] === null) context.addIssue({ code: "custom", path: ["scores", key], message: "An applicable score must be a number." });
  }
});

export type OpenAIVisualQAOutput = z.infer<typeof openAIVisualQAResponseSchema>;
export interface OpenAIVisionClient { analyse(request: { model: string; systemPrompt: string; userPrompt: string; imageDataUrl: string }, timeoutMs: number): Promise<unknown> }

class OfficialOpenAIVisionClient implements OpenAIVisionClient {
  private readonly client: OpenAI;
  constructor(apiKey: string) { this.client = new OpenAI({ apiKey, maxRetries: 0 }); }
  async analyse(request: { model: string; systemPrompt: string; userPrompt: string; imageDataUrl: string }, timeoutMs: number) {
    const response = await this.client.responses.parse({
      model: request.model,
      input: [{ role: "system", content: request.systemPrompt }, { role: "user", content: [{ type: "input_text", text: request.userPrompt }, { type: "input_image", image_url: request.imageDataUrl, detail: "high" }] }],
      text: { format: zodTextFormat(openAIVisualQAResponseSchema, "visual_qa") },
    }, { timeout: timeoutMs });
    return response.output_parsed;
  }
}

export interface OpenAIVisionProviderOptions { apiKey: string; model?: string; timeoutMs?: number; maxRetries?: number; client?: OpenAIVisionClient; cache?: VisualQACache; sleep?: (milliseconds: number) => Promise<void> }

export class OpenAIVisionProvider implements VisionProvider {
  readonly name = "OpenAI";
  readonly state = "REAL" as const;
  readonly mock = false;
  readonly model: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly client: OpenAIVisionClient;
  private readonly cache: VisualQACache;
  private readonly sleep: (milliseconds: number) => Promise<void>;

  constructor(options: OpenAIVisionProviderOptions) {
    if (!options.apiKey) throw new Error("OPENAI_API_KEY is required.");
    this.model = options.model || "gpt-5.6-terra";
    this.timeoutMs = options.timeoutMs ?? 45000;
    this.maxRetries = Math.min(2, Math.max(0, options.maxRetries ?? 2));
    this.client = options.client ?? new OfficialOpenAIVisionClient(options.apiKey);
    this.cache = options.cache ?? new MemoryVisualQACache();
    this.sleep = options.sleep ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  }

  async evaluate(input: VisualQAInput, options: { force?: boolean } = {}): Promise<VisualQAReport> {
    if (!input.previewDataUrl?.startsWith("data:image/")) return unavailableVisualQA("Visual QA is unavailable because the actual Lens preview is missing.", false, this.name, this.model);
    const key = await visualQACacheKey({ previewDataUrl: input.previewDataUrl, creativeDirection: input.creativeDirection, specification: input.specification, model: this.model });
    if (!options.force) { const cached = this.cache.get(key); if (cached) return { ...cached, cached: true, message: `${cached.message} Cached result.` }; }
    const prompts = buildOpenAIVisualQAPrompts(input);
    let lastReason = "OpenAI visual analysis failed.";
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const raw = await this.client.analyse({ model: this.model, ...prompts, imageDataUrl: input.previewDataUrl }, this.timeoutMs);
        const parsed = openAIVisualQAResponseSchema.safeParse(raw);
        if (!parsed.success) { lastReason = "Visual QA is unavailable because the provider response was invalid."; if (attempt < this.maxRetries) continue; break; }
        const report: VisualQAReport = { ...parsed.data, provider: this.name, providerState: this.state, model: this.model, mock: false, previewAvailable: true, cached: false, message: "AI visual assessment completed. Human judgement remains authoritative." };
        this.cache.set(key, report); return report;
      } catch (error) {
        lastReason = providerErrorMessage(error);
        if (attempt < this.maxRetries && isRetryable(error)) { await this.sleep(100 * (attempt + 1)); continue; }
        break;
      }
    }
    return unavailableVisualQA(lastReason, true, this.name, this.model);
  }
}

export function buildOpenAIVisualQAPrompts(input: VisualQAInput) {
  const systemPrompt = `You are the Visual QA critic for an AR effect creation system. Assess only the actual preview image against the approved creative intent. Do not reward generic prettiness. Use the category-specific criteria in the supplied brief. Every negative finding must cite visible evidence from the preview. Do not speculate about shaders, code, assets, or implementation causes. Use null and NOT_APPLICABLE when a criterion cannot be judged. A static preview does not prove animation, interaction timing, reset behaviour, sound, or responsiveness. Confidence must reflect these limits. Human review is authoritative. Do not predict popularity or virality.`;
  const userPrompt = JSON.stringify({ task: "Evaluate this actual Lens Studio preview.", originalIdea: input.idea, categories: input.category, creativeDirection: input.creativeDirection, lensBuildSpecification: input.specification, intendedUserExperience: input.specification.userExperience, intendedInteraction: input.intendedInteraction, technicalInformation: input.technicalInformation, previousIterations: input.previousIterations ?? [] });
  return { systemPrompt, userPrompt };
}

function isRetryable(error: unknown) { const value = error as { status?: number; name?: string; code?: string }; return value?.status === 429 || (value?.status !== undefined && value.status >= 500) || value?.name === "AbortError" || value?.code === "ETIMEDOUT"; }
function providerErrorMessage(error: unknown) { const value = error as { status?: number; name?: string; code?: string }; if (value?.status === 429) return "Visual QA is unavailable because the provider rate limit was reached."; if (value?.name === "AbortError" || value?.code === "ETIMEDOUT") return "Visual QA is unavailable because the provider request timed out."; return "Visual QA is unavailable because the OpenAI request failed."; }
