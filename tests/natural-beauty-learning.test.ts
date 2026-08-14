import test from "node:test";
import assert from "node:assert/strict";
import { beautyFaceBatchKnowledge, beautyFaceBatchPatternCards } from "../data/beauty-face-batch.ts";
import { beautyPresetInspection } from "../data/beauty-preset-inspection.ts";
import { naturalBeautyLearningPlan } from "../data/natural-beauty-learning.ts";
import { naturalBeautyIteration0, naturalBeautyIteration1 } from "../data/natural-beauty-build-001.ts";
import { canCompleteNaturalBeautyExercise, createNaturalBeautyLearningPlan, naturalBeautyPublishGate, retrieveNaturalBeautyPatterns, separateLearningEvidence, validateNaturalBeautyPreflight } from "../services/natural-beauty-learning.ts";
import { naturalBeautyAutomatedQualityAssessment, naturalBeautyControlledPropertyDecisions, naturalBeautyOpenEyesQA, naturalBeautyVisibleTeethQA } from "../data/natural-beauty-controlled-evidence-qa.ts";

const allCards = [beautyPresetInspection.patternCard, ...beautyFaceBatchPatternCards];
const allKnowledge = [...beautyPresetInspection.knowledge, ...beautyFaceBatchKnowledge];

test("Pattern Cards are retrieved before Natural Beauty specification", () => {
  const plan = createNaturalBeautyLearningPlan(allCards, allKnowledge);
  assert.equal(plan.retrievalCompletedBeforeSpecification, true);
  assert.equal(plan.retrievedCards.length, 5);
  assert.deepEqual(plan.specification.retrievedPatternCardIds, plan.retrievedCards.map((card) => card.id));
  assert.throws(() => retrieveNaturalBeautyPatterns(allCards.slice(0, 4)), /requires these verified Pattern Cards/);
});

test("selected and rejected patterns have explicit reasons", () => {
  assert.deepEqual(naturalBeautyLearningPlan.specification.patternDecisions.map((entry) => [entry.presetName, entry.decision]), [["BeautyPreset", "USE"], ["FaceRetouchObjectPreset", "USE"], ["SmoothingPreset", "INSUFFICIENT_EVIDENCE"], ["FaceMeshObjectPreset", "DO_NOT_USE"], ["HeadBindingObjectPreset", "DO_NOT_USE"]]);
  assert.ok(naturalBeautyLearningPlan.specification.patternDecisions.every((entry) => entry.reason.length > 20));
});

test("RetouchVisual proposal is conservative and does not copy defaults", () => {
  const values = naturalBeautyLearningPlan.specification.proposedPropertyValues;
  assert.equal(values.find((entry) => entry.property === "faceIndex")?.relation, "EQUAL");
  assert.ok(values.filter((entry) => entry.property !== "faceIndex").every((entry) => entry.proposedValue < entry.officialPresetValue));
  assert.ok(values.every((entry) => entry.evidenceStatus === "PROPOSED_DESIGN_VALUE"));
});

test("SmoothingPreset is excluded because its required controls are unsupported", () => {
  const smoothing = naturalBeautyLearningPlan.specification.patternDecisions.find((entry) => entry.presetName === "SmoothingPreset");
  assert.equal(smoothing?.decision, "INSUFFICIENT_EVIDENCE");
  assert.match(smoothing?.reason ?? "", /undocumented ports/);
  assert.ok(!naturalBeautyLearningPlan.specification.proposedComponents.some((entry) => entry.sourcePattern === "SmoothingPreset"));
});

test("human confirmation is mandatory before execution", () => {
  const spec = naturalBeautyLearningPlan.specification;
  const base = { sandboxStatus: "VERIFIED" as const, lensName: "Effect Lab Sandbox", projectFolder: "/Users/debbie/Documents/Effect Lab Training Sandbox", connectionSource: "MANUAL_CONFIG" as const, liveMcpResponded: true, currentFingerprint: spec.sandboxRequirements.baselineFingerprint, unexpectedObjects: [] };
  assert.equal(validateNaturalBeautyPreflight(spec, { ...base, humanConfirmed: false }).allowed, false);
  assert.equal(validateNaturalBeautyPreflight(spec, { ...base, humanConfirmed: true }).allowed, true);
  assert.equal(spec.executionEnabled, false);
});

