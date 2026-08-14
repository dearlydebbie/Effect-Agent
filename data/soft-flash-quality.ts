import type { Idea } from "../types/domain";
import type { IterationRecord } from "../types/creative-qa";

export const softFlashIdea: Idea = {
  id: "idea-soft-flash-test", title: "Soft Flash Test", hook: "Use a clean soft flash camera treatment.",
  description: "Create a clean editorial soft-flash camera treatment.", platforms: ["Snapchat"], categories: ["Beauty", "Aesthetic camera effects"],
  interactionType: "Open the Lens to apply the camera treatment.", targetUserBehaviour: "Capture an editorial portrait or short video.",
  technicalApproach: "Use a restrained post-effect treatment in Lens Studio.", requiredAssets: ["Lens Studio colour treatment"], publicFacingText: [],
  noveltyExplanation: "This is a controlled integration and visual-quality validation case.", risks: ["Avoid blown highlights.", "Avoid a pink cast.", "Preserve facial identity and skin texture."],
  buildComplexity: "Simple", estimatedEffort: "2–4 hours", status: "APPROVED", createdDate: "2026-08-14",
  scores: { trend: 0, originality: 0, shareability: 0, replay: 0, potential: 0 }, saturation: "Low", recommendationReason: "Use one simple Lens to validate the quality pipeline.", demo: false,
};

export const softFlashInitialIteration: IterationRecord = {
  id: "soft-flash-original", buildId: "build-lens-soft-flash-test-v1", number: 0, previewDataUrl: null, visualScore: null,
  changesMade: ["Created the initial soft flash treatment."], technicalQA: "PASS", visualQA: "UNAVAILABLE", timestamp: "2026-08-14T00:00:00.000Z",
};
