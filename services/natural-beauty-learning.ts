import { learningConfig } from "../config/learning";
import type { CapabilityKnowledgeEntry, LearningRecord, PatternCard, TrainingExercise } from "../types/learning";
import type { LearningCompletionEvidence, LearningEvidenceFeedback, NaturalBeautyLearningPlan, NaturalBeautySandboxPreflight, NaturalBeautySpecification, PatternDecision, RetouchControlProposal } from "../types/natural-beauty-learning";

const requiredPresets = ["BeautyPreset", "FaceRetouchObjectPreset", "SmoothingPreset", "FaceMeshObjectPreset", "HeadBindingObjectPreset"] as const;
const baselineFingerprint = "7cbeeba095c103f4f0f3d48599ceeb69745cb8afe3eae7caced3efc6093753aa";

export function retrieveNaturalBeautyPatterns(cards: PatternCard[]) {
  const retrieved = requiredPresets.map((name) => cards.find((card) => card.officialResourceName === name));
  const missing = requiredPresets.filter((_name, index) => !retrieved[index]);
  if (missing.length) throw new Error(`Natural Beauty requires these verified Pattern Cards before specification: ${missing.join(", ")}.`);
  return retrieved as PatternCard[];
}

export function decideNaturalBeautyPatterns(cards: PatternCard[]): PatternDecision[] {
  const byName = new Map(cards.map((card) => [card.officialResourceName, card]));
  const decision = (presetName: string, value: PatternDecision["decision"], reason: string): PatternDecision => ({ patternCardId: byName.get(presetName)?.id ?? "MISSING", presetName, decision: value, reason });
  return [
    decision("BeautyPreset", "USE", "Use the verified PostEffectVisual, material, screen-texture, and LUT architecture. Do not copy Beauty.png as the final creative LUT."),
    decision("FaceRetouchObjectPreset", "USE", "Use the verified RetouchVisual component and its named controls with new conservative design values."),
    decision("SmoothingPreset", "INSUFFICIENT_EVIDENCE", "The graph exposes undocumented ports and no verified labeled intensity, blend, or face-mask control. Exclude it from this build."),
    decision("FaceMeshObjectPreset", "DO_NOT_USE", "Natural Beauty does not require a face mesh, makeup surface, mask placement, or face transformation."),
    decision("HeadBindingObjectPreset", "DO_NOT_USE", "Natural Beauty does not require a head anchor, 3D attachment, or face occluder."),
  ];
}

export const naturalBeautyRetouchValues: RetouchControlProposal[] = [
  { property: "faceIndex", officialPresetValue: 0, proposedValue: 0, relation: "EQUAL", reason: "Keep the verified first-face target. This does not change face shape or appearance.", evidenceStatus: "PROPOSED_DESIGN_VALUE" },
  { property: "softSkinIntensity", officialPresetValue: 1, proposedValue: 0.25, relation: "LOWER", reason: "Use a conservative starting point to protect visible skin texture. Visual QA must determine the actual result.", evidenceStatus: "PROPOSED_DESIGN_VALUE" },
  { property: "teethWhiteningIntensity", officialPresetValue: 0.4000000059604645, proposedValue: 0.1, relation: "LOWER", reason: "Avoid a whitening-heavy appearance. This value is a design proposal, not a verified aesthetic outcome.", evidenceStatus: "PROPOSED_DESIGN_VALUE" },
  { property: "sharpenEyeIntensity", officialPresetValue: 0.699999988079071, proposedValue: 0.2, relation: "LOWER", reason: "Keep eye treatment restrained and avoid exaggerated eyes. Visual QA must check visible sharpness.", evidenceStatus: "PROPOSED_DESIGN_VALUE" },
  { property: "eyeWhiteningIntensity", officialPresetValue: 0.30000001192092896, proposedValue: 0.08, relation: "LOWER", reason: "Keep eye whites natural and reduce the risk of an artificial look.", evidenceStatus: "PROPOSED_DESIGN_VALUE" },
];

