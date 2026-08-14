import test from "node:test";
import assert from "node:assert/strict";
import { BuildReviewService, MemoryBuildReviewRepository } from "../services/build-review.ts";
import { naturalBeautyReviewIdentity, naturalBeautyAssessmentIds } from "../config/builds.ts";
import { naturalBeautyIteration1 } from "../data/natural-beauty-build-001.ts";
import { createLearningCurriculum, learningDashboardSummary } from "../services/curriculum-service.ts";
import { naturalBeautyLearningPlan } from "../data/natural-beauty-learning.ts";

const gates = { technicalQA: "PASS", specificationQA: "PASS", visualQA: "PASS", unresolvedCriticalFindings: [] } as const;
const action = { ...naturalBeautyReviewIdentity, activeBuildId: naturalBeautyReviewIdentity.buildId };

test("Soft Flash state cannot leak into Natural Beauty", () => {
  const repository = new MemoryBuildReviewRepository();
  repository.save({ identity: { buildId: "build-lens-soft-flash-test-v1", lensId: "Soft Flash Test", projectIdentityFingerprint: "soft-project", buildStateFingerprint: "soft-state" }, assessmentDecisions: [], humanReview: null });
  const state = new BuildReviewService(repository).load(naturalBeautyReviewIdentity);
  assert.equal(state.identity.buildId, naturalBeautyReviewIdentity.buildId); assert.equal(state.assessmentDecisions.length, 0);
});

test("Natural Beauty state cannot leak into Soft Flash", () => {
  const repository = new MemoryBuildReviewRepository();
  new BuildReviewService(repository).saveAssessment({ ...action, assessmentId: naturalBeautyAssessmentIds.iteration1, expectedAssessmentId: naturalBeautyAssessmentIds.iteration1, agreement: "AGREE", note: "Correct." });
  assert.equal(repository.load("build-lens-soft-flash-test-v1"), null);
});

test("agree and disagree persist by assessment with an optional note", () => {
  const repository = new MemoryBuildReviewRepository(); const service = new BuildReviewService(repository, () => "2026-08-14T16:00:00.000Z");
  service.saveAssessment({ ...action, assessmentId: naturalBeautyAssessmentIds.openEyes, expectedAssessmentId: naturalBeautyAssessmentIds.openEyes, agreement: "AGREE", note: "Looks natural." });
  service.saveAssessment({ ...action, assessmentId: naturalBeautyAssessmentIds.visibleTeeth, expectedAssessmentId: naturalBeautyAssessmentIds.visibleTeeth, agreement: "DISAGREE", note: "Review this." });
  const decisions = service.load(naturalBeautyReviewIdentity).assessmentDecisions;
  assert.deepEqual(decisions.map((entry) => [entry.assessmentId, entry.agreement, entry.note]), [[naturalBeautyAssessmentIds.openEyes, "AGREE", "Looks natural."], [naturalBeautyAssessmentIds.visibleTeeth, "DISAGREE", "Review this."]]);
});

test("duplicate assessment submission updates one scoped record", () => {
  const service = new BuildReviewService(new MemoryBuildReviewRepository());
  service.saveAssessment({ ...action, assessmentId: naturalBeautyAssessmentIds.iteration1, expectedAssessmentId: naturalBeautyAssessmentIds.iteration1, agreement: "AGREE", note: "First." });
  service.saveAssessment({ ...action, assessmentId: naturalBeautyAssessmentIds.iteration1, expectedAssessmentId: naturalBeautyAssessmentIds.iteration1, agreement: "DISAGREE", note: "Changed." });
  const decisions = service.load(naturalBeautyReviewIdentity).assessmentDecisions;
  assert.equal(decisions.length, 1); assert.equal(decisions[0].agreement, "DISAGREE");
});

test("zero READY operations are rejected by the service", () => {
  const service = new BuildReviewService(new MemoryBuildReviewRepository());
  assert.throws(() => service.confirmIteration({ ...action, iterationPlanId: "plan-2", expectedIterationPlanId: "plan-2", readyOperationCount: 0 }), /no confirmed changes/i);
});