test("sandbox safety blocks the wrong project, connection, fingerprint, or objects", () => {
  const spec = naturalBeautyLearningPlan.specification;
  const result = validateNaturalBeautyPreflight(spec, { sandboxStatus: "MISMATCH", lensName: "Other", projectFolder: "/tmp/Other", connectionSource: "AUTO_DISCOVERY", liveMcpResponded: false, currentFingerprint: "different", unexpectedObjects: ["Unexpected"], humanConfirmed: true });
  assert.equal(result.allowed, false);
  assert.ok(result.reasons.length >= 6);
});

test("a draft Learning Record captures retrieval, selection, values, and pending QA", () => {
  const record = naturalBeautyLearningPlan.draftRecord;
  assert.equal(record.retrievedPatternCardIds?.length, 5);
  assert.equal(record.usedPatternCardIds.length, 2);
  assert.equal(record.rejectedPatternDecisions?.length, 3);
  assert.equal(record.initialPropertyValues?.length, 5);
  assert.equal(record.compileResult, "NOT_RUN");
  assert.equal(record.completedAt, null);
});

test("observed aesthetic outcomes remain separate from verified technical knowledge", () => {
  const feedback = separateLearningEvidence({ property: "softSkinIntensity", value: 0.25, aestheticObservation: "The preview retained visible texture.", previewScope: "Iteration 0 preview only." });
  assert.equal(feedback.technicalKnowledge[0].evidenceLevel, "PROPERTY_VERIFIED");
  assert.equal(feedback.observedAestheticEvidence[0].evidenceLevel, "OBSERVED_OUTCOME");
  assert.match(feedback.observedAestheticEvidence[0].scope, /Iteration 0/);
});

test("curriculum remains 0 of 100 until the complete QA and human gates pass", () => {
  const incomplete = canCompleteNaturalBeautyExercise({ technicalQA: "PASS", specificationQA: "PASS", previewCaptured: false, visualQA: "UNKNOWN", visualScore: null, criticalVisualFindings: [], humanDecision: "PENDING" });
  assert.equal(incomplete.curriculumCompleted, 0);
  const complete = canCompleteNaturalBeautyExercise({ technicalQA: "PASS", specificationQA: "PASS", previewCaptured: true, visualQA: "PASS", visualScore: 8.1, criticalVisualFindings: [], humanDecision: "APPROVED" });
  assert.equal(complete.curriculumCompleted, 1);
});

test("publish candidate gating cannot be bypassed by a completed technical build", () => {
  const blocked = naturalBeautyPublishGate({ technicalQA: "PASS", specificationQA: "PASS", previewCaptured: true, visualQA: "PASS", visualScore: 7.9, criticalVisualFindings: [], humanDecision: "APPROVED" });
  assert.equal(blocked.outcome, "TRAINING_ONLY");
  const ready = naturalBeautyPublishGate({ technicalQA: "PASS", specificationQA: "PASS", previewCaptured: true, visualQA: "PASS", visualScore: 8, criticalVisualFindings: [], humanDecision: "APPROVED" });
  assert.equal(ready.outcome, "PUBLISH_CANDIDATE");
});

test("Iteration 0 records real Vision failure without promoting aesthetic evidence", () => {
  assert.equal(naturalBeautyIteration0.visualQA.providerState, "REAL");
  assert.equal(naturalBeautyIteration0.visualQA.overallScore, 1.4);
  assert.equal(naturalBeautyIteration0.learningRecord.visualQA.status, "FAIL");
  assert.equal(naturalBeautyIteration0.learningRecord.finalOutcome, "TRAINING_ONLY");
  assert.equal(naturalBeautyIteration0.learningRecord.completedAt, null);
  assert.match(naturalBeautyIteration0.learningRecord.observedOutcomes?.[0].scope ?? "", /one face/i);
});

