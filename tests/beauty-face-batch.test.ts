import test from "node:test";
import assert from "node:assert/strict";
import { beautyFaceBatchInspections } from "../data/beauty-face-batch.ts";
import { createBeautyCapabilityMap, mergeEvidenceLevels, recalculateBeautyReadiness, validateSequentialBatch } from "../services/beauty-face-batch.ts";

test("the batch completed in the required sequence with an exact reset after every preset", () => {
  const result = validateSequentialBatch(beautyFaceBatchInspections);
  assert.equal(result.complete, true);
  assert.equal(result.stoppedAt, null);
  assert.ok(beautyFaceBatchInspections.every((entry) => entry.baselineFingerprint === entry.resetFingerprint));
});

test("the batch stops at the first reset mismatch", () => {
  const changed = beautyFaceBatchInspections.map((entry, index) => index === 1 ? { ...entry, resetFingerprint: "different", resetMatchesBaseline: false } : entry);
  const result = validateSequentialBatch(changed);
  assert.equal(result.allowedToContinue, false);
  assert.equal(result.stoppedAt, "SmoothingPreset");
  assert.match(result.reasons[0], /exact baseline/);
});

test("the exact baseline is required even if resetMatchesBaseline is incorrectly true", () => {
  const changed = beautyFaceBatchInspections.map((entry, index) => index === 0 ? { ...entry, resetFingerprint: "not-the-baseline" } : entry);
  assert.equal(validateSequentialBatch(changed).complete, false);
});

test("evidence merging keeps the strongest observed level", () => {
  assert.equal(mergeEvidenceLevels(["UNKNOWN", "SCENE_VERIFIED", "PROPERTY_VERIFIED"]), "PROPERTY_VERIFIED");
  assert.equal(mergeEvidenceLevels(["BEHAVIOUR_VERIFIED", "METADATA_ONLY"]), "BEHAVIOUR_VERIFIED");
  assert.equal(mergeEvidenceLevels([]), "UNKNOWN");
});

test("Beauty Capability Map separates facts from inferred design uses", () => {
  const map = createBeautyCapabilityMap(beautyFaceBatchInspections);
  assert.equal(map.inspectedPresets.length, 5);
  assert.ok(map.verifiedFacts.every((entry) => entry.evidenceLevel !== "UNKNOWN"));
  assert.ok(map.inferredDesignUses.every((entry) => entry.status === "INFERENCE"));
  assert.ok(map.limitations.some((value) => value.includes("Accessory")));
});

test("curriculum readiness stays partial until complete learning builds are verified", () => {
  const readiness = recalculateBeautyReadiness(beautyFaceBatchInspections);
  assert.deepEqual(readiness.map((entry) => [entry.category, entry.status]), [["Beauty", "PARTIAL"], ["Face Effects", "PARTIAL"], ["Fashion / Accessories", "PARTIAL"]]);
  assert.ok(readiness.every((entry) => entry.reasons.length >= 2));
});
