import type { BuildReviewIdentity } from "../types/build-review";
import { naturalBeautyIteration1BuildStateFingerprint, naturalBeautyProjectIdentityFingerprint } from "../data/natural-beauty-build-state";

export const softFlashBuildId = "build-lens-soft-flash-test-v1";
export const naturalBeautyBuildId = "learning-build-001-natural-beauty";

export const naturalBeautyReviewIdentity: BuildReviewIdentity = {
  buildId: naturalBeautyBuildId,
  lensId: "lens-name:Effect Lab Sandbox",
  projectIdentityFingerprint: naturalBeautyProjectIdentityFingerprint,
  buildStateFingerprint: naturalBeautyIteration1BuildStateFingerprint,
};

export const naturalBeautyAssessmentIds = {
  iteration1: "natural-beauty-iteration-1-visual-qa",
  openEyes: "natural-beauty-iteration-1-open-eyes-visual-qa",
  visibleTeeth: "natural-beauty-iteration-1-visible-teeth-visual-qa",
} as const;
