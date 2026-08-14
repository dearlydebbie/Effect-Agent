import { productConfig } from "../config/product";
import type { CriticScore } from "../types/domain";

export type ScoreInputs = Omit<CriticScore, "strengths" | "weaknesses" | "reasonsToReject" | "suggestedImprovements" | "overallScore" | "recommendation">;

export function scoreIdea(input: ScoreInputs, thresholds = productConfig.criticThresholds): CriticScore {
  const values = Object.values(input);
  const overallScore = Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1));
  const recommendation = overallScore < thresholds.rejectBelow ? "REJECT" : overallScore >= thresholds.buildAtOrAbove ? "BUILD" : "REVISE";
  const strengths = Object.entries(input).filter(([, score]) => score >= 8).map(([name]) => `${humanise(name)} is strong.`);
  const weaknesses = Object.entries(input).filter(([, score]) => score < 6).map(([name]) => `${humanise(name)} needs work.`);
  return {
    ...input, overallScore, recommendation,
    strengths: strengths.length ? strengths : ["The concept has a clear base."],
    weaknesses,
    reasonsToReject: recommendation === "REJECT" ? ["The potential score is below the current production threshold."] : [],
    suggestedImprovements: weaknesses.length ? ["Simplify the first action.", "Make the visual result more distinct."] : ["Test the first action with five people."],
  };
}

function humanise(value: string) { return value.replace(/([A-Z])/g, " $1").toLowerCase(); }

