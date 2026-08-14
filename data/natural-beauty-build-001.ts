import { naturalBeautyLearningPlan } from "./natural-beauty-learning";
import { createNaturalBeautyIterationPlan } from "../services/natural-beauty-iteration";
import type { VisualQAReport } from "../types/creative-qa";
import { naturalBeautyAutomatedQualityAssessment, naturalBeautyOpenEyesQA, naturalBeautyVisibleTeethQA } from "./natural-beauty-controlled-evidence-qa";

export const naturalBeautyIteration0VisualQA: VisualQAReport = {
  status: "FAIL", provider: "OpenAI", providerState: "REAL", model: "gpt-5.6-terra", mock: false, cached: false, previewAvailable: true, overallScore: 1.4, confidence: 0.97, iterationRecommended: true, iterationPriority: "HIGH", message: "AI visual assessment completed. Human judgement remains authoritative.",
  scores: { specificationMatch: 1, visualCoherence: 1, composition: 6, colour: 0, lighting: 1, readability: 4, polish: 0.5, categorySpecificQuality: 0.5 }, applicability: { specificationMatch: "APPLICABLE", visualCoherence: "APPLICABLE", composition: "APPLICABLE", colour: "APPLICABLE", lighting: "APPLICABLE", readability: "APPLICABLE", polish: "APPLICABLE", categorySpecificQuality: "APPLICABLE" },
  strengths: ["The subject is centered and front-facing.", "Hair strands and major facial contours remain visible.", "No face-shape distortion is clearly evident in this frame."],
  findings: [
    { type: "SPECIFICATION", severity: "CRITICAL", description: "The treatment does not match the subtle, neutral, photographic direction.", evidence: "The preview is dominated by fluorescent green and saturated magenta.", recommendedChange: "Restore a neutral photographic grade before further beauty tuning." },
    { type: "COLOUR", severity: "CRITICAL", description: "There is an extreme green and magenta colour cast.", evidence: "Hair, skin, clothing, sky, and background show severe false colour.", recommendedChange: "Return neutral areas and skin to plausible natural colour." },
    { type: "CATEGORY", severity: "CRITICAL", description: "Natural skin appearance cannot be achieved in the current result.", evidence: "The face contains green and magenta tonal regions.", recommendedChange: "Use a restrained colour treatment and reassess skin." },
    { type: "CATEGORY", severity: "HIGH", description: "Skin texture cannot be assessed reliably.", evidence: "Strong false colour obscures fine facial detail.", recommendedChange: "Neutralize colour before assessing smoothing." },
    { type: "LIGHTING", severity: "HIGH", description: "Highlight and shadow fidelity are compromised.", evidence: "Bright and dark areas carry severe false colour.", recommendedChange: "Restore natural highlight and shadow colour." },
    { type: "CATEGORY", severity: "HIGH", description: "The eye treatment reads as artificial.", evidence: "Both eye areas are strongly green-tinted.", recommendedChange: "Reassess the eye treatment after colour correction." },
    { type: "CATEGORY", severity: "MEDIUM", description: "Teeth treatment cannot be judged.", evidence: "The closed-mouth frame shows little tooth detail.", recommendedChange: "Use a neutral smile preview before changing whitening." },
    { type: "POLISH", severity: "CRITICAL", description: "The result has a severe full-frame artefact.", evidence: "Neon green and magenta regions create a false-colour appearance.", recommendedChange: "Remove the colour-channel artefact before review." },
  ],
  limitations: ["A static preview cannot prove runtime experience.", "The closed-mouth frame cannot prove teeth treatment.", "False colour prevents reliable smoothing assessment.", "One face and lighting condition cannot establish broader performance."],
};

