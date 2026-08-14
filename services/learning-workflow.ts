import type { PatternCard, TrainingExercise } from "../types/learning";

export interface LearningBuildDecision { allowed: boolean; reasons: string[]; nextStatus: TrainingExercise["workflowStatus"] }

export function evaluateLearningBuild(exercise: TrainingExercise, cards: PatternCard[]): LearningBuildDecision {
  const reasons: string[] = [];
  const sources = exercise.sourcePatternCardIds.map((id) => cards.find((card) => card.id === id));
  if (sources.some((card) => !card)) reasons.push("Every source Pattern Card must be available.");
  if (sources.some((card) => card && !["OFFICIAL_SNAP", "LOCAL_OFFICIAL_RESOURCE"].includes(card.source))) reasons.push("Every source must be an eligible official resource.");
  if (exercise.originalityStatus !== "ORIGINAL") reasons.push("The originality guard must return ORIGINAL.");
  if (!exercise.humanConfirmed) reasons.push("A person must confirm the exercise before build.");
  if (!exercise.buildSpecification.categories.length || exercise.buildSpecification.concept.includes("required before build")) reasons.push("Complete the original Lens Build Specification before build.");
  return { allowed: reasons.length === 0, reasons, nextStatus: reasons.length ? "AWAITING_CONFIRMATION" : "BUILDING" };
}

export const learningWorkflow = [
  "Inspect official resource",
  "Classify evidence",
  "Create Pattern Card",
  "Design original exercise",
  "Run originality guard",
  "Confirm build specification",
  "Build and compile",
  "Capture preview",
  "Run Visual QA",
  "Run Experience QA",
  "Complete human review",
  "Save Learning Record",
] as const;
