import type { LearningQualityGates } from "./build-review";

export interface NaturalBeautyLiveValues {
  colourGradeEnabled: boolean | null;
  faceIndex: number | null;
  softSkinIntensity: number | null;
  teethWhiteningIntensity: number | null;
  sharpenEyeIntensity: number | null;
  eyeWhiteningIntensity: number | null;
}

export interface NaturalBeautyReadinessCheck {
  id: string;
  label: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export interface NaturalBeautyReviewReadiness {
  buildId: "learning-build-001-natural-beauty";
  capturedAt: string;
  ready: boolean;
  connectionState: string;
  lensName: string | null;
  projectFolder: string | null;
  sandboxStatus: "VERIFIED" | "MISMATCH" | "UNKNOWN";
  projectIdentityFingerprint: string | null;
  buildStateFingerprint: string | null;
  values: NaturalBeautyLiveValues;
  quality: LearningQualityGates & {
    experienceQA: "WARNING";
    automatedIterationRecommendation: "STOP";
    readyIteration2Operations: 0;
    humanReviewState: "AWAITING_HUMAN_REVIEW";
  };
  checks: NaturalBeautyReadinessCheck[];
  mismatches: string[];
  lensStudioModifiedByVerification: false;
  openAICalled: false;
  published: false;
}
