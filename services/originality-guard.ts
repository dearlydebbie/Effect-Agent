import { learningConfig } from "../config/learning";
import type { Idea } from "../types/domain";
import type { OfficialLearningResource, OriginalityAssessment, OriginalityCorpus, TrainingExercise } from "../types/learning";

function tokens(value: string) { return new Set(value.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((token) => token.length > 2)); }
function similarity(left: string, right: string) {
  const a = tokens(left); const b = tokens(right);
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  return intersection / (a.size + b.size - intersection);
}
function resourceText(resource: OfficialLearningResource) { return `${resource.name} ${resource.description ?? ""}`; }
function exerciseText(exercise: TrainingExercise) { return `${exercise.objective} ${exercise.creativeBrief} ${exercise.skill}`; }
function ideaText(idea: Idea) { return `${idea.title} ${idea.hook} ${idea.description} ${idea.interactionType}`; }

export class OriginalityGuard {
  assess(candidate: Pick<TrainingExercise, "id" | "objective" | "creativeBrief" | "skill">, corpus: OriginalityCorpus): OriginalityAssessment {
    const text = exerciseText(candidate as TrainingExercise);
    const comparisons = [
      ...corpus.officialResources.map((item) => ({ id: item.id, score: similarity(text, resourceText(item)) })),
      ...corpus.exercises.filter((item) => item.id !== candidate.id).map((item) => ({ id: item.id, score: similarity(text, exerciseText(item)) })),
      ...corpus.localIdeas.map((item) => ({ id: item.id, score: similarity(text, ideaText(item)) })),
    ].sort((a, b) => b.score - a.score);
    if (!comparisons.length) return { status: "UNKNOWN", highestSimilarity: null, closestRecordId: null, reasons: ["No comparison records are available."], comparedRecordCount: 0 };
    const highest = comparisons[0];
    const status = highest.score >= learningConfig.originality.tooSimilarAt ? "TOO_SIMILAR" : highest.score >= learningConfig.originality.reviseAt ? "REVISE" : "ORIGINAL";
    return { status, highestSimilarity: highest.score, closestRecordId: highest.id, reasons: [status === "ORIGINAL" ? "No close text match was found in the available local corpus." : status === "REVISE" ? "Revise the brief to increase its distance from the closest record." : "The brief is too close to an available record and cannot enter the build step."], comparedRecordCount: comparisons.length };
  }
}
