import test from "node:test";
import assert from "node:assert/strict";
import { learningBuild002RetrievedPatternCards, learningBuild002Specification } from "../data/learning-build-002.ts";

test("Build 002 retrieves only the relevant existing Pattern Cards", () => {
  assert.deepEqual(learningBuild002RetrievedPatternCards.map((card) => card.officialResourceName), ["FaceMeshObjectPreset", "FaceRetouchObjectPreset", "BeautyPreset"]);
  assert.equal(learningBuild002Specification.patternEvidence.find((entry) => entry.presetName === "FaceMeshObjectPreset")?.decision, "USE");
  assert.equal(learningBuild002Specification.patternEvidence.find((entry) => entry.presetName === "FaceRetouchObjectPreset")?.decision, "DO_NOT_USE");
  assert.equal(learningBuild002Specification.patternEvidence.find((entry) => entry.presetName === "BeautyPreset")?.decision, "DO_NOT_USE");
});

test("Build 002 is complete, evidence-bounded, and stopped at one gate", () => {
  assert.equal(learningBuild002Specification.status, "AWAITING_HUMAN_CONFIRMATION");
  assert.equal(learningBuild002Specification.confirmationAction, "CONFIRM LEARNING BUILD 002 — SUBTLE MAKEUP");
  assert.equal(learningBuild002Specification.additionalPresetInspectionRequired, false);
  assert.ok(learningBuild002Specification.unknowns.some((entry) => entry.includes("radius and softness")));
  assert.ok(learningBuild002Specification.technicalConstraints.some((entry) => entry.includes("Do not instantiate HeadBindingObjectPreset")));
  assert.ok(!learningBuild002Specification.sceneRequirements.some((entry) => entry.name.includes("Retouch")));
  assert.ok(learningBuild002Specification.plannedOperations.every((entry) => entry.status !== "UNKNOWN" && !entry.confirmationRequired));
});
