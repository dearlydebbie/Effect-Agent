import type { LensBuildSpecification } from "../types/lens-build";

export const softFlashTestSpecification: LensBuildSpecification = {
  id: "lens-soft-flash-test-v1",
  title: "Soft Flash Test",
  concept: "Create a simple editorial camera Lens with a clean soft flash treatment.",
  categories: ["Beauty", "Aesthetic camera effects"],
  targetPlatform: "Snapchat",
  interactionType: "Camera treatment",
  userExperience: [
    "The Lens opens with the front camera.",
    "A soft flash treatment appears.",
    "The user can record a clean editorial photo or video.",
  ],
  sceneRequirements: [
    { name: "Soft Flash Treatment", purpose: "Apply the photographic treatment.", requiredComponents: ["PostEffectVisual"] },
  ],
  assetRequirements: [
    { name: "Blown White LUT preset", kind: "material", source: "lens_studio", permissionRequired: false },
  ],
  textRequirements: [],
  behaviourRequirements: [
    "Keep the effect active while the Lens runs.",
    "Keep facial changes minimal.",
    "Do not alter face shape.",
    "Do not use excessive skin smoothing.",
  ],
  scriptRequirements: [],
  audioRequirements: ["Do not add audio."],
  visualDirection: [
    "Use a clean photographic finish.",
    "Use a soft neutral flash tone.",
    "Keep skin texture visible.",
    "Avoid strong colour shifts.",
  ],
  technicalConstraints: [
    "Keep the first build technically simple.",
    "Use only tools exposed by the connected Lens Studio MCP server.",
    "Limit automatic repair to two attempts.",
    "Do not publish or submit the Lens.",
  ],
  qaRequirements: [
    "TypeScript compilation passes.",
    "Runtime logs contain no Lens errors.",
    "The preview renders.",
    "The treatment does not significantly change face shape.",
    "The treatment does not excessively smooth skin.",
    "Human review is required.",
  ],
};
