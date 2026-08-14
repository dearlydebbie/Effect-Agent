import type { QAResult } from "./domain";
import type { LensBuildSpecification } from "./lens-build";
import type { CapabilityKnowledgeEntry, LearningRecord, PatternCard, TrainingExercise } from "./learning";

export type PatternUseDecision = "USE" | "DO_NOT_USE" | "INSUFFICIENT_EVIDENCE";

export interface PatternDecision {
  patternCardId: string;
  presetName: string;
  decision: PatternUseDecision;
  reason: string;
}

export interface RetouchControlProposal {
  property: "faceIndex" | "softSkinIntensity" | "teethWhiteningIntensity" | "sharpenEyeIntensity" | "eyeWhiteningIntensity";
  officialPresetValue: number;
  proposedValue: number;
  relation: "LOWER" | "EQUAL";
  reason: string;
  evidenceStatus: "PROPOSED_DESIGN_VALUE";
}

export interface NaturalBeautySpecification extends LensBuildSpecification {
  status: "AWAITING_HUMAN_CONFIRMATION";
  humanConfirmed: false;
  executionEnabled: false;
  creativeObjective: string;
  retrievedPatternCardIds: string[];
  patternDecisions: PatternDecision[];
  verifiedCapabilitiesUsed: CapabilityKnowledgeEntry[];
  proposedComponents: Array<{ name: string; type: string; sourcePattern: string; purpose: string }>;
  proposedPropertyValues: RetouchControlProposal[];
  colourDecision: {
    option: "B_ORIGINAL_NATURAL_BEAUTY_LUT";
    decision: string;
    provenance: string;
    constraints: string[];
    aestheticStatus: "NOT_YET_EVALUATED";
  };
  creativeAssumptions: string[];
  technicalAssumptions: string[];
  knownUnknowns: string[];
  visualQACriteria: string[];
  experienceQACriteria: string[];
  originalityStatement: string;
  rollbackPlan: string[];
  sandboxRequirements: {
    lensName: "Effect Lab Sandbox";
    projectFolder: "/Users/debbie/Documents/Effect Lab Training Sandbox";
    connectionSource: "MANUAL_CONFIG";
    baselineFingerprint: string;
    requireNoUnexpectedObjects: true;
    requireLiveMcp: true;
  };
}

export interface NaturalBeautyLearningPlan {
  id: "learning-build-001-natural-beauty";
  retrievalCompletedBeforeSpecification: true;
  retrievedCards: PatternCard[];
  specification: NaturalBeautySpecification;
  exercise: TrainingExercise;
  draftRecord: LearningRecord;
  learningEffectiveness: {
    retrievedPatternCards: number;
    selectedPatternCards: number;
    unsupportedAssumptionsAvoided: string[];
    successfulLearnedOperations: string[];
    failedOperations: string[];
    qaResult: "NOT_RUN" | QAResult;
    humanResult: "PENDING" | "APPROVED" | "REVISE" | "REJECTED";
    universalScore: null;
  };
}

export interface NaturalBeautySandboxPreflight {
  sandboxStatus: "VERIFIED" | "MISMATCH" | "UNKNOWN";
  lensName: string | null;
  projectFolder: string | null;
  connectionSource: "MANUAL_CONFIG" | "AUTO_DISCOVERY" | "UNKNOWN";
  liveMcpResponded: boolean;
  currentFingerprint: string | null;
  unexpectedObjects: string[];
  humanConfirmed: boolean;
}

export interface LearningCompletionEvidence {
  technicalQA: QAResult;
  specificationQA: QAResult;
  previewCaptured: boolean;
  visualQA: QAResult;
  visualScore: number | null;
  criticalVisualFindings: string[];
  humanDecision: LearningRecord["humanReview"]["decision"];
}

export interface LearningEvidenceFeedback {
  technicalKnowledge: Array<{ statement: string; evidenceLevel: "PROPERTY_VERIFIED"; scope: string }>;
  observedAestheticEvidence: Array<{ statement: string; evidenceLevel: "OBSERVED_OUTCOME"; scope: string }>;
}
