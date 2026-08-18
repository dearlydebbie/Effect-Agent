import type { LensBuildSpecification } from "./lens-build";
import type { QAResult } from "./domain";

export type CapabilityReuseStatus = "VERIFIED_REUSABLE" | "VERIFIED_CONTEXTUAL" | "UNKNOWN" | "UNSUPPORTED" | "FAILED_PREVIOUSLY";
export type TrainingStatus = "TRAINING_INCOMPLETE" | "TRAINING_COMPLETE";
export type PublicationStatus = "NOT_CANDIDATE" | "PUBLISH_CANDIDATE" | "PUBLISHED";

export interface DemonstratedCapability {
  capability: string;
  status: CapabilityReuseStatus;
  evidence: string;
  limits: string[];
}

export interface LearningBuildPostMortem {
  buildId: string;
  lensName: string;
  trainingStatus: TrainingStatus;
  demonstratedCapabilities: DemonstratedCapability[];
  constructionOperations: DemonstratedCapability[];
  editableProperties: Array<{ component: string; property: string; value: number; status: CapabilityReuseStatus; evidence: string }>;
  failedApproaches: string[];
  visualQAFindings: string[];
  technicalQAFindings: string[];
  humanReviewFindings: string[];
  restorationLessons: string[];
  limitations: string[];
  unresolvedKnowledgeGaps: string[];
}

export interface ReinspectionContext {
  lensStudioVersionChangedMaterially: boolean;
  mcpCapabilitiesChanged: boolean;
  operationFailed: boolean;
  structureDiffersFromEvidence: boolean;
  dependsOnUnknownProperty: boolean;
  humanRequestedReinspection: boolean;
}

export type ConfirmationGate = "BUILD_SPECIFICATION" | "UNKNOWN_OR_DESTRUCTIVE_OPERATION" | "MATERIAL_CREATIVE_CHANGE" | "FINAL_HUMAN_REVIEW" | "PUBLISHING_OR_SUBMISSION";

export interface PublicationCandidateRecord {
  lensName: string;
  buildId: string;
  approvedBuildStateFingerprint: string;
  qa: { technical: QAResult; specification: QAResult; visual: QAResult; experience: QAResult; unresolvedCriticalFindings: string[] };
  humanApproval: { decision: "APPROVED"; scope: string };
  previewAssets: string[];
  trainingStatus: TrainingStatus;
  publicationStatus: PublicationStatus;
  requiredSnapchatMetadataStillMissing: string[];
  submissionReadiness: "METADATA_REQUIRED" | "READY_FOR_SUBMISSION_REVIEW";
  published: false;
  rewardsEligibility: "UNKNOWN";
}

export interface LearningVelocityRecord {
  buildId: string;
  planningDurationMinutes: number | null;
  constructionDurationMinutes: number | null;
  qaDurationMinutes: number | null;
  humanConfirmations: number | null;
  iterations: number;
  mcpOperations: number | null;
  reusedVerifiedCapabilities: number;
  newCapabilitiesLearned: number;
  failuresEncountered: number;
  firstPassSucceeded: boolean;
  finalResult: "APPROVED" | "REJECTED" | "INCOMPLETE";
  newKnowledgeGaps: number;
}

export interface LearningVelocitySummary {
  completed: number;
  target: 100;
  averageBuildTimeMinutes: number | null;
  averageHumanConfirmations: number | null;
  firstPassSuccessRate: number | null;
  averageIterations: number | null;
  verifiedReusableCapabilities: number;
  newKnowledgeGaps: number;
}

export interface LearningBuildSpecification extends LensBuildSpecification {
  buildId: string;
  status: "AWAITING_HUMAN_CONFIRMATION";
  confirmationAction: string;
  patternEvidence: Array<{ presetName: string; patternCardId: string; decision: "USE" | "DO_NOT_USE"; status: CapabilityReuseStatus; reason: string }>;
  plannedOperations: Array<{ operation: string; status: CapabilityReuseStatus; evidence: string; confirmationRequired: boolean }>;
  verifiedMakeupProperties: string[];
  unknowns: string[];
  additionalPresetInspectionRequired: boolean;
  inspectionDecisionReason: string;
}
