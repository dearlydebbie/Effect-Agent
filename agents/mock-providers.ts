import { demoIdeas } from "../data/demo-ideas";
import { scoreIdea } from "../services/idea-scoring";
import { validateSTE } from "../services/ste-validator";
import type { AIProviders } from "./providers";

export const mockProviders: AIProviders = {
  research: { async discover(query) { return demoIdeas.filter((idea) => `${idea.title} ${idea.categories.join(" ")}`.toLowerCase().includes(query.toLowerCase())).slice(0, 6); } },
  ideas: { async generate(input) { const term = (input.category ?? input.platform ?? input.season ?? input.prompt ?? "").toLowerCase(); return demoIdeas.filter((idea) => !term || `${idea.platforms} ${idea.categories} ${idea.description}`.toLowerCase().includes(term)).slice(0, 4); } },
  critique: { async critique(idea) { return scoreIdea({ originality: idea.scores.originality, immediateComprehension: 8.2, visualAppeal: 8.6, shareability: idea.scores.shareability, replayValue: idea.scores.replay, interactionQuality: 7.8, platformFit: 8.4, technicalFeasibility: idea.buildComplexity === "Complex" ? 6.2 : 8.5, buildCost: idea.buildComplexity === "Simple" ? 9 : 7, monetisationPotential: 6.8 }); } },
  ste: { async validate(text) { return validateSTE(text); } },
  buildPlanning: { async plan(idea) { return { steps: ["Prepare assets", "Create project", "Add interaction", "Test build", "Run QA"], risks: idea.risks }; } },
  qa: { async check() { return []; } },
  performance: { async analyse() { return { findings: ["More data is required before the system can recommend a change."], confidence: "low" }; } },
};

