import { beautyPresetInspection } from "../data/beauty-preset-inspection";
import type { BatchPresetInspection, BeautyCapabilityMap } from "../types/deep-preset-inspection";
import { beautyFaceBatchOrder } from "../types/deep-preset-inspection";
import type { PatternEvidenceLevel } from "../types/preset-census";

export function validateSequentialBatch(inspections: BatchPresetInspection[]) {
  const reasons: string[] = [];
  let stoppedAt: string | null = null;
  for (let index = 0; index < inspections.length; index += 1) {
    const entry = inspections[index];
    if (entry.presetName !== beautyFaceBatchOrder[index]) reasons.push(`Expected ${beautyFaceBatchOrder[index]} at position ${index + 1}.`);
    if (entry.order !== index + 1) reasons.push(`The order value for ${entry.presetName} is not sequential.`);
    if (!entry.resetMatchesBaseline || entry.baselineFingerprint !== entry.resetFingerprint) {
      stoppedAt = entry.presetName;
      reasons.push(`The reset after ${entry.presetName} did not restore the exact baseline.`);
      break;
    }
    if (entry.status !== "COMPLETE") {
      stoppedAt = entry.presetName;
      reasons.push(`${entry.presetName} did not complete.`);
      break;
    }
  }
  return { allowedToContinue: reasons.length === 0, complete: inspections.length === beautyFaceBatchOrder.length && reasons.length === 0, stoppedAt, reasons };
}

export function mergeEvidenceLevels(levels: PatternEvidenceLevel[]): PatternEvidenceLevel {
  const rank: PatternEvidenceLevel[] = ["UNKNOWN", "METADATA_ONLY", "SCENE_VERIFIED", "PROPERTY_VERIFIED", "BEHAVIOUR_VERIFIED"];
  return levels.reduce((best, current) => rank.indexOf(current) > rank.indexOf(best) ? current : best, "UNKNOWN");
}

export function createBeautyCapabilityMap(inspections: BatchPresetInspection[]): BeautyCapabilityMap {
  const safety = validateSequentialBatch(inspections);
  if (!safety.complete) throw new Error(safety.reasons[0] ?? "The complete verified batch is required.");

  const sources = (names: string[]) => names;
  return {
    generatedAt: "2026-08-14T13:26:08.832Z",
    lensStudioVersion: "5.23.1.26080420",
    inspectedPresets: [beautyPresetInspection.presetName, ...inspections.map((entry) => entry.presetName)],
    verifiedFacts: [
      { area: "Colour correction", finding: "BeautyPreset creates a PostEffectVisual with Color Correction.mat, a screen texture, and a 256 by 16 Beauty LUT.", evidenceLevel: "PROPERTY_VERIFIED", sources: sources(["BeautyPreset"]) },
      { area: "Retouching", finding: "RetouchVisual exposes faceIndex, soft-skin, teeth-whitening, eye-sharpening, and eye-whitening values.", evidenceLevel: "PROPERTY_VERIFIED", sources: sources(["FaceRetouchObjectPreset"]) },
      { area: "Smoothing", finding: "SmoothingPreset creates a PostEffectVisual with Smoothing.mat, smoothing.graphShader, and ScreenTexture.", evidenceLevel: "PROPERTY_VERIFIED", sources: sources(["SmoothingPreset"]) },
      { area: "Face mesh", finding: "A Head component at HeadCenter contains a RenderMeshVisual using Face Mesh.facemesh and a masked Face Mesh material.", evidenceLevel: "PROPERTY_VERIFIED", sources: sources(["FaceMeshObjectPreset"]) },
      { area: "Head binding", finding: "A Head component at HeadCenter contains a transformed Face Occluder using Head.mesh and a depth-writing material.", evidenceLevel: "PROPERTY_VERIFIED", sources: sources(["HeadBindingObjectPreset"]) },
      { area: "Runtime", finding: "All four batch presets compiled without errors. RetouchController version 9.0 initialized and printed at runtime.", evidenceLevel: "BEHAVIOUR_VERIFIED", sources: sources(["FaceRetouchObjectPreset", "SmoothingPreset", "FaceMeshObjectPreset", "HeadBindingObjectPreset"]) },
    ],
    inferredDesignUses: [
      { use: "Use the face mesh for makeup placement or creative face transformations.", basis: "A tracked mesh, mask texture, and editable material are verified. The design use was not built or behavior-tested.", status: "INFERENCE" },
      { use: "Place a 3D accessory under the head binding hierarchy.", basis: "The HeadCenter anchor and child hierarchy are verified. Accessory behavior was not tested.", status: "INFERENCE" },
      { use: "Combine conservative retouch controls with colour correction.", basis: "Both systems have readable controls, but their combined visual result was not tested.", status: "INFERENCE" },
    ],
    limitations: ["No preset was motion-tested with multiple faces.", "Undocumented shader graph ports remain UNKNOWN.", "No complete original beauty Lens has passed build, visual QA, experience QA, and human review.", "Accessory attachment behavior remains unverified.", "No publishing capability was used."],
    readiness: recalculateBeautyReadiness(inspections),
  };
}

export function recalculateBeautyReadiness(inspections: BatchPresetInspection[]): BeautyCapabilityMap["readiness"] {
  const names = new Set(inspections.filter((entry) => entry.status === "COMPLETE" && entry.resetMatchesBaseline).map((entry) => entry.presetName));
  const has = (name: string) => names.has(name as BatchPresetInspection["presetName"]);
  return [
    { category: "Beauty", status: has("FaceRetouchObjectPreset") && has("SmoothingPreset") ? "PARTIAL" : "NOT_READY", reasons: ["Colour, retouch, and smoothing structures have property evidence.", "A complete original beauty Lens has not yet passed the full learning build and QA workflow."] },
    { category: "Face Effects", status: has("FaceMeshObjectPreset") && has("HeadBindingObjectPreset") ? "PARTIAL" : "NOT_READY", reasons: ["Tracked face mesh and head-binding hierarchies have property evidence.", "Tracking behavior and a complete face effect have not been validated in motion."] },
    { category: "Fashion / Accessories", status: has("HeadBindingObjectPreset") ? "PARTIAL" : "NOT_READY", reasons: ["A HeadCenter binding hierarchy and face occluder are verified.", "No accessory was attached, tested, or reviewed, so the category is not ready."] },
  ];
}
