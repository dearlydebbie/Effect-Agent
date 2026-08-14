import type { Category, Idea, QAResult } from "./domain";
import type { LensBuildSpecification } from "./lens-build";

export interface CreativeDirection {
  id: string;
  ideaId: string;
  categories: Category[];
  visualObjective: string;
  intendedFeeling: string;
  focalPoint: string;
  composition: string[];
  colourTreatment: string[];
  lightingTreatment: string[];
  materialDirection: string[];
  motionDirection: string[];
  interactionBehaviour: string[];
  timing: string[];
  intensity: string[];
  restraint: string[];
  visualReferences: string[];
  elementsToAvoid: string[];
  successCriteria: string[];
  categoryCriteria: string[];
}

export type QAProblemSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type VisionProviderState = "REAL" | "MOCK" | "UNAVAILABLE";
export type VisualCriterionApplicability = "APPLICABLE" | "NOT_APPLICABLE";
export type VisualFindingType = "SPECIFICATION" | "COMPOSITION" | "COLOUR" | "LIGHTING" | "READABILITY" | "POLISH" | "CATEGORY" | "ARTEFACT";
export interface VisualQAFinding { type: VisualFindingType; severity: QAProblemSeverity; description: string; evidence: string; recommendedChange: string }
export interface VisualQAScores {
  specificationMatch: number | null;
  visualCoherence: number | null;
  composition: number | null;
  colour: number | null;
  lighting: number | null;
  readability: number | null;
  polish: number | null;
  categorySpecificQuality: number | null;
}
export interface VisualQAReport {
  status: QAResult;
  provider: string;
  providerState: VisionProviderState;
  model: string | null;
  mock: boolean;
  scores: VisualQAScores;
  applicability: Record<keyof VisualQAScores, VisualCriterionApplicability>;
  strengths: string[];
  findings: VisualQAFinding[];
  limitations: string[];
  confidence: number | null;
  overallScore: number | null;
  iterationRecommended: boolean;
  iterationPriority: "LOW" | "MEDIUM" | "HIGH" | "NONE";
  previewAvailable: boolean;
  cached: boolean;
  message: string;
}

export interface VisualQAInput {
  idea: Idea;
  creativeDirection: CreativeDirection;
  specification: LensBuildSpecification;
  previewDataUrl: string;
  category: Category[];
  intendedInteraction: string;
  technicalInformation: string[];
  previousIterations?: Array<{ number: number; score: number | null; changes: string[] }>;
}

export interface ExperienceCriterion {
  id: string;
  label: string;
  status: Exclude<QAResult, "UNAVAILABLE">;
  evidence: string | null;
}
export interface ExperienceQAReport { status: QAResult; criteria: ExperienceCriterion[]; message: string }

export interface IterationChange { target: string; problem: string; proposedChange: string; capability: string; bounded: true }
export interface IterationPlan {
  id: string;
  buildId: string;
  sourceVisualScore: number;
  changes: IterationChange[];
  preserve: string[];
  requiresHumanConfirmation: true;
}

export type TechnicalIterationStatus = "READY" | "NEEDS_HUMAN_INPUT" | "UNSUPPORTED" | "UNKNOWN";
export type TechnicalIterationConfidence = "HIGH" | "MEDIUM" | "LOW";
export interface TechnicalTargetReference { name: string; id: string; type: string; path: string | null }
export interface TechnicalBaselineValue {
  target: TechnicalTargetReference;
  propertyPath: string;
  value: unknown;
  evidenceSource: string;
}
export interface TechnicalIterationChange {
  id: string;
  category: string;
  visualProblem: string;
  visualRecommendation: string;
  targetObject: TechnicalTargetReference | null;
  targetComponentOrAsset: TechnicalTargetReference | null;
  targetPropertyOrParameter: string | null;
  currentValue: unknown;
  proposedValueOrOperation: string | null;
  reason: string;
  expectedVisualResult: string;
  confidence: TechnicalIterationConfidence;
  reversible: boolean;
  evidenceSources: string[];
  status: TechnicalIterationStatus;
}
export interface TechnicalIterationPlan {
  id: string;
  buildId: string;
  sourceVisualScore: number | null;
  createdAt: string;
  projectFingerprint: string;
  baseline: TechnicalBaselineValue[];
  changes: TechnicalIterationChange[];
  preserve: string[];
  readyOperationCount: number;
  requiresHumanConfirmation: true;
  executionEnabled: false;
  inspectionMessage: string;
}
export interface TechnicalValueDifference { propertyPath: string; before: unknown; after: unknown }
export interface IterationRecord {
  id: string;
  buildId: string;
  number: number;
  previewDataUrl: string | null;
  visualScore: number | null;
  changesMade: string[];
  technicalQA: QAResult;
  visualQA: QAResult;
  timestamp: string;
}

export type HumanReviewDecision = "APPROVE" | "NEEDS_CHANGES" | "REJECT";
export interface HumanFeedback {
  id: string;
  buildId: string;
  assessmentId: string | null;
  decision: HumanReviewDecision | null;
  feedback: string;
  assessmentAgreement: "AGREE" | "DISAGREE" | null;
  assessmentNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface QualityThresholds { strongCandidate: number; needsImprovement: number; maxVisualIterations: number; minimumMeaningfulImprovement: number }
