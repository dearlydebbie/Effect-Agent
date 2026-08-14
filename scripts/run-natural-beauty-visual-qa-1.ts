import { readFileSync, writeFileSync } from "node:fs";
import { naturalBeautyIteration0VisualQA } from "../data/natural-beauty-build-001";
import { naturalBeautyLearningPlan } from "../data/natural-beauty-learning";
import { selectVisionProvider } from "../services/vision-provider-selection";
import type { CreativeDirection } from "../types/creative-qa";
import type { Idea } from "../types/domain";

const previewPath = "/Users/debbie/Documents/effect-agent/public/natural-beauty-iteration-1.png";
const outputPath = "/private/tmp/effect-lab-natural-beauty-visual-qa-1.json";
const provider = selectVisionProvider(process.env);
if (provider.state !== "REAL") throw new Error("The configured real Vision provider is not available.");

const idea: Idea = {
  id: "learning-build-001-natural-beauty", title: "Natural Beauty", hook: "A subtle camera-ready beauty treatment.", description: "Keep skin texture and natural colour. Add a soft photographic finish.", platforms: ["Snapchat"], categories: ["Beauty", "Skin and complexion", "Aesthetic camera effects"], interactionType: "Always-on camera treatment", targetUserBehaviour: "Record repeated everyday photos and videos.", technicalApproach: "Use a verified RetouchVisual structure with conservative values. The faulty colour-grade component is disabled in Iteration 1.", requiredAssets: ["Natural Beauty LUT", "Natural Beauty Colour Material"], publicFacingText: [], noveltyExplanation: "The learning build uses conservative retouch values and keeps unsupported aesthetic claims unknown.", risks: ["Excessive smoothing", "Colour cast", "Loss of highlight or shadow detail"], buildComplexity: "Simple", estimatedEffort: "One controlled learning build", status: "APPROVED", createdDate: "2026-08-14", scores: { trend: 0, originality: 0, shareability: 0, replay: 0, potential: 0 }, saturation: "Medium", recommendationReason: "This is a learning exercise, not a virality claim.", demo: false,
};
const direction: CreativeDirection = {
  id: "direction-natural-beauty-001", ideaId: idea.id, categories: idea.categories,
  visualObjective: "Create a subtle camera-ready beauty treatment that looks natural, polished, soft, and photographic.", intendedFeeling: "Natural and flattering without looking artificial.", focalPoint: "Believable skin and balanced facial detail.", composition: ["Keep the original camera composition."], colourTreatment: ["Keep colour neutral.", "Avoid pink and magenta casts.", "Avoid excessive warmth."], lightingTreatment: ["Retain highlights.", "Retain shadow detail."], materialDirection: ["Do not assess the disabled faulty LUT as active treatment."], motionDirection: ["Keep the treatment stable."], interactionBehaviour: ["Start the treatment when the Lens opens."], timing: ["Keep the treatment active."], intensity: ["Use conservative retouch values.", "Keep the effect noticeable but subtle."], restraint: ["Do not change face shape.", "Do not use aggressive smoothing.", "Do not exaggerate eyes.", "Do not create a whitening-heavy appearance."], visualReferences: ["Soft photographic camera finish."], elementsToAvoid: ["Pink cast", "Magenta cast", "Crushed shadows", "Blown highlights", "Plastic skin", "Obvious artefacts"], successCriteria: naturalBeautyLearningPlan.specification.visualQACriteria, categoryCriteria: ["Natural skin appearance", "Visible skin texture", "Neutral colour", "Subtle eye and teeth treatment", "Photographic polish"],
};

const imageDataUrl = `data:image/png;base64,${readFileSync(previewPath).toString("base64")}`;
const report = await provider.evaluate({
  idea,
  creativeDirection: direction,
  specification: naturalBeautyLearningPlan.specification,
  previewDataUrl: imageDataUrl,
  category: idea.categories,
  intendedInteraction: idea.interactionType,
  technicalInformation: [
    "TypeScript compilation passed.",
    "Runtime logs contained no errors, warnings, or deprecations.",
    "Iteration 1 changed only Natural Beauty Grade PostEffectVisual.enabled from true to false.",
    "RetouchVisual values remained 0, 0.25, 0.1, 0.2, and 0.08.",
    "This is the real Lens Studio Iteration 1 preview.",
  ],
  previousIterations: [{ iteration: 0, score: naturalBeautyIteration0VisualQA.overallScore, changes: ["Original LUT", "Conservative RetouchVisual values"], outcome: "Failed because an extreme green and magenta false-colour artefact covered the frame." }],
}, { force: true });

writeFileSync(outputPath, JSON.stringify({ buildId: idea.id, iteration: 1, previewPath, approvedForExternalAnalysis: true, report }, null, 2));
console.log(JSON.stringify({ provider: report.provider, providerState: report.providerState, model: report.model, status: report.status, overallScore: report.overallScore, scores: report.scores, strengths: report.strengths, findings: report.findings, limitations: report.limitations, iterationRecommended: report.iterationRecommended, iterationPriority: report.iterationPriority, confidence: report.confidence, outputPath }, null, 2));
if (report.providerState !== "REAL" || report.overallScore === null) process.exitCode = 2;