export function createNaturalBeautySpecification(retrievedCards: PatternCard[], knowledge: CapabilityKnowledgeEntry[]): NaturalBeautySpecification {
  const decisions = decideNaturalBeautyPatterns(retrievedCards);
  const selectedKnowledge = knowledge.filter((entry) => entry.status === "VERIFIED" && ["beauty-preset-component", "beauty-preset-material", "beauty-preset-lut", "batch-retouch-component"].includes(entry.id));
  if (selectedKnowledge.length !== 4) throw new Error("Natural Beauty requires the verified colour-correction and RetouchVisual capability entries before specification.");
  return {
    id: "learning-spec-001-natural-beauty", title: "Natural Beauty", concept: "Create an original, subtle, camera-ready beauty treatment that keeps skin texture and natural colour.", creativeObjective: "Make the camera image look soft, polished, and photographic without obvious facial alteration.", categories: ["Beauty", "Skin and complexion", "Aesthetic camera effects"], targetPlatform: "Snapchat", interactionType: "Always-on camera treatment",
    userExperience: ["The Lens opens with the front camera.", "The treatment starts at once.", "The user can record a photo or video."],
    sceneRequirements: [
      { name: "Natural Beauty Grade", purpose: "Apply the original neutral photographic LUT.", requiredComponents: ["PostEffectVisual"] },
      { name: "Natural Beauty Retouch", purpose: "Apply conservative face retouch controls.", requiredComponents: ["RetouchVisual"] },
    ],
    assetRequirements: [
      { name: "Natural Beauty LUT", kind: "texture", source: "generated", permissionRequired: false },
      { name: "Natural Beauty Colour Material", kind: "material", source: "generated", permissionRequired: false },
      { name: "Screen Texture", kind: "texture", source: "lens_studio", permissionRequired: false },
    ],
    textRequirements: [], behaviourRequirements: ["Keep the treatment active while the Lens runs.", "Do not change face shape.", "Keep skin texture visible.", "Keep eye and teeth treatment subtle."], scriptRequirements: [], audioRequirements: ["Do not add audio."],
    visualDirection: ["Keep colour neutral.", "Avoid a pink or magenta cast.", "Keep highlights visible.", "Keep shadows open.", "Keep natural skin texture.", "Use a subtle photographic finish."],
    technicalConstraints: ["Use only capabilities exposed by the connected Lens Studio MCP server.", "Do not write undocumented shader ports.", "Do not include SmoothingPreset, FaceMeshObjectPreset, or HeadBindingObjectPreset mechanisms.", "Do not publish or submit the Lens.", "Stop if the sandbox preflight or exact baseline check fails."],
    qaRequirements: ["Technical QA must pass before preview analysis.", "Specification QA must pass.", "Capture a real Iteration 0 preview.", "Run the configured real OpenAI Vision provider.", "Visual QA must check the category-aware Natural Beauty criteria.", "Human review is required."],
    status: "AWAITING_HUMAN_CONFIRMATION", humanConfirmed: false, executionEnabled: false, retrievedPatternCardIds: retrievedCards.map((card) => card.id), patternDecisions: decisions, verifiedCapabilitiesUsed: selectedKnowledge,
    proposedComponents: [
      { name: "Natural Beauty Grade", type: "PostEffectVisual", sourcePattern: "BeautyPreset", purpose: "Apply a new original LUT through the verified colour-correction structure." },
      { name: "Natural Beauty Retouch", type: "RetouchVisual", sourcePattern: "FaceRetouchObjectPreset", purpose: "Apply conservative values through verified named controls." },
    ],
    proposedPropertyValues: naturalBeautyRetouchValues,
    colourDecision: { option: "B_ORIGINAL_NATURAL_BEAUTY_LUT", decision: "Create an original Natural Beauty LUT. Use BeautyPreset only as technical architecture evidence. Do not reuse Beauty.png as the final LUT.", provenance: "Effect Lab will generate a new 256 by 16 LUT from an identity LUT during the confirmed build. The asset record will identify Effect Lab as generator and Learning Build 001 as its source.", constraints: ["Keep the neutral axis neutral.", "Do not add a magenta bias.", "Use only a small saturation adjustment.", "Preserve shadow detail.", "Use a gentle highlight shoulder.", "Do not claim success before Visual QA."], aestheticStatus: "NOT_YET_EVALUATED" },
    creativeAssumptions: ["A conservative colour grade and reduced retouch values are suitable starting points for the stated direction.", "A static front-camera preview can provide useful initial visual evidence."],
    technicalAssumptions: ["The execution-time MCP capability map will expose supported operations for creating the required scene objects and assets.", "The verified PostEffectVisual architecture can reference an original LUT with the same dimensions as the observed technical source.", "Every proposed property must be read back after application."],
    knownUnknowns: ["The aesthetic result of each proposed RetouchVisual value is not yet verified.", "The combined appearance of the new LUT and RetouchVisual is unknown.", "Results across faces, skin tones, lighting, and cameras are unknown.", "Experience behavior beyond a static preview is not yet proved.", "Execution operations remain disabled until capabilities are rediscovered and a person confirms the specification."],
    visualQACriteria: ["Natural skin appearance", "Colour neutrality", "No excessive smoothing", "Visible skin texture", "Highlight retention", "Shadow retention", "Subtle eye treatment", "Subtle teeth treatment where visible", "Photographic polish", "No obvious artefacts", "Overall coherence", "Noticeable but subtle treatment", "No critical visual findings", "Target overall score of at least 8.0 without score manipulation"],
    experienceQACriteria: ["The treatment starts without an extra action.", "The first action is clear.", "The camera remains usable for repeated photos and videos.", "No interaction failure is visible.", "Mark behavior UNKNOWN where static preview evidence is insufficient."],
    originalityStatement: "Natural Beauty is a new restrained configuration. It uses verified component structures as technical evidence, creates a new LUT, proposes new retouch values, and does not copy the BeautyPreset look, Beauty.png, or preset defaults.",
    rollbackPlan: ["Capture and compare the exact verified baseline fingerprint before construction.", "Record every created scene-object and asset identifier.", "If reset is required, delete only the recorded build delta.", "Recompute the fingerprint after reset.", "Report rollback as successful only if the fingerprint matches exactly.", "Stop without broader cleanup if the exact baseline is not restored."],
    sandboxRequirements: { lensName: "Effect Lab Sandbox", projectFolder: "/Users/debbie/Documents/Effect Lab Training Sandbox", connectionSource: "MANUAL_CONFIG", baselineFingerprint, requireNoUnexpectedObjects: true, requireLiveMcp: true },
  };
}