export const naturalBeautyIteration0 = {
  status: "ITERATION_PLAN_AWAITING_CONFIRMATION" as const,
  previewPath: "/natural-beauty-iteration-0.png",
  technicalQA: "PASS" as const,
  specificationQA: "PASS" as const,
  visualQA: naturalBeautyIteration0VisualQA,
  projectFingerprint: "9f71141d7e38d9d4e5ff605d2a6f5ac5c19b918683fb2d881eb60b7dc5135af3",
  propertyValues: { faceIndex: 0, softSkinIntensity: 0.25, teethWhiteningIntensity: 0.1, sharpenEyeIntensity: 0.2, eyeWhiteningIntensity: 0.08 },
  failedOperations: ["The first material duplication attempt reused the source identifier. Specification QA failed. Exact rollback restored the baseline."],
  fixes: ["Replaced duplicateAsset with the supported renameAsset operation. The retry passed Technical and Specification QA."],
  iterationPlan: createNaturalBeautyIterationPlan({ projectFingerprint: "9f71141d7e38d9d4e5ff605d2a6f5ac5c19b918683fb2d881eb60b7dc5135af3", gradeObject: { id: "95954e47-3175-4685-a1a6-93e78436c207", name: "Natural Beauty Grade" }, gradeComponent: { id: "ea8d555f-5f9d-4e8a-bb65-1769008c0d9e", name: "Natural Beauty Grade", enabled: true }, retouchComponent: { id: "ac14ad83-f8b6-4187-a0cc-8ab272902e37", name: "Face Retouch" }, visualQA: naturalBeautyIteration0VisualQA }),
  learningRecord: { ...naturalBeautyLearningPlan.draftRecord, successfulOperations: ["Instantiate BeautyPreset technical structure", "Instantiate FaceRetouchObjectPreset technical structure", "Generate and import original LUT", "Set five verified RetouchVisual properties", "Compile", "Collect runtime logs", "Capture Iteration 0 preview", "Run real OpenAI Vision QA"], failedOperations: ["duplicateAsset returned the source material identifier during the first attempt"], fixes: ["Used renameAsset for the isolated preset-created material after exact rollback"], compileResult: "PASSED" as const, visualQA: { status: "FAIL" as const, score: 1.4, notes: ["Critical green and magenta false-colour artefact.", "Skin and retouch quality cannot be assessed reliably until colour is neutral."] }, experienceQA: { status: "UNKNOWN" as const, criticalFailures: [], notes: ["Static preview only."] }, iterations: [{ number: 0, changes: ["Original LUT", "Conservative RetouchVisual values"], visualScore: 1.4 }], finalPropertyValues: Object.entries({ faceIndex: 0, softSkinIntensity: 0.25, teethWhiteningIntensity: 0.1, sharpenEyeIntensity: 0.2, eyeWhiteningIntensity: 0.08 }).map(([property, value]) => ({ target: "Natural Beauty Retouch", property, value })), observedOutcomes: [{ statement: "Iteration 0 produced an extreme green and magenta false-colour artefact.", scope: "One Lens Studio preview using Idle.mp4, one face, one lighting condition." }], finalOutcome: "TRAINING_ONLY" as const, completedAt: null },
};

export const naturalBeautyIteration1VisualQA: VisualQAReport = {
  status: "WARNING", provider: "OpenAI", providerState: "REAL", model: "gpt-5.6-terra", mock: false, cached: false, previewAvailable: true, overallScore: 8.2, confidence: 0.78, iterationRecommended: true, iterationPriority: "LOW", message: "AI visual assessment completed. Human judgement remains authoritative.",
  scores: { specificationMatch: 8.2, visualCoherence: 8.5, composition: 8.4, colour: 8.3, lighting: 8.4, readability: null, polish: 8.4, categorySpecificQuality: 7.9 },
  applicability: { specificationMatch: "APPLICABLE", visualCoherence: "APPLICABLE", composition: "APPLICABLE", colour: "APPLICABLE", lighting: "APPLICABLE", readability: "NOT_APPLICABLE", polish: "APPLICABLE", categorySpecificQuality: "APPLICABLE" },
  strengths: [
    "The face has a believable shape with no visible facial warping.",
    "The complexion is warm-neutral and plausible in direct daylight.",
    "Highlights and shadow detail are retained.",
    "No false-colour overlay, face-boundary failure, halo, or other obvious artefact is visible.",
    "The restrained smoothing and natural colour look polished without appearing strongly artificial.",
  ],
  findings: [
    { type: "CATEGORY", severity: "LOW", description: "The central cheeks and forehead look very smooth at this preview scale.", evidence: "Natural tonal variation and small facial details remain, but little pore-level texture is visible compared with the hair and clothing.", recommendedChange: "Use a closer preview before deciding whether to reduce skin softening." },
    { type: "CATEGORY", severity: "LOW", description: "The eye treatment cannot be evaluated in this frame.", evidence: "Both eyes are closed.", recommendedChange: "Capture a well-lit preview with open eyes." },
    { type: "CATEGORY", severity: "LOW", description: "The teeth treatment cannot be evaluated in this frame.", evidence: "The mouth is closed and no teeth are visible.", recommendedChange: "Capture a natural smile preview under the same lighting." },
  ],
  limitations: ["This image cannot establish the treatment relative to an untreated baseline.", "A static preview cannot verify runtime stability or movement.", "One face and lighting condition cannot establish broader performance.", "Eye and teeth treatment are not judgeable in this frame.", "No public-facing text is present, so readability is not applicable."],
};

