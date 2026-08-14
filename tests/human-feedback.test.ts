import test from "node:test";
import assert from "node:assert/strict";
import { MemoryHumanFeedbackStore } from "../services/human-feedback.ts";

test("human feedback is stored with the build", () => {
  const store = new MemoryHumanFeedbackStore(); store.save("build-1", "NEEDS_CHANGES", "Too pink."); store.save("build-2", "APPROVE", "Keep this version.");
  assert.deepEqual(store.list("build-1").map((item) => [item.decision,item.feedback]), [["NEEDS_CHANGES","Too pink."]]);
});

test("human disagreement with AI assessment is stored separately", () => {
  const store = new MemoryHumanFeedbackStore(); store.saveAssessment("build-1", "assessment-1", "DISAGREE", "The highlights look controlled.");
  const record = store.list("build-1")[0]; assert.equal(record.assessmentAgreement, "DISAGREE"); assert.equal(record.assessmentNote, "The highlights look controlled."); assert.equal(record.decision, null);
});

test("assessment feedback is idempotent by build and assessment", () => {
  const store = new MemoryHumanFeedbackStore(); store.saveAssessment("build-1", "assessment-1", "AGREE", "First."); store.saveAssessment("build-1", "assessment-1", "DISAGREE", "Changed.");
  assert.equal(store.list("build-1").length, 1); assert.equal(store.list("build-1")[0].assessmentNote, "Changed.");
});
