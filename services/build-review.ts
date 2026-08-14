import type { KeyValueStorage } from "./persistence";
import type { AssessmentAgreement, AssessmentDecisionRecord, BuildHumanDecision, BuildReviewIdentity, BuildReviewState, GuardedBuildAction, HumanReviewResult, LearningQualityGates } from "../types/build-review";
import type { LearningRecord } from "../types/learning";

export interface BuildReviewRepository {
  load(buildId: string): BuildReviewState | null;
  save(state: BuildReviewState): void;
}

export class BrowserBuildReviewRepository implements BuildReviewRepository {
  constructor(private readonly storage: KeyValueStorage, private readonly key = "effect-lab-build-reviews-v2") {}
  private all(): BuildReviewState[] {
    try {
      const value = JSON.parse(this.storage.getItem(this.key) ?? "[]") as unknown;
      return Array.isArray(value) ? value as BuildReviewState[] : [];
    } catch { return []; }
  }
  load(buildId: string) { return this.all().find((entry) => entry.identity.buildId === buildId) ?? null; }
  save(state: BuildReviewState) {
    const values = this.all().filter((entry) => entry.identity.buildId !== state.identity.buildId);
    this.storage.setItem(this.key, JSON.stringify([...values, state]));
  }
}

export class MemoryBuildReviewRepository implements BuildReviewRepository {
  private readonly values = new Map<string, BuildReviewState>();
  load(buildId: string) { const value = this.values.get(buildId); return value ? structuredClone(value) : null; }
  save(state: BuildReviewState) { this.values.set(state.identity.buildId, structuredClone(state)); }
}

export class BuildReviewService {
  constructor(private readonly repository: BuildReviewRepository, private readonly now = () => new Date().toISOString()) {}

  load(identity: BuildReviewIdentity): BuildReviewState {
    const stored = this.repository.load(identity.buildId);
    if (!stored) return { identity, assessmentDecisions: [], humanReview: null };
    assertIdentity(identity, stored.identity);
    return stored;
  }

  saveAssessment(input: GuardedBuildAction & { assessmentId: string; expectedAssessmentId: string; agreement: AssessmentAgreement; note: string }) {
    this.guard(input);
    if (!input.assessmentId || input.assessmentId !== input.expectedAssessmentId) throw new Error("This assessment is stale. Reload the current build.");
    const state = this.load(input);
    const existing = state.assessmentDecisions.find((entry) => entry.assessmentId === input.assessmentId);
    const timestamp = this.now();
    const record: AssessmentDecisionRecord = {
      ...pickIdentity(input), assessmentId: input.assessmentId, agreement: input.agreement, note: input.note.trim(),
      createdAt: existing?.createdAt ?? timestamp, updatedAt: timestamp,
    };
    state.assessmentDecisions = [...state.assessmentDecisions.filter((entry) => entry.assessmentId !== input.assessmentId), record];
    this.repository.save(state);
    return record;
  }

  saveHumanReview(input: GuardedBuildAction & { decision: BuildHumanDecision; note: string; learningRecord: LearningRecord; gates: LearningQualityGates }): HumanReviewResult {
    this.guard(input);
    const note = input.note.trim();
    if (input.decision === "NEEDS_CHANGES" && !note) throw new Error("Describe the changes that you need.");
    const complete = input.decision === "APPROVED" && gatesAllowCompletion(input.gates);
    if (input.decision === "APPROVED" && !complete) throw new Error("The required quality gates do not allow approval.");
    const timestamp = this.now();
    const review = {
      ...pickIdentity(input), decision: input.decision, note, decidedAt: timestamp,
      approvedBuildStateFingerprint: input.decision === "APPROVED" ? input.buildStateFingerprint : null,
      humanGate: input.decision === "APPROVED" ? "PASS" : input.decision,
      learningBuildComplete: complete,
      publishCandidateEligible: complete && input.gates.unresolvedCriticalFindings.length === 0,
      published: false as const,
    };
    const learningRecord: LearningRecord = {
      ...input.learningRecord,
      humanReview: { decision: input.decision === "APPROVED" ? "APPROVED" : input.decision === "NEEDS_CHANGES" ? "CHANGES_REQUESTED" : "REJECTED", notes: note ? [note] : [] },
      completedAt: complete ? timestamp : null,
      finalOutcome: "TRAINING_ONLY",
    };
    const state = this.load(input); state.humanReview = review; this.repository.save(state);
    return { review, learningRecord };
  }

  confirmIteration(input: GuardedBuildAction & { iterationPlanId: string; expectedIterationPlanId: string; readyOperationCount: number }) {
    this.guard(input);
    if (input.iterationPlanId !== input.expectedIterationPlanId) throw new Error("This iteration plan is stale. Reload the current build.");
    if (input.readyOperationCount === 0) throw new Error("There are no confirmed changes to run.");
    return { confirmed: true as const, iterationPlanId: input.iterationPlanId };
  }

  private guard(input: GuardedBuildAction) {
    if (input.activeBuildId !== input.buildId) throw new Error("This build is stale. Reload the current build.");
    const stored = this.repository.load(input.buildId);
    if (stored) assertIdentity(input, stored.identity);
  }
}

export function gatesAllowCompletion(gates: LearningQualityGates) {
  return gates.technicalQA === "PASS" && gates.specificationQA === "PASS" && gates.visualQA === "PASS" && gates.unresolvedCriticalFindings.length === 0;
}

function assertIdentity(expected: BuildReviewIdentity, actual: BuildReviewIdentity) {
  if (expected.buildId !== actual.buildId || expected.lensId !== actual.lensId || expected.projectIdentityFingerprint !== actual.projectIdentityFingerprint || expected.buildStateFingerprint !== actual.buildStateFingerprint) {
    throw new Error("This build state is stale. Reload the current build.");
  }
}
function pickIdentity(value: BuildReviewIdentity): BuildReviewIdentity { return { buildId: value.buildId, lensId: value.lensId, projectIdentityFingerprint: value.projectIdentityFingerprint, buildStateFingerprint: value.buildStateFingerprint }; }
