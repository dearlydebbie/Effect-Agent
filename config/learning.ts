import type { CurriculumSlot } from "../types/learning";

export const learningConfig = {
  sandbox: {
    expectedLensName: "Effect Lab Sandbox",
    expectedFolderName: "Effect Lab Training Sandbox",
    expectedProjectPath: "/Users/debbie/Documents/Effect Lab Training Sandbox",
    fingerprintPolicy: "CAPTURE_AND_COMPARE",
    excludedProjectMarkers: ["Blown White", "Color Correction", "color_correction", "BlownWhite"],
  },
  curriculumTarget: 100,
  categoryTargets: {
    Beauty: 20,
    Randomisers: 15,
    Games: 15,
    "Face effects": 10,
    "World AR": 10,
    VFX: 10,
    Fashion: 10,
    Experimental: 10,
  } satisfies Record<CurriculumSlot["category"], number>,
  originality: { tooSimilarAt: 0.78, reviseAt: 0.52 },
  publishCandidate: {
    technicalQA: "PASS",
    specificationQA: "PASS",
    minimumVisualScore: 8,
    humanDecision: "APPROVED",
    allowCriticalExperienceFailures: false,
  },
} as const;
