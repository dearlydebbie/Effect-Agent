import type { VisualQAReport } from "../types/creative-qa";

export type PropertyEvidenceDecision = "KEEP" | "REVIEW" | "INSUFFICIENT_EVIDENCE";

export const naturalBeautyOpenEyesQA: VisualQAReport = {
  status: "PASS", provider: "OpenAI", providerState: "REAL", model: "gpt-5.6-terra", mock: false, cached: false, previewAvailable: true, overallScore: 8.3, confidence: 0.84, iterationRecommended: false, iterationPriority: "NONE", message: "Scoped Open Eyes evidence assessment completed. Human judgement remains authoritative.",
  scores: { specificationMatch: 8.4, visualCoherence: 8.5, composition: 8.1, colour: 8.5, lighting: 8.4, readability: null, polish: 8.2, categorySpecificQuality: 8.4 }, applicability: { specificationMatch: "APPLICABLE", visualCoherence: "APPLICABLE", composition: "APPLICABLE", colour: "APPLICABLE", lighting: "APPLICABLE", readability: "NOT_APPLICABLE", polish: "APPLICABLE", categorySpecificQuality: "APPLICABLE" },
  strengths: ["Eye whites remain off-white rather than unnaturally bright.", "Eye definition is visible without obvious over-sharpening.", "No eye halos, edge defects, or tracking artefacts are visible.", "The treatment remains natural and facially coherent.", "Colour is broadly neutral in this preview."],
  findings: [{ type: "COMPOSITION", severity: "LOW", description: "The face occupies a limited part of the portrait frame for detailed eye inspection.", evidence: "Both eyes are readable, but the preview includes substantial background above the head.", recommendedChange: "Use closer framing for future eye evidence. Do not treat this as a treatment defect." }],
  limitations: ["Teeth are not visible.", "The image does not prove close-range skin texture.", "One static preview does not establish behaviour across faces, skin tones, lighting, movement, cameras, or recording."],
};

export const naturalBeautyVisibleTeethQA: VisualQAReport = {
  status: "PASS", provider: "OpenAI", providerState: "REAL", model: "gpt-5.6-terra", mock: false, cached: false, previewAvailable: true, overallScore: 8.8, confidence: 0.84, iterationRecommended: false, iterationPriority: "NONE", message: "Scoped Visible Teeth evidence assessment completed. Human judgement remains authoritative.",
  scores: { specificationMatch: 8.8, visualCoherence: 8.9, composition: 8.7, colour: 8.8, lighting: 8.7, readability: null, polish: 8.8, categorySpecificQuality: 9 }, applicability: { specificationMatch: "APPLICABLE", visualCoherence: "APPLICABLE", composition: "APPLICABLE", colour: "APPLICABLE", lighting: "APPLICABLE", readability: "NOT_APPLICABLE", polish: "APPLICABLE", categorySpecificQuality: "APPLICABLE" },
  strengths: ["Teeth retain warm off-white tonal variation and separation.", "Teeth do not look unnaturally bleached or clipped.", "No whitening artefacts, masking seams, or mouth-edge defects are visible.", "The treatment remains natural and facially coherent.", "Facial colour remains neutral-to-warm in this preview."], findings: [],
  limitations: ["No untreated comparison is available.", "The image does not prove close-range skin texture.", "Eye treatment is outside this image's assessment scope.", "One static preview does not establish behaviour across faces, skin tones, lighting, movement, cameras, or recording."],
};

export const naturalBeautyControlledPropertyDecisions: Array<{ property: string; value: number; decision: PropertyEvidenceDecision; evidence: string }> = [
  { property: "faceIndex", value: 0, decision: "KEEP", evidence: "Both controlled previews show one coherent tracked face. This is limited to the supplied previews." },
  { property: "softSkinIntensity", value: 0.25, decision: "INSUFFICIENT_EVIDENCE", evidence: "Close Skin View remains unavailable. Neither preview proves pore-level texture." },
  { property: "teethWhiteningIntensity", value: 0.1, decision: "KEEP", evidence: "The Visible Teeth preview passed with natural off-white variation and no clipping or whitening artefacts." },
  { property: "sharpenEyeIntensity", value: 0.2, decision: "KEEP", evidence: "The Open Eyes preview passed without obvious over-sharpening, halos, or edge artefacts." },
  { property: "eyeWhiteningIntensity", value: 0.08, decision: "KEEP", evidence: "The Open Eyes preview passed with off-white eye whites and no unnatural brightness." },
];

export const naturalBeautyAutomatedQualityAssessment = {
  technicalQA: "PASS" as const,
  specificationQA: "PASS" as const,
  visualQA: "PASS" as const,
  experienceQA: "WARNING" as const,
  experienceReason: "Static previews and runtime logs do not prove movement, recording, startup, reset behaviour, or broader face and camera coverage.",
  unresolvedCriticalFindings: [] as string[],
  iteration2ReadyOperations: [] as string[],
  automatedIterationRecommendation: "STOP" as const,
  workflowStatus: "AWAITING_HUMAN_REVIEW" as const,
};
