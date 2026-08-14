import { learningConfig } from "../config/learning";
import type { LearningRecord } from "../types/learning";

export interface PublishGateInput {
  technicalQA: string;
  specificationQA: string;
  visualScore: number | null;
  humanDecision: LearningRecord["humanReview"]["decision"];
  criticalExperienceFailures: string[];
}

export function classifyLearningOutcome(input: PublishGateInput): { outcome: LearningRecord["finalOutcome"]; reasons: string[] } {
  const reasons: string[] = [];
  if (input.technicalQA !== learningConfig.publishCandidate.technicalQA) reasons.push("Technical QA must pass.");
  if (input.specificationQA !== learningConfig.publishCandidate.specificationQA) reasons.push("Specification QA must pass.");
  if (input.visualScore === null || input.visualScore < learningConfig.publishCandidate.minimumVisualScore) reasons.push(`Visual QA must score at least ${learningConfig.publishCandidate.minimumVisualScore}.`);
  if (input.humanDecision !== learningConfig.publishCandidate.humanDecision) reasons.push("Human review must approve the result.");
  if (!learningConfig.publishCandidate.allowCriticalExperienceFailures && input.criticalExperienceFailures.length) reasons.push("Critical experience failures must be resolved.");
  return { outcome: reasons.length ? "TRAINING_ONLY" : "PUBLISH_CANDIDATE", reasons };
}

export function unknownRewardSuitability() {
  return { topPerformerPotential: "UNKNOWN", lensPlusPotential: "UNKNOWN", reasons: ["Real programme evidence and performance data are not available."], evidenceAvailable: false, disclaimer: "This is not an eligibility or earnings claim." } as const;
}
