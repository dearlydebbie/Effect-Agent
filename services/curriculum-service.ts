import { learningConfig } from "../config/learning";
import type { CurriculumSlot, LearningCorpus, LearningDashboardSummary } from "../types/learning";

export function createLearningCurriculum(): CurriculumSlot[] {
  let sequence = 0;
  return Object.entries(learningConfig.categoryTargets).flatMap(([category, target]) =>
    Array.from({ length: target }, () => {
      sequence += 1;
      return { id: `curriculum-${String(sequence).padStart(3, "0")}`, sequence, category: category as CurriculumSlot["category"], exerciseId: null, status: "UNASSIGNED" as const };
    }),
  );
}

export function learningDashboardSummary(curriculum: CurriculumSlot[], corpus: LearningCorpus): LearningDashboardSummary {
  const completedRecords = corpus.records.filter((record) => record.completedAt);
  const recordsByExercise = new Set(completedRecords.map((record) => record.exerciseId));
  const completedByCategory = new Map<string, number>();
  for (const record of completedRecords) {
    const exercise = corpus.exercises.find((entry) => entry.id === record.exerciseId);
    const category = exercise?.buildSpecification.categories[0];
    if (category) completedByCategory.set(category, (completedByCategory.get(category) ?? 0) + 1);
  }
  return {
    target: curriculum.length,
    completed: recordsByExercise.size,
    inspectedResources: corpus.patternCards.length,
    patternCards: corpus.patternCards.length,
    verifiedCapabilities: corpus.knowledge.filter((entry) => entry.status === "VERIFIED").length,
    publishCandidates: corpus.records.filter((record) => record.finalOutcome === "PUBLISH_CANDIDATE").length,
    categoryProgress: Object.entries(learningConfig.categoryTargets).map(([category, target]) => ({ category: category as CurriculumSlot["category"], completed: Math.min(target, completedByCategory.get(category) ?? 0), target })),
  };
}
