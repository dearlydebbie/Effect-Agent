import { OpenAIVisionProvider, type OpenAIVisionClient } from "../agents/openai-vision-provider";
import type { VisionProvider } from "../agents/providers";
import { MockVisionProvider, UnavailableVisionProvider } from "../agents/visual-qa";
import type { VisualQACache } from "./visual-qa-cache";
import { runtimePolicy } from "../config/runtime";

export interface VisionEnvironment { VISION_QA_ENABLED?: string; EFFECT_LAB_VISION_PROVIDER?: string; OPENAI_API_KEY?: string; OPENAI_VISION_MODEL?: string; EFFECT_LAB_MODE?: string; ENABLE_DEMO_DATA?: string }
export interface VisionSelectionDependencies { client?: OpenAIVisionClient; cache?: VisualQACache; sleep?: (milliseconds: number) => Promise<void> }

export function selectVisionProvider(environment: VisionEnvironment, dependencies: VisionSelectionDependencies = {}): VisionProvider {
  const model = environment.OPENAI_VISION_MODEL || "gpt-5.6-terra";
  if (environment.VISION_QA_ENABLED !== "true") return new UnavailableVisionProvider("Visual QA is disabled. Set VISION_QA_ENABLED=true to enable it.", model);
  if (environment.EFFECT_LAB_VISION_PROVIDER === "mock") {
    const policy = runtimePolicy(environment as Record<string, string | undefined>);
    if (!policy.demoDataEnabled && policy.mode !== "test") return new UnavailableVisionProvider("Mock visual QA is not available in production.", model);
    return new MockVisionProvider();
  }
  if (!environment.OPENAI_API_KEY) return new UnavailableVisionProvider("Visual QA is unavailable because OPENAI_API_KEY is not configured.", model);
  return new OpenAIVisionProvider({ apiKey: environment.OPENAI_API_KEY, model, client: dependencies.client, cache: dependencies.cache, sleep: dependencies.sleep });
}