export function createNaturalBeautyLearningPlan(cards: PatternCard[], knowledge: CapabilityKnowledgeEntry[]): NaturalBeautyLearningPlan {
  const retrievedCards = retrieveNaturalBeautyPatterns(cards);
  const specification = createNaturalBeautySpecification(retrievedCards, knowledge);
  const selected = specification.patternDecisions.filter((entry) => entry.decision === "USE");
  const exercise: TrainingExercise = { id: "exercise-001-natural-beauty", objective: "Build and evaluate an original subtle beauty treatment from verified learning evidence.", skill: "Apply verified colour-correction and face-retouch structures without copying preset creative defaults.", sourcePatternCardIds: selected.map((entry) => entry.patternCardId), creativeBrief: specification.creativeObjective, buildSpecification: specification, qaRequirements: [{ gate: "TECHNICAL", requirement: "Compile without Lens errors." }, { gate: "SPECIFICATION", requirement: "Match the confirmed Natural Beauty specification." }, { gate: "VISUAL", requirement: "Use a real preview and the configured OpenAI Vision provider." }, { gate: "EXPERIENCE", requirement: "Record evidence or preserve UNKNOWN." }, { gate: "HUMAN", requirement: "A person must approve the final result." }], difficulty: "FOUNDATION", originalityRequirement: specification.originalityStatement, originalityStatus: "ORIGINAL", workflowStatus: "AWAITING_CONFIRMATION", humanConfirmed: false };
  const draftRecord = createNaturalBeautyLearningRecord(specification, exercise);
  return { id: "learning-build-001-natural-beauty", retrievalCompletedBeforeSpecification: true, retrievedCards, specification, exercise, draftRecord, learningEffectiveness: { retrievedPatternCards: retrievedCards.length, selectedPatternCards: selected.length, unsupportedAssumptionsAvoided: ["Excluded SmoothingPreset because its required controls are not sufficiently understood.", "Excluded FaceMeshObjectPreset because no mesh is required.", "Excluded HeadBindingObjectPreset because no head attachment is required.", "Did not interpret undocumented shader ports.", "Did not reuse Beauty.png as the final creative LUT."], successfulLearnedOperations: [], failedOperations: [], qaResult: "NOT_RUN", humanResult: "PENDING", universalScore: null } };
}

