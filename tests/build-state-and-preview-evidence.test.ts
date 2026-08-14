import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { naturalBeautyIteration1 } from "../data/natural-beauty-build-001.ts";
import { naturalBeautyBuildState, naturalBeautyIteration0BuildStateFingerprint, naturalBeautyIteration1BuildStateFingerprint, naturalBeautyProjectIdentityFingerprint } from "../data/natural-beauty-build-state.ts";
import { naturalBeautyControlledPreviewEvidence, naturalBeautyControlledPreviewSummary } from "../data/natural-beauty-controlled-evidence.ts";
import { canonicalSerialize, createBuildStateFingerprint } from "../services/build-state-fingerprint.ts";

test("dashboard typography establishes readable body, control, metadata, and technical scales", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /body \.content p\{font-size:15px/);
  assert.match(css, /button,input,textarea,select,label\)\{font-size:14px/);
  assert.match(css, /body \.content small\{font-size:12\.5px/);
  assert.match(css, /technical-iteration-review[\s\S]*font-size:13px/);
});

test("controlled preview evidence records explicit external submission approval", () => {
  assert.deepEqual(naturalBeautyControlledPreviewEvidence.map((entry) => entry.state), ["CAPTURED", "CAPTURED", "UNAVAILABLE"]);
  assert.deepEqual(naturalBeautyControlledPreviewEvidence.map((entry) => entry.externalSubmission), ["SENT_WITH_APPROVAL", "SENT_WITH_APPROVAL", "NOT_SENT"]);
  assert.equal(naturalBeautyControlledPreviewSummary.submissionAuthorization, "EXPLICIT_USER_APPROVAL");
  assert.ok(naturalBeautyControlledPreviewEvidence.every((entry) => entry.componentValuesPreserved));
  assert.equal(naturalBeautyControlledPreviewSummary.sufficientForIteration2, false);
});

test("Build State Fingerprint is deterministic under record and array ordering", async () => {
  const state = naturalBeautyBuildState(false);
  const reordered = { ...state, objects: [...state.objects].reverse(), assets: [...state.assets].reverse() };
  reordered.objects = reordered.objects.map((object) => ({ ...object, components: [...object.components].reverse() }));
  assert.equal(await createBuildStateFingerprint(state), await createBuildStateFingerprint(reordered));
  assert.equal(canonicalSerialize({ b: 2, a: 1 }), canonicalSerialize({ a: 1, b: 2 }));
});

test("controlled property changes produce distinct Build State Fingerprints", async () => {
  assert.equal(await createBuildStateFingerprint(naturalBeautyBuildState(true)), naturalBeautyIteration0BuildStateFingerprint);
  assert.equal(await createBuildStateFingerprint(naturalBeautyBuildState(false)), naturalBeautyIteration1BuildStateFingerprint);
  assert.notEqual(naturalBeautyIteration0BuildStateFingerprint, naturalBeautyIteration1BuildStateFingerprint);
});

test("project identity fingerprint remains independent of controlled component properties", () => {
  assert.equal(naturalBeautyProjectIdentityFingerprint, naturalBeautyIteration1.projectFingerprint);
  assert.notEqual(naturalBeautyProjectIdentityFingerprint, naturalBeautyIteration1BuildStateFingerprint);
});

test("Learning Build 001 stores the scoped observed outcome and LUT knowledge gap", () => {
  const outcome = naturalBeautyIteration1.learningRecord.observedOutcomes?.find((entry) => entry.statement.includes("removed the full-frame false-colour artefact"));
  assert.ok(outcome);
  assert.match(outcome.scope, /One Lens Studio preview/);
  assert.deepEqual(naturalBeautyIteration1.learningRecord.knowledgeGaps, [{ topic: "Original LUT generation and encoding", status: "KNOWLEDGE_GAP", reason: "The generated 256 by 16 LUT produced false colour. The required Lens Studio LUT packing and channel encoding were not verified." }]);
  assert.deepEqual(naturalBeautyIteration1.learningRecord.futureLearningTargets, ["Lens Studio LUT Construction and Encoding"]);
});
