import test from "node:test";
import assert from "node:assert/strict";
import { learningBuild001PostMortem, naturalBeautyCompletedRecord, naturalBeautyPublicationCandidate } from "../data/learning-build-001-postmortem.ts";

test("Build 001 post-mortem preserves demonstrated values and scope", () => {
  assert.equal(learningBuild001PostMortem.trainingStatus, "TRAINING_COMPLETE");
  assert.deepEqual(Object.fromEntries(learningBuild001PostMortem.editableProperties.map((entry) => [entry.property, entry.value])), { faceIndex: 0, softSkinIntensity: 0.25, teethWhiteningIntensity: 0.1, sharpenEyeIntensity: 0.2, eyeWhiteningIntensity: 0.08 });
  assert.ok(learningBuild001PostMortem.editableProperties.every((entry) => entry.status === "VERIFIED_CONTEXTUAL"));
  assert.ok(learningBuild001PostMortem.constructionOperations.some((entry) => entry.status === "FAILED_PREVIOUSLY" && entry.evidence === "The current Effect Lab LUT construction/encoding method is unverified and produced a failed result."));
  assert.ok(learningBuild001PostMortem.unresolvedKnowledgeGaps.includes("Generalisation across skin tones"));
});

test("training completion, candidacy, and publication are separate", () => {
  assert.equal(naturalBeautyCompletedRecord.completedAt, "2026-08-18");
  assert.equal(naturalBeautyCompletedRecord.humanReview.decision, "APPROVED");
  assert.equal(naturalBeautyPublicationCandidate.trainingStatus, "TRAINING_COMPLETE");
  assert.equal(naturalBeautyPublicationCandidate.publicationStatus, "PUBLISH_CANDIDATE");
  assert.equal(naturalBeautyPublicationCandidate.submissionReadiness, "METADATA_REQUIRED");
  assert.equal(naturalBeautyPublicationCandidate.published, false);
  assert.equal(naturalBeautyPublicationCandidate.rewardsEligibility, "UNKNOWN");
});