test("stale build, assessment, and fingerprint actions are rejected", () => {
  const service = new BuildReviewService(new MemoryBuildReviewRepository());
  assert.throws(() => service.saveAssessment({ ...action, activeBuildId: "build-lens-soft-flash-test-v1", assessmentId: naturalBeautyAssessmentIds.iteration1, expectedAssessmentId: naturalBeautyAssessmentIds.iteration1, agreement: "AGREE", note: "" }), /stale/i);
  assert.throws(() => service.saveAssessment({ ...action, assessmentId: "old-assessment", expectedAssessmentId: naturalBeautyAssessmentIds.iteration1, agreement: "AGREE", note: "" }), /assessment is stale/i);
  service.saveAssessment({ ...action, assessmentId: naturalBeautyAssessmentIds.iteration1, expectedAssessmentId: naturalBeautyAssessmentIds.iteration1, agreement: "AGREE", note: "" });
  assert.throws(() => service.saveHumanReview({ ...action, buildStateFingerprint: "old-fingerprint", decision: "APPROVED", note: "", learningRecord: naturalBeautyIteration1.learningRecord, gates }), /build state is stale/i);
});

test("approve persists the fingerprint, completes learning, and never publishes", () => {
  const service = new BuildReviewService(new MemoryBuildReviewRepository(), () => "2026-08-14T16:10:00.000Z");
  const result = service.saveHumanReview({ ...action, decision: "APPROVED", note: "Approved for training.", learningRecord: naturalBeautyIteration1.learningRecord, gates });
  assert.equal(result.review.approvedBuildStateFingerprint, naturalBeautyReviewIdentity.buildStateFingerprint); assert.equal(result.review.humanGate, "PASS"); assert.equal(result.learningRecord.completedAt, "2026-08-14T16:10:00.000Z"); assert.equal(result.review.published, false); assert.equal(result.learningRecord.finalOutcome, "TRAINING_ONLY");
});

test("needs changes and reject persist without deleting evidence or completing", () => {
  const service = new BuildReviewService(new MemoryBuildReviewRepository());
  assert.throws(() => service.saveHumanReview({ ...action, decision: "NEEDS_CHANGES", note: "", learningRecord: naturalBeautyIteration1.learningRecord, gates }), /Describe the changes/);
  const changes = service.saveHumanReview({ ...action, decision: "NEEDS_CHANGES", note: "Check movement.", learningRecord: naturalBeautyIteration1.learningRecord, gates });
  assert.equal(changes.learningRecord.humanReview.decision, "CHANGES_REQUESTED"); assert.equal(changes.learningRecord.completedAt, null); assert.equal(changes.learningRecord.observedOutcomes?.length, naturalBeautyIteration1.learningRecord.observedOutcomes?.length);
  const rejected = service.saveHumanReview({ ...action, decision: "REJECTED", note: "Do not use this result.", learningRecord: naturalBeautyIteration1.learningRecord, gates });
  assert.equal(rejected.learningRecord.humanReview.decision, "REJECTED"); assert.equal(rejected.review.published, false);
});

test("learning completion changes curriculum progress from zero to one", () => {
  const service = new BuildReviewService(new MemoryBuildReviewRepository(), () => "2026-08-14T16:20:00.000Z");
  const beforeCorpus = { patternCards: [], knowledge: [], exercises: [naturalBeautyLearningPlan.exercise], records: [naturalBeautyIteration1.learningRecord] };
  assert.equal(learningDashboardSummary(createLearningCurriculum(), beforeCorpus).completed, 0);
  const approved = service.saveHumanReview({ ...action, decision: "APPROVED", note: "", learningRecord: naturalBeautyIteration1.learningRecord, gates });
  const after = learningDashboardSummary(createLearningCurriculum(), { ...beforeCorpus, records: [approved.learningRecord] });
  assert.equal(after.completed, 1); assert.equal(after.categoryProgress.find((entry) => entry.category === "Beauty")?.completed, 1);
});

test("failed quality gates cannot be made complete by approval", () => {
  const service = new BuildReviewService(new MemoryBuildReviewRepository());
  assert.throws(() => service.saveHumanReview({ ...action, decision: "APPROVED", note: "", learningRecord: naturalBeautyIteration1.learningRecord, gates: { ...gates, visualQA: "FAIL" } }), /quality gates/i);
});
