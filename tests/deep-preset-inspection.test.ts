import test from "node:test";
import assert from "node:assert/strict";
import { beautyPresetInspection } from "../data/beauty-preset-inspection.ts";
import { determineResetStatus, validateBeautyPresetConfirmation } from "../services/deep-preset-inspection.ts";

const confirmation = {
  presetName: "BeautyPreset",
  confirmedPresetName: "BeautyPreset",
  humanConfirmed: true,
  sandboxStatus: "VERIFIED" as const,
  lensName: "Effect Lab Sandbox",
  projectPath: "/Users/debbie/Documents/Effect Lab Training Sandbox",
  fingerprint: "baseline",
  connectionSource: "MANUAL_CONFIG" as const,
  softFlashMarkersAbsent: true,
};

test("deep inspection gate allows only the exact confirmed BeautyPreset", () => {
  assert.equal(validateBeautyPresetConfirmation(confirmation).allowed, true);
  assert.equal(validateBeautyPresetConfirmation({ ...confirmation, presetName: "FaceInsetPreset" }).allowed, false);
  assert.equal(validateBeautyPresetConfirmation({ ...confirmation, confirmedPresetName: null }).allowed, false);
});

test("deep inspection gate preserves every sandbox identity check", () => {
  assert.equal(validateBeautyPresetConfirmation({ ...confirmation, projectPath: "/tmp/Effect Lab Training Sandbox" }).allowed, false);
  assert.equal(validateBeautyPresetConfirmation({ ...confirmation, fingerprint: null }).allowed, false);
  assert.equal(validateBeautyPresetConfirmation({ ...confirmation, softFlashMarkersAbsent: false }).allowed, false);
});

test("BeautyPreset Pattern Card promotes only observed fields", () => {
  assert.equal(beautyPresetInspection.patternCard.inspectionLevel, "DEEPLY_INSPECTED");
  assert.equal(beautyPresetInspection.patternCard.fieldEvidence?.importantProperties, "PROPERTY_VERIFIED");
  assert.equal(beautyPresetInspection.patternCard.fieldEvidence?.interactions, "UNKNOWN");
  assert.ok(beautyPresetInspection.remainingUnknown.some((value) => value.includes("Port_Input2_N011")));
  assert.ok(beautyPresetInspection.knowledge.every((entry) => entry.status === "VERIFIED" && entry.evidenceSource?.includes("Lens Studio MCP")));
});

test("reset remains unverified until a reset is compared with the baseline", () => {
  assert.equal(determineResetStatus({ exactDeletePlanSupported: true, automaticResetComparedWithBaseline: false, manualResetVerified: false }), "NO_VERIFIED_RESET");
  assert.equal(determineResetStatus({ exactDeletePlanSupported: true, automaticResetComparedWithBaseline: true, manualResetVerified: false }), "SAFE_AUTOMATIC_RESET");
});

test("recorded BeautyPreset reset restored the exact baseline", () => {
  assert.equal(beautyPresetInspection.resetStatus, "SAFE_AUTOMATIC_RESET");
  assert.equal(beautyPresetInspection.resetEvidence?.baselineRestored, true);
  assert.equal(beautyPresetInspection.lensStudioModified, false);
});
