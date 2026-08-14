import type { AIProviders } from "./providers";

export class ProviderUnavailableError extends Error {
  constructor(capability: string) { super(`${capability} is unavailable. Connect a real provider.`); this.name = "ProviderUnavailableError"; }
}

export const unavailableProviders: AIProviders = {
  research: { async discover() { throw new ProviderUnavailableError("Research"); } },
  ideas: { async generate() { throw new ProviderUnavailableError("Idea generation"); } },
  critique: { async critique() { throw new ProviderUnavailableError("Critique"); } },
  ste: { async validate() { throw new ProviderUnavailableError("AI STE validation"); } },
  buildPlanning: { async plan() { throw new ProviderUnavailableError("Build planning"); } },
  qa: { async check() { throw new ProviderUnavailableError("AI QA"); } },
  performance: { async analyse() { throw new ProviderUnavailableError("Performance analysis"); } },
};

