import { readFileSync, writeFileSync } from "node:fs";
import { naturalBeautyLearningPlan } from "../data/natural-beauty-learning";
import { selectVisionProvider } from "../services/vision-provider-selection";
import type { CreativeDirection, VisualQAReport } from "../types/creative-qa";
import type { Idea } from "../types/domain";

const outputPath = "/private/tmp/effect-lab-natural-beauty-controlled-evidence-qa.json";
const provider = selectVisionProvider(process.env);
if (provider.state !== "REAL") throw new Error("The configured real Vision provider is not available.");

const idea: Idea = {
  id: "learning-build-001-natural-beauty", title: "Natural Beauty", hook: "A subtle camera-ready beauty treatment.", description: "Keep skin texture and natural colour. Add a soft photographic finish.", platforms: ["Snapchat"], categories: ["Beauty", "Skin and complexion", "Aesthetic camera effects"], interactionType: "Always-on camera treatment", targetUserBehaviour: "Record everyday photos and videos.", technicalApproach: "Use conservative RetouchVisual values. Keep the faulty colour-grade component disabled.", requiredAssets: [], publicFacingText: [], noveltyExplanation: "This is a controlled learning build.", risks: ["Unnatural eye brightness", "Unnatural teeth whitening", "Colour clipping", "Visual artefacts"], buildComplexity: "Simple", estimatedEffort: "Controlled evidence review", status: "APPROVED", createdDate: "2026-08-14", scores: { trend: 0, originality: 0, shareability: 0, replay: 0, potential: 0 }, saturation: "Medium", recommendationReason: "This is evidence collection, not a virality claim.", demo: false,
};

const baseDirection: CreativeDirection = {
  id: "direction-natural-beauty-controlled-evidence", ideaId: idea.id, categories: idea.categories, visualObjective: "Keep the treatment natural and restrained.", intendedFeeling: "Natural and polished.", focalPoint: "Believable facial detail.", composition: ["Use the supplied preview as evidence only."], colourTreatment: ["Keep colour neutral."], lightingTreatment: ["Retain highlights and shadows."], materialDirection: [], motionDirection: [], interactionBehaviour: [], timing: [], intensity: ["Keep eye and teeth treatment subtle."], restraint: ["Do not infer close-range skin texture.", "Do not generalise beyond this preview."], visualReferences: [], elementsToAvoid: ["Eye halos", "Unnatural eye brightness", "Unnatural teeth whitening", "Colour clipping", "Artefacts"], successCriteria: ["The assessed treatment looks natural in the supplied preview."], categoryCriteria: [],
};

const openEyes = await evaluateEvidence({
  condition: "OPEN_EYES",
  previewPath: "/Users/debbie/Documents/effect-agent/public/natural-beauty-evidence-open-eyes.png",
  direction: { ...baseDirection, id: `${baseDirection.id}-open-eyes`, focalPoint: "The open eyes and surrounding eye regions.", categoryCriteria: ["Assess eye whitening.", "Assess eye sharpening.", "Check for unnatural eye brightness.", "Check for halos or artefacts.", "Check whether the treatment still looks natural.", "Use this image as supporting evidence for colour neutrality and facial coherence.", "Do not assess teeth whitening.", "Do not use this image as proof of close-range skin texture."] },
  technicalInformation: ["sharpenEyeIntensity is 0.20.", "eyeWhiteningIntensity is 0.08.", "The image visibly shows both eyes open."],
});

const visibleTeeth = await evaluateEvidence({
  condition: "VISIBLE_TEETH",
  previewPath: "/Users/debbie/Documents/effect-agent/public/natural-beauty-evidence-visible-teeth.png",
  direction: { ...baseDirection, id: `${baseDirection.id}-visible-teeth`, focalPoint: "The visible teeth and surrounding mouth region.", categoryCriteria: ["Assess teeth whitening.", "Check for unnatural whitening.", "Check for colour clipping or artefacts.", "Check whether the treatment still looks natural.", "Use this image as supporting evidence for colour neutrality and facial coherence.", "Do not assess eye whitening or eye sharpening.", "Do not use this image as proof of close-range skin texture."] },
  technicalInformation: ["teethWhiteningIntensity is 0.10.", "The image visibly shows a natural smile with teeth."],
});

const result = { buildId: idea.id, iteration: 1, approvedForExternalAnalysis: true, closeSkinView: "UNAVAILABLE", lensStudioModified: false, retouchValuesChanged: false, openEyes, visibleTeeth };
writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ openEyes: summarize(openEyes), visibleTeeth: summarize(visibleTeeth), outputPath }, null, 2));
if ([openEyes, visibleTeeth].some((report) => report.providerState !== "REAL" || report.overallScore === null)) process.exitCode = 2;

async function evaluateEvidence(input: { condition: string; previewPath: string; direction: CreativeDirection; technicalInformation: string[] }): Promise<VisualQAReport> {
  const previewDataUrl = `data:image/png;base64,${readFileSync(input.previewPath).toString("base64")}`;
  return provider.evaluate({ idea, creativeDirection: input.direction, specification: naturalBeautyLearningPlan.specification, previewDataUrl, category: idea.categories, intendedInteraction: "Static controlled evidence preview", technicalInformation: [...input.technicalInformation, `This assessment is limited to ${input.condition}.`, "Do not infer close-range skin texture."], previousIterations: [{ iteration: 1, score: 8.2, changes: ["Disabled the faulty colour grade"], outcome: "The primary Iteration 1 preview received WARNING with low-priority eye and teeth evidence gaps." }] }, { force: true });
}

function summarize(report: VisualQAReport) {
  return { provider: report.provider, providerState: report.providerState, model: report.model, status: report.status, overallScore: report.overallScore, scores: report.scores, strengths: report.strengths, findings: report.findings, limitations: report.limitations, iterationRecommended: report.iterationRecommended, iterationPriority: report.iterationPriority, confidence: report.confidence };
}
