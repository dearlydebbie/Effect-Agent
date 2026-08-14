import type { AIProviders } from "../agents/providers";
import { mockProviders } from "../agents/mock-providers";
import { unavailableProviders } from "../agents/unavailable-providers";
import { runtimePolicy } from "../config/runtime";

export function selectAIProviders(environment: Record<string, string | undefined>): { providers: AIProviders; state: "MOCK" | "UNAVAILABLE" } {
  const policy = runtimePolicy(environment);
  if (policy.demoDataEnabled || policy.mode === "test") return { providers: mockProviders, state: "MOCK" };
  return { providers: unavailableProviders, state: "UNAVAILABLE" };
}

