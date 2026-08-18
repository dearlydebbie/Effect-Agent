import test from "node:test";
import assert from "node:assert/strict";
import { automaticRepairDecision, curriculumBatchLimit, learningVelocitySummary, mayBypassDeepInspection, requiresHumanConfirmation, requiresReinspection } from "../services/accelerated-learning.ts";
import { learningBuild001Velocity } from "../data/learning-build-001-postmortem.ts";

const unchanged = { lensStudioVersionChangedMaterially: false, mcpCapabilitiesChanged: false, operationFailed: false, structureDiffersFromEvidence: false, dependsOnUnknownProperty: false, humanRequestedReinspection: false };

test("only VERIFIED_REUSABLE knowledge bypasses deep inspection", () => {
  assert.equal(mayBypassDeepInspection("VERIFIED_REUSABLE"), true);
  for (const status of ["VERIFIED_CONTEXTUAL", "UNKNOWN", "UNSUPPORTED", "FAILED_PREVIOUSLY"] as const) assert.equal(mayBypassDeepInspection(status), false);
  assert.equal(requiresReinspection("VERIFIED_REUSABLE", unchanged), false);
  assert.equal(requiresReinspection("VERIFIED_REUSABLE", { ...unchanged, mcpCapabilitiesChanged: true }), true);
  assert.equal(requiresReinspection("VERIFIED_REUSABLE", { ...unchanged, humanRequestedReinspection: true }), true);
});

test("confirmation policy removes routine prompts without weakening safety gates", () => {
  assert.equal(requiresHumanConfirmation({ status: "VERIFIED_REUSABLE", destructive: false, materialCreativeChange: false, approvedSpecification: true }), false);
  assert.equal(requiresHumanConfirmation({ status: "UNKNOWN", destructive: false, materialCreativeChange: false, approvedSpecification: true }), true);
  assert.equal(requiresHumanConfirmation({ status: "VERIFIED_REUSABLE", destructive: true, materialCreativeChange: false, approvedSpecification: true }), true);
  assert.equal(requiresHumanConfirmation({ status: "VERIFIED_REUSABLE", destructive: false, materialCreativeChange: true, approvedSpecification: true }), true);
});

test("curriculum batching follows the progressive limits", () => {
  assert.equal(curriculumBatchLimit(2, true, true), 1);
  assert.equal(curriculumBatchLimit(11, true, true), 3);
  assert.equal(curriculumBatchLimit(26, true, true), 5);
  assert.equal(curriculumBatchLimit(51, true, false), 1);
  assert.equal(curriculumBatchLimit(51, true, true), 10);
  assert.equal(curriculumBatchLimit(26, false, true), 1);
});

test("automatic repair is bounded and reusable only", () => {
  assert.equal(automaticRepairDecision({ attemptsUsed: 1, repairStatus: "VERIFIED_REUSABLE", destructive: false }).allowed, true);
  assert.equal(automaticRepairDecision({ attemptsUsed: 2, repairStatus: "VERIFIED_REUSABLE", destructive: false }).allowed, false);
  assert.equal(automaticRepairDecision({ attemptsUsed: 0, repairStatus: "UNKNOWN", destructive: false }).allowed, false);
});

test("velocity does not fabricate unrecorded Build 001 timings", () => {
  const summary = learningVelocitySummary([learningBuild001Velocity], 4);
  assert.equal(summary.completed, 1);
  assert.equal(summary.averageBuildTimeMinutes, null);
  assert.equal(summary.averageHumanConfirmations, null);
  assert.equal(summary.firstPassSuccessRate, 0);
  assert.equal(summary.averageIterations, 2);
});