test("Iteration 1 records only the confirmed isolated property change", () => {
  assert.equal(naturalBeautyIteration1.executedChange.object, "Natural Beauty Grade");
  assert.equal(naturalBeautyIteration1.executedChange.component, "PostEffectVisual");
  assert.equal(naturalBeautyIteration1.executedChange.property, "enabled");
  assert.equal(naturalBeautyIteration1.executedChange.before, true);
  assert.equal(naturalBeautyIteration1.executedChange.after, false);
  assert.deepEqual(naturalBeautyIteration1.preservedPropertyValues, naturalBeautyIteration0.propertyValues);
  assert.equal(naturalBeautyIteration1.technicalQA, "PASS");
  assert.equal(naturalBeautyIteration1.isolationQA, "PASS");
  assert.equal(naturalBeautyIteration1.visualQA.providerState, "REAL");
  assert.equal(naturalBeautyIteration1.visualQA.status, "WARNING");
  assert.equal(naturalBeautyIteration1.visualQA.overallScore, 8.2);
  assert.equal(naturalBeautyIteration1.learningRecord.finalOutcome, "TRAINING_ONLY");
  assert.equal(naturalBeautyIteration1.learningRecord.completedAt, null);
});

test("controlled evidence closes eye and teeth gaps without inventing close-skin evidence", () => {
  assert.equal(naturalBeautyOpenEyesQA.status, "PASS");
  assert.equal(naturalBeautyVisibleTeethQA.status, "PASS");
  assert.equal(naturalBeautyOpenEyesQA.iterationRecommended, false);
  assert.equal(naturalBeautyVisibleTeethQA.iterationRecommended, false);
  assert.equal(naturalBeautyControlledPropertyDecisions.find((entry) => entry.property === "softSkinIntensity")?.decision, "INSUFFICIENT_EVIDENCE");
  assert.ok(naturalBeautyControlledPropertyDecisions.filter((entry) => entry.property !== "softSkinIntensity").every((entry) => entry.decision === "KEEP"));
});

test("automated quality stops iteration and waits for human review", () => {
  assert.deepEqual(naturalBeautyAutomatedQualityAssessment.unresolvedCriticalFindings, []);
  assert.deepEqual(naturalBeautyAutomatedQualityAssessment.iteration2ReadyOperations, []);
  assert.equal(naturalBeautyAutomatedQualityAssessment.automatedIterationRecommendation, "STOP");
  assert.equal(naturalBeautyAutomatedQualityAssessment.workflowStatus, "AWAITING_HUMAN_REVIEW");
  assert.equal(naturalBeautyIteration1.status, "AWAITING_HUMAN_REVIEW");
  assert.equal(naturalBeautyIteration1.learningRecord.humanReview.decision, "PENDING");
  assert.equal(naturalBeautyIteration1.learningRecord.finalOutcome, "TRAINING_ONLY");
  assert.ok(naturalBeautyIteration1.learningRecord.observedOutcomes?.some((entry) => entry.statement.includes("Open Eyes preview")));
  assert.ok(naturalBeautyIteration1.learningRecord.observedOutcomes?.some((entry) => entry.statement.includes("Visible Teeth preview")));
});

test("Iteration 1 plan isolates the colour grade and leaves uncertain controls unchanged", () => {
  const plan = naturalBeautyIteration0.iterationPlan;
  const ready = plan.changes.filter((change) => change.status === "READY");
  assert.equal(plan.executionEnabled, false);
  assert.equal(ready.length, 1);
  assert.equal(ready[0].targetPropertyOrParameter, "enabled");
  assert.equal(ready[0].currentValue, true);
  assert.match(ready[0].proposedValueOrOperation ?? "", /false/);
  assert.ok(plan.changes.find((change) => change.id === "unknown-lut-packing")?.status === "UNKNOWN");
  assert.ok(plan.preserve.some((value) => value.includes("softSkinIntensity = 0.25")));
});
