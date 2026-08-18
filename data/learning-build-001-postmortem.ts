import { naturalBeautyReviewIdentity } from "../config/builds";
import { naturalBeautyIteration1 } from "./natural-beauty-build-001";
import type { LearningBuildPostMortem, LearningVelocityRecord, PublicationCandidateRecord } from "../types/accelerated-learning";
import type { LearningRecord } from "../types/learning";

const contextualLimit = ["Observed in Natural Beauty only. Do not treat this as a universal beauty default."];

export const learningBuild001PostMortem: LearningBuildPostMortem = {
  buildId: naturalBeautyReviewIdentity.buildId,
  lensName: "Natural Beauty",
  trainingStatus: "TRAINING_COMPLETE",
  demonstratedCapabilities: [
    { capability: "Discover and invoke supported Lens Studio MCP capabilities", status: "VERIFIED_REUSABLE", evidence: "Learning Build 001 used live capability discovery and supported operations.", limits: ["Rediscover capabilities when the MCP surface changes."] },
    { capability: "Instantiate BeautyPreset and FaceRetouchObjectPreset technical structures", status: "VERIFIED_REUSABLE", evidence: "Both preset structures were instantiated, inspected, compiled, and isolated in the verified sandbox.", limits: ["The resulting creative appearance is contextual."] },
    { capability: "Read and set named RetouchVisual properties", status: "VERIFIED_REUSABLE", evidence: "Five named properties were written and read back successfully.", limits: ["Only the observed named properties are covered."] },
    { capability: "Compile, read runtime findings, and capture a preview", status: "VERIFIED_REUSABLE", evidence: "The final build compiled, runtime findings were classified, and controlled preview evidence was captured.", limits: ["A static preview does not prove all runtime behaviour."] },
    { capability: "Use the Natural Beauty RetouchVisual values", status: "VERIFIED_CONTEXTUAL", evidence: "The values produced the human-approved Natural Beauty result in the recorded previews.", limits: contextualLimit },
  ],
  constructionOperations: [
    { capability: "Create isolated preset-derived scene and asset deltas", status: "VERIFIED_REUSABLE", evidence: "The build used recorded created identifiers and preserved unrelated content.", limits: ["A structural divergence requires reinspection."] },
    { capability: "Disable PostEffectVisual.enabled", status: "VERIFIED_REUSABLE", evidence: "Natural Beauty Grade was changed from enabled to disabled and read back.", limits: ["The creative reason for disabling a component remains build-specific."] },
    { capability: "Generate and encode a Lens Studio LUT", status: "FAILED_PREVIOUSLY", evidence: "The current Effect Lab LUT construction/encoding method is unverified and produced a failed result.", limits: ["This does not show that LUT generation is impossible."] },
  ],
  editableProperties: Object.entries({ faceIndex: 0, softSkinIntensity: 0.25, teethWhiteningIntensity: 0.10, sharpenEyeIntensity: 0.20, eyeWhiteningIntensity: 0.08 }).map(([property, value]) => ({ component: "RetouchVisual", property, value, status: "VERIFIED_CONTEXTUAL" as const, evidence: "Human-approved Natural Beauty Iteration 1 readback and preview evidence." })),
  failedApproaches: ["The original generated LUT produced severe green and magenta false colour.", "The first material duplication attempt reused the source identifier and failed Specification QA."],
  visualQAFindings: ["Disabling the faulty colour grade removed the full-frame false colour.", "The final result kept believable facial shape, neutral colour, and controlled highlights.", "Open Eyes and Visible Teeth previews found no material whitening, halo, clipping, or coherence issue in those supplied images.", "Close-range skin texture evidence remains unavailable."],
  technicalQAFindings: ["The approved Iteration 1 build compiled.", "Technical QA and Specification QA passed.", "No relevant runtime ERROR blocked the approved build."],
  humanReviewFindings: ["A person approved Learning Build 001.", "Approval completed training only and did not publish the Lens."],
  restorationLessons: ["Exact reset worked for controlled preset trials when the complete delta was recorded.", "The final approved build used a verified semantic restoration after the approved Soft Flash cleanup.", "Do not claim exact rollback when only semantic restoration is proved."],
  limitations: ["The evidence covers supplied previews, one build, and the inspected Lens Studio version.", "Static previews do not prove movement, startup, recording, reset behaviour, or all camera conditions."],
  unresolvedKnowledgeGaps: ["Generalisation across faces", "Generalisation across skin tones", "Generalisation across lighting", "LUT construction and encoding", "Exact behaviour of undocumented shader inputs"],
};

export const naturalBeautyCompletedRecord: LearningRecord = {
  ...naturalBeautyIteration1.learningRecord,
  humanReview: { decision: "APPROVED", notes: ["Learning Build 001 was approved by a person."] },
  finalOutcome: "PUBLISH_CANDIDATE",
  reusableLessons: learningBuild001PostMortem.demonstratedCapabilities.filter((entry) => entry.status === "VERIFIED_REUSABLE").map((entry) => entry.capability),
  completedAt: "2026-08-18",
};

export const naturalBeautyPublicationCandidate: PublicationCandidateRecord = {
  lensName: "Natural Beauty",
  buildId: naturalBeautyReviewIdentity.buildId,
  approvedBuildStateFingerprint: naturalBeautyReviewIdentity.buildStateFingerprint,
  qa: { technical: "PASS", specification: "PASS", visual: "PASS", experience: "WARNING", unresolvedCriticalFindings: [] },
  humanApproval: { decision: "APPROVED", scope: "Learning Build 001 build state only." },
  previewAssets: ["/natural-beauty-iteration-1.png", "/natural-beauty-evidence-open-eyes.png", "/natural-beauty-evidence-visible-teeth.png"],
  trainingStatus: "TRAINING_COMPLETE",
  publicationStatus: "PUBLISH_CANDIDATE",
  requiredSnapchatMetadataStillMissing: ["Final Snapchat category is not recorded.", "Final Lens icon is not recorded.", "Final submission description is not recorded."],
  submissionReadiness: "METADATA_REQUIRED",
  published: false,
  rewardsEligibility: "UNKNOWN",
};

export const learningBuild001Velocity: LearningVelocityRecord = {
  buildId: naturalBeautyReviewIdentity.buildId,
  planningDurationMinutes: null,
  constructionDurationMinutes: null,
  qaDurationMinutes: null,
  humanConfirmations: null,
  iterations: 2,
  mcpOperations: null,
  reusedVerifiedCapabilities: 4,
  newCapabilitiesLearned: 4,
  failuresEncountered: 2,
  firstPassSucceeded: false,
  finalResult: "APPROVED",
  newKnowledgeGaps: learningBuild001PostMortem.unresolvedKnowledgeGaps.length,
};
