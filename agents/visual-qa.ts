import type { VisionProvider } from "./providers";
import type { VisualQAInput, VisualQAReport, VisualQAScores, VisionProviderState } from "../types/creative-qa";

export const visualScoreKeys: Array<keyof VisualQAScores> = ["specificationMatch", "visualCoherence", "composition", "colour", "lighting", "readability", "polish", "categorySpecificQuality"];
export const unavailableScores: VisualQAScores = { specificationMatch: null, visualCoherence: null, composition: null, colour: null, lighting: null, readability: null, polish: null, categorySpecificQuality: null };
export const unavailableApplicability = Object.fromEntries(visualScoreKeys.map((key) => [key, "NOT_APPLICABLE"])) as VisualQAReport["applicability"];

export function unavailableVisualQA(message: string, previewAvailable: boolean, provider = "No vision provider", model: string | null = null): VisualQAReport {
  return { status: "UNAVAILABLE", provider, providerState: "UNAVAILABLE", model, mock: false, scores: unavailableScores, applicability: unavailableApplicability, strengths: [], findings: [], limitations: [message], confidence: null, overallScore: null, iterationRecommended: false, iterationPriority: "NONE", previewAvailable, cached: false, message };
}

export class UnavailableVisionProvider implements VisionProvider {
  readonly name: string;
  readonly state: VisionProviderState = "UNAVAILABLE";
  readonly model: string | null;
  readonly mock = false;
  constructor(private readonly reason = "Visual QA is unavailable. Configure a vision provider or complete human review.", model: string | null = null) { this.name = "No vision provider"; this.model = model; }
  async evaluate(input: VisualQAInput) { return unavailableVisualQA(this.reason, Boolean(input.previewDataUrl), this.name, this.model); }
}

export class MockVisionProvider implements VisionProvider {
  readonly name = "Mock visual provider";
  readonly state: VisionProviderState = "MOCK";
  readonly model = "mock";
  readonly mock = true;
  async evaluate(input: VisualQAInput): Promise<VisualQAReport> {
    return { status: "WARNING", provider: this.name, providerState: this.state, model: this.model, mock: true, scores: { specificationMatch: 7, visualCoherence: 7, composition: 7, colour: 7, lighting: 7, readability: 7, polish: 7, categorySpecificQuality: 7 }, applicability: Object.fromEntries(visualScoreKeys.map((key) => [key, "APPLICABLE"])) as VisualQAReport["applicability"], strengths: ["Mock result for interface development."], findings: [{ type: "CATEGORY", severity: "HIGH", description: "No real image analysis was performed.", evidence: "This provider is explicitly configured as mock.", recommendedChange: "Connect a real vision provider before making a visual decision." }], limitations: ["This is mock data."], confidence: 0, overallScore: 7, iterationRecommended: false, iterationPriority: "NONE", previewAvailable: Boolean(input.previewDataUrl), cached: false, message: "Mock result. Do not use it as a visual quality decision." };
  }
}

export class VisualQAAgent {
  constructor(private readonly provider: VisionProvider) {}
  getProviderInfo() { return { state: this.provider.state, name: this.provider.name, model: this.provider.model, label: this.provider.state === "REAL" ? `${this.provider.name} · ${this.provider.model}` : this.provider.name }; }
  evaluate(input: VisualQAInput, options?: { force?: boolean }) { return this.provider.evaluate(input, options); }
}
