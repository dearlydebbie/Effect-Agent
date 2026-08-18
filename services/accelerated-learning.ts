import { acceleratedLearningConfig } from "../config/accelerated-learning";
import type { CapabilityReuseStatus, LearningVelocityRecord, LearningVelocitySummary, ReinspectionContext } from "../types/accelerated-learning";

export function mayBypassDeepInspection(status: CapabilityReuseStatus) {
  return status === "VERIFIED_REUSABLE";
}

export function requiresReinspection(status: CapabilityReuseStatus, context: ReinspectionContext) {
  return !mayBypassDeepInspection(status) || Object.values(context).some(Boolean);
}

export function requiresHumanConfirmation(input: { status: CapabilityReuseStatus; destructive: boolean; materialCreativeChange: boolean; approvedSpecification: boolean }) {
  if (!input.approvedSpecification) return true;
  return input.status === "UNKNOWN" || input.destructive || input.materialCreativeChange;
}

export function curriculumBatchLimit(exercise: number, allOperationsReusable: boolean, safetyHistoryJustifiesBatching: boolean) {
  if (exercise < 2 || exercise > 100) throw new Error("Exercise number must be between 2 and 100.");
  if (exercise <= 10) return 1;
  if (!allOperationsReusable) return 1;
  if (exercise <= 25) return 3;
  if (exercise <= 50) return 5;
  return safetyHistoryJustifiesBatching ? 10 : 1;
}

export function automaticRepairDecision(input: { attemptsUsed: number; repairStatus: CapabilityReuseStatus; destructive: boolean }) {
  if (input.attemptsUsed >= acceleratedLearningConfig.maxAutomaticRepairs) return { allowed: false, reason: "The two-repair limit is reached." };
  if (input.repairStatus !== "VERIFIED_REUSABLE") return { allowed: false, reason: "The repair is not VERIFIED_REUSABLE." };
  if (input.destructive) return { allowed: false, reason: "A destructive repair requires human confirmation." };
  return { allowed: true, reason: "A bounded reusable repair can run." };
}

export function learningVelocitySummary(records: LearningVelocityRecord[], verifiedReusableCapabilities: number): LearningVelocitySummary {
  const completed = records.filter((record) => record.finalResult === "APPROVED");
  const buildTimes = completed.map((record) => sumIfComplete(record.planningDurationMinutes, record.constructionDurationMinutes, record.qaDurationMinutes)).filter((value): value is number => value !== null);
  const confirmations = completed.map((record) => record.humanConfirmations).filter((value): value is number => value !== null);
  return {
    completed: completed.length,
    target: 100,
    averageBuildTimeMinutes: average(buildTimes),
    averageHumanConfirmations: average(confirmations),
    firstPassSuccessRate: completed.length ? completed.filter((record) => record.firstPassSucceeded).length / completed.length : null,
    averageIterations: completed.length ? average(completed.map((record) => record.iterations)) : null,
    verifiedReusableCapabilities,
    newKnowledgeGaps: records.reduce((total, record) => total + record.newKnowledgeGaps, 0),
  };
}

function sumIfComplete(...values: Array<number | null>) { return values.some((value) => value === null) ? null : (values as number[]).reduce((sum, value) => sum + value, 0); }
function average(values: number[]) { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null; }
