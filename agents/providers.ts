import type { CriticScore, Idea, PerformanceRecord, QACheck } from "../types/domain";
import type { STEReport } from "../services/ste-validator";
import type { VisualQAInput, VisualQAReport, VisionProviderState } from "../types/creative-qa";

export interface ResearchProvider { discover(query: string): Promise<Idea[]> }
export interface IdeaGenerationProvider { generate(input: { category?: string; trend?: string; phrase?: string; prompt?: string; season?: string; platform?: string; previousPerformance?: PerformanceRecord[] }): Promise<Idea[]> }
export interface CritiqueProvider { critique(idea: Idea): Promise<CriticScore> }
export interface STEProvider { validate(text: string): Promise<STEReport> }
export interface BuildPlanningProvider { plan(idea: Idea): Promise<{ steps: string[]; risks: string[] }> }
export interface QAProvider { check(idea: Idea): Promise<QACheck[]> }
export interface PerformanceAnalysisProvider { analyse(records: PerformanceRecord[]): Promise<{ findings: string[]; confidence: "low" | "medium" | "high" }> }
export interface TextReasoningProvider { reason(input: { task: string; context: Record<string, unknown> }): Promise<{ text: string; provider: string }> }
export interface VisionProvider { readonly name: string; readonly state: VisionProviderState; readonly model: string | null; readonly mock: boolean; evaluate(input: VisualQAInput, options?: { force?: boolean }): Promise<VisualQAReport> }
export interface ImageGenerationProvider { readonly name: string; generate(prompt: string): Promise<{ assetPath: string }> }

export interface AIProviders {
  research: ResearchProvider; ideas: IdeaGenerationProvider; critique: CritiqueProvider;
  ste: STEProvider; buildPlanning: BuildPlanningProvider; qa: QAProvider;
  performance: PerformanceAnalysisProvider;
  textReasoning?: TextReasoningProvider;
  vision?: VisionProvider;
  imageGeneration?: ImageGenerationProvider;
}