export function validateNaturalBeautyPreflight(specification: NaturalBeautySpecification, input: NaturalBeautySandboxPreflight) {
  const reasons: string[] = [];
  if (!input.humanConfirmed) reasons.push("A person must confirm the Natural Beauty specification.");
  if (input.sandboxStatus !== "VERIFIED") reasons.push("The learning sandbox must be VERIFIED.");
  if (input.lensName !== specification.sandboxRequirements.lensName) reasons.push("The live Lens name does not match.");
  if (input.projectFolder !== specification.sandboxRequirements.projectFolder) reasons.push("The project folder does not match.");
  if (input.connectionSource !== "MANUAL_CONFIG") reasons.push("The connection source must be MANUAL_CONFIG.");
  if (!input.liveMcpResponded) reasons.push("The live MCP endpoint must respond.");
  if (input.currentFingerprint !== specification.sandboxRequirements.baselineFingerprint) reasons.push("The exact baseline fingerprint does not match.");
  if (input.unexpectedObjects.length) reasons.push(`Unexpected scene objects are present: ${input.unexpectedObjects.join(", ")}.`);
  return { allowed: reasons.length === 0, reasons };
}

export function createNaturalBeautyLearningRecord(specification: NaturalBeautySpecification, exercise: TrainingExercise): LearningRecord {
  return { id: "learning-record-001-natural-beauty", exerciseId: exercise.id, usedPatternCardIds: specification.patternDecisions.filter((entry) => entry.decision === "USE").map((entry) => entry.patternCardId), retrievedPatternCardIds: specification.retrievedPatternCardIds, rejectedPatternDecisions: specification.patternDecisions.filter((entry) => entry.decision !== "USE").map((entry) => ({ patternCardId: entry.patternCardId, decision: entry.decision, reason: entry.reason })), buildPlan: specification, initialPropertyValues: specification.proposedPropertyValues.map((entry) => ({ target: "Natural Beauty Retouch", property: entry.property, value: entry.proposedValue })), successfulOperations: [], failedOperations: [], compileResult: "NOT_RUN", fixes: [], visualQA: { status: "UNKNOWN", score: null, notes: ["No preview exists. Visual QA has not run."] }, experienceQA: { status: "UNKNOWN", criticalFailures: [], notes: ["No runtime experience evidence exists."] }, humanReview: { decision: "PENDING", notes: [] }, finalOutcome: "TRAINING_ONLY", reusableLessons: [], iterations: [], finalPropertyValues: [], observedOutcomes: [], createdAt: "2026-08-14T14:40:00.000Z", completedAt: null };
}

export function separateLearningEvidence(input: { property: string; value: number; aestheticObservation: string; previewScope: string }): LearningEvidenceFeedback {
  return { technicalKnowledge: [{ statement: `RetouchVisual.${input.property} accepted the value ${input.value}.`, evidenceLevel: "PROPERTY_VERIFIED", scope: "The connected Lens Studio version and this build." }], observedAestheticEvidence: [{ statement: input.aestheticObservation, evidenceLevel: "OBSERVED_OUTCOME", scope: input.previewScope }] };
}

export function canCompleteNaturalBeautyExercise(evidence: LearningCompletionEvidence) {
  const reasons: string[] = [];
  if (evidence.technicalQA !== "PASS") reasons.push("Technical QA must pass.");
  if (evidence.specificationQA !== "PASS") reasons.push("Specification QA must pass.");
  if (!evidence.previewCaptured) reasons.push("A real preview must be captured.");
  if (evidence.visualQA !== "PASS" || evidence.visualScore === null) reasons.push("Visual QA must complete with real evidence.");
  if (evidence.criticalVisualFindings.length) reasons.push("Critical visual findings must be resolved.");
  if (evidence.humanDecision !== "APPROVED") reasons.push("Human review must approve the exercise.");
  return { complete: reasons.length === 0, curriculumCompleted: reasons.length === 0 ? 1 : 0, reasons };
}

export function naturalBeautyPublishGate(evidence: LearningCompletionEvidence) {
  const completion = canCompleteNaturalBeautyExercise(evidence);
  const reasons = [...completion.reasons];
  if (evidence.visualScore === null || evidence.visualScore < learningConfig.publishCandidate.minimumVisualScore) reasons.push(`Visual QA must score at least ${learningConfig.publishCandidate.minimumVisualScore}.`);
  return { outcome: reasons.length ? "TRAINING_ONLY" as const : "PUBLISH_CANDIDATE" as const, reasons };
}
