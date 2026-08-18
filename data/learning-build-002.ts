import { beautyFaceBatchPatternCards } from "./beauty-face-batch";
import { beautyPresetInspection } from "./beauty-preset-inspection";
import type { LearningBuildSpecification } from "../types/accelerated-learning";

const candidates = [beautyFaceBatchPatternCards.find((card) => card.officialResourceName === "FaceMeshObjectPreset"), beautyFaceBatchPatternCards.find((card) => card.officialResourceName === "FaceRetouchObjectPreset"), beautyPresetInspection.patternCard];
if (candidates.some((card) => !card)) throw new Error("Learning Build 002 requires the existing FaceMesh, FaceRetouch, and Beauty Pattern Cards.");
export const learningBuild002RetrievedPatternCards = candidates.map((card) => card!);

export const learningBuild002Specification: LearningBuildSpecification = {
  id: "learning-spec-002-subtle-makeup",
  buildId: "learning-build-002-subtle-makeup",
  title: "Subtle Makeup",
  concept: "Create an original, restrained editorial makeup treatment on a tracked face surface.",
  categories: ["Makeup", "Beauty", "Face effects", "Editorial effects"],
  targetPlatform: "Snapchat",
  interactionType: "Always-on tracked face treatment",
  userExperience: ["The Lens opens with the front camera.", "The makeup starts at once.", "The user can record a photo or video."],
  sceneRequirements: [
    { name: "Subtle Makeup Face Mesh", purpose: "Track an original makeup texture on the face.", requiredComponents: ["Head", "RenderMeshVisual", "FaceMesh"] },
  ],
  assetRequirements: [
    { name: "Subtle Makeup Texture", kind: "texture", source: "generated", permissionRequired: false },
    { name: "Subtle Makeup Material", kind: "material", source: "generated", permissionRequired: false },
  ],
  textRequirements: [],
  behaviourRequirements: ["Keep the makeup aligned with face tracking.", "Do not change face shape.", "Keep the result subtle.", "Keep skin texture visible."],
  scriptRequirements: [],
  audioRequirements: ["Do not add audio."],
  visualDirection: ["Use a restrained editorial colour palette.", "Keep lip and cheek colour soft.", "Do not add exaggerated eyelashes.", "Do not add dramatic contour.", "Do not add obvious whitening.", "Keep natural facial detail."],
  technicalConstraints: ["Use the verified FaceMeshObjectPreset hierarchy as the construction pattern.", "Use the Head dependency created by FaceMeshObjectPreset. Do not instantiate HeadBindingObjectPreset.", "Do not use undocumented radius or softness meanings.", "Do not add face-shape transformation.", "Do not use the failed Effect Lab LUT construction method.", "Do not publish or submit the Lens.", "Stop if the structure differs from the verified FaceMesh evidence."],
  qaRequirements: ["Technical QA must pass.", "Specification QA must pass.", "Capture a real preview.", "Visual QA must assess alignment, texture, colour, artefacts, and natural facial detail.", "Experience QA must preserve UNKNOWN where a static preview is insufficient.", "A person must approve the final result."],
  status: "AWAITING_HUMAN_CONFIRMATION",
  confirmationAction: "CONFIRM LEARNING BUILD 002 — SUBTLE MAKEUP",
  patternEvidence: [
    { presetName: "FaceMeshObjectPreset", patternCardId: learningBuild002RetrievedPatternCards[0].id, decision: "USE", status: "VERIFIED_REUSABLE", reason: "Its Head, RenderMeshVisual, FaceMesh asset, material, mask, and hierarchy were deeply inspected and compiled." },
    { presetName: "FaceRetouchObjectPreset", patternCardId: learningBuild002RetrievedPatternCards[1].id, decision: "DO_NOT_USE", status: "VERIFIED_CONTEXTUAL", reason: "Natural Beauty values are approved evidence, but this exercise isolates new FaceMesh makeup capability and avoids repeating the retouch treatment." },
    { presetName: "BeautyPreset", patternCardId: learningBuild002RetrievedPatternCards[2].id, decision: "DO_NOT_USE", status: "FAILED_PREVIOUSLY", reason: "The post-effect architecture is known, but colour grading is not required and the current Effect Lab LUT construction method failed previously." },
  ],
  plannedOperations: [
    { operation: "Verify the live sandbox and rediscover the current MCP capability map.", status: "VERIFIED_REUSABLE", evidence: "The verified sandbox preflight was used in Learning Build 001 and the preset batch.", confirmationRequired: false },
    { operation: "Instantiate FaceMeshObjectPreset once and verify its expected hierarchy.", status: "VERIFIED_REUSABLE", evidence: "The preset was instantiated, deeply inspected, compiled, previewed, and reset exactly in Lens Studio 5.23.1.26080420.", confirmationRequired: false },
    { operation: "Create an isolated original Subtle Makeup material and texture from the preset-created delta.", status: "VERIFIED_CONTEXTUAL", evidence: "Isolated asset rename and material workflows succeeded in Learning Build 001. The new creative result is Build 002-specific.", confirmationRequired: false },
    { operation: "Assign the original makeup texture through the readable Face Mesh material texture input and read the reference back.", status: "VERIFIED_CONTEXTUAL", evidence: "Face Mesh.mat baseTex and maskTex references were property-verified. The visual makeup result has not yet been tested.", confirmationRequired: false },
    { operation: "Compile, inspect runtime findings, run structural QA, and capture a preview.", status: "VERIFIED_REUSABLE", evidence: "These operations succeeded in Learning Build 001 and the controlled preset batch.", confirmationRequired: false },
  ],
  verifiedMakeupProperties: ["RenderMeshVisual.mesh", "RenderMeshVisual.mainMaterial", "FaceMesh.faceIndex", "FaceMesh.faceGeometryEnabled", "FaceMesh.eyeCornerGeometryEnabled", "Face Mesh.mat.baseTex", "Face Mesh.mat.maskTex", "Face Mesh.mat.baseColor", "Face Mesh.mat.ENABLE_FACE_TEX", "Face Mesh.mat.ENABLE_SMOOTH_EDGES"],
  unknowns: ["The face mesh topology was not exposed.", "The visual meanings of radius and softness were not behaviour-tested and will not be changed.", "Makeup alignment and appearance are not proved until Build 002 preview evidence exists.", "Results across faces, skin tones, lighting, cameras, and movement remain unknown."],
  additionalPresetInspectionRequired: false,
  inspectionDecisionReason: "Another preset inspection would repeat the already verified FaceMesh structure. Build 002 must instead test the minimum new contextual step: an original makeup texture on that verified surface.",
};