export const naturalBeautyIteration1 = {
  status: "AWAITING_HUMAN_REVIEW" as const,
  previewPath: "/natural-beauty-iteration-1.png",
  technicalQA: "PASS" as const,
  isolationQA: "PASS" as const,
  visualQA: naturalBeautyIteration1VisualQA,
  projectFingerprint: "9f71141d7e38d9d4e5ff605d2a6f5ac5c19b918683fb2d881eb60b7dc5135af3",
  executedChange: {
    object: "Natural Beauty Grade",
    component: "PostEffectVisual",
    componentId: "ea8d555f-5f9d-4e8a-bb65-1769008c0d9e",
    property: "enabled",
    before: true,
    after: false,
  },
  preservedPropertyValues: naturalBeautyIteration0.propertyValues,
  runtimeFindings: [] as string[],
  note: "The project identity fingerprint is unchanged because it records scene and asset identity, not component property values. MCP readback records the enabled value change.",
  controlledEvidenceQA: { openEyes: naturalBeautyOpenEyesQA, visibleTeeth: naturalBeautyVisibleTeethQA },
  automatedQualityAssessment: naturalBeautyAutomatedQualityAssessment,
  learningRecord: {
    ...naturalBeautyIteration0.learningRecord,
    successfulOperations: [...naturalBeautyIteration0.learningRecord.successfulOperations, "Disable the faulty colour-grade component", "Capture Iteration 1 preview", "Run real OpenAI Vision QA for Iteration 1", "Capture controlled Open Eyes and Visible Teeth previews", "Run scoped real OpenAI Vision QA for both controlled previews"],
    visualQA: { status: "PASS" as const, score: 8.2, notes: ["The primary Iteration 1 preview scored 8.2.", "Open Eyes evidence scored 8.3 and found no material eye-treatment issue.", "Visible Teeth evidence scored 8.8 and found no material teeth-treatment issue.", "Close-range skin texture remains unsupported."] },
    experienceQA: { status: "WARNING" as const, criticalFailures: [], notes: [naturalBeautyAutomatedQualityAssessment.experienceReason] },
    iterations: [...naturalBeautyIteration0.learningRecord.iterations, { number: 1, changes: ["Set Natural Beauty Grade PostEffectVisual.enabled from true to false"], visualScore: 8.2 }],
    finalPropertyValues: [{ target: "Natural Beauty Grade", property: "enabled", value: false }, ...naturalBeautyIteration0.learningRecord.finalPropertyValues],
    observedOutcomes: [...(naturalBeautyIteration0.learningRecord.observedOutcomes ?? []), { statement: "Iteration 1 removed the full-frame false-colour artefact and received an 8.2 Visual QA score with low-severity evidence gaps.", scope: "One Lens Studio preview using Idle.mp4, one face, one daylight condition, closed eyes, and no visible teeth." }, { statement: "At the current values, the Open Eyes preview showed natural eye brightness and definition with no visible halos or eye artefacts.", scope: "One supplied Lens Studio preview, one face, one lighting condition, and one camera source. This does not establish close-range skin texture or broader performance." }, { statement: "At teethWhiteningIntensity 0.10, the Visible Teeth preview showed warm off-white tonal variation with no visible clipping or whitening artefacts.", scope: "One supplied Lens Studio preview, one face, one lighting condition, and one camera source. This does not establish results for other faces, skin tones, lighting, or cameras." }],
    knowledgeGaps: [{ topic: "Original LUT generation and encoding", status: "KNOWLEDGE_GAP" as const, reason: "The generated 256 by 16 LUT produced false colour. The required Lens Studio LUT packing and channel encoding were not verified." }],
    futureLearningTargets: ["Lens Studio LUT Construction and Encoding"],
    finalOutcome: "TRAINING_ONLY" as const,
    completedAt: null,
  },
};
