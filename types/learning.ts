import type { Category, Idea, Platform, QAResult } from "./domain";
import type { LensBuildSpecification } from "./lens-build";

export type OfficialResourceSource = "OFFICIAL_SNAP" | "LOCAL_OFFICIAL_RESOURCE" | "USER_PROJECT" | "UNKNOWN";
export type OfficialResourceType = "TEMPLATE" | "PROJECT" | "PACKAGE" | "COMPONENT" | "BLOCK" | "MATERIAL" | "SHADER" | "SCRIPT" | "VISUAL_SCRIPT" | "GENAI" | "TRACKING" | "BUILT_IN_ASSET" | "SAMPLE_SCENE" | "UNKNOWN";
export type ResourceInspectionStatus = "DISCOVERED" | "INSPECTED" | "UNSUPPORTED" | "UNKNOWN";
export type KnowledgeStatus = "VERIFIED" | "PARTIAL" | "DEPRECATED" | "UNKNOWN";
export type OriginalityStatus = "ORIGINAL" | "TOO_SIMILAR" | "REVISE" | "UNKNOWN";
export type LearningOutcome = "TRAINING_ONLY" | "PUBLISH_CANDIDATE";
export type Suitability = "HIGH" | "MEDIUM" | "LOW" | "INELIGIBLE" | "UNKNOWN";
export type LearningWorkflowStatus = "DRAFT" | "AWAITING_CONFIRMATION" | "BUILDING" | "COMPILE_FAILED" | "QA_REQUIRED" | "HUMAN_REVIEW" | "COMPLETE";
export type LearningQAGate = "TECHNICAL" | "SPECIFICATION" | "VISUAL" | "EXPERIENCE" | "HUMAN";

export interface OfficialLearningResource {
  id: string;
  name: string;
  description: string | null;
  source: OfficialResourceSource;
  resourceType: OfficialResourceType;
  section: string | null;
  discoveredThrough: string;
  evidenceSource: string;
  automaticLearningEligible: boolean;
  inspectionStatus: ResourceInspectionStatus;
  rawMetadata?: Record<string, unknown>;
}

export interface ObservedTechnicalElement {
  name: string;
  type: string;
  id: string | null;
  path: string | null;
  evidenceSource: string;
}

export interface PatternCard {
  id: string;
  name: string;
  source: OfficialResourceSource;
  officialResourceName: string;
  officialResourceType: OfficialResourceType;
  categories: Array<Category | "UNKNOWN">;
  supportedPlatforms: Array<Platform | "UNKNOWN">;
  learningObjective: string;
  sceneStructure: Array<ObservedTechnicalElement | "UNKNOWN">;
  importantObjects: Array<ObservedTechnicalElement | "UNKNOWN">;
  importantComponents: Array<ObservedTechnicalElement | "UNKNOWN">;
  importantAssets: Array<ObservedTechnicalElement | "UNKNOWN">;
  importantMaterials: Array<ObservedTechnicalElement | "UNKNOWN">;
  importantScripts: Array<ObservedTechnicalElement | "UNKNOWN">;
  importantProperties: Array<{ target: string; property: string; currentValue: unknown; evidenceSource: string } | "UNKNOWN">;
  interactions: string[];
  triggers: string[];
  technicalNotes: string[];
  knownConstraints: string[];
  qualityNotes: string[];
  reusablePrinciples: string[];
  unsafeAssumptions: string[];
  confidence: "HIGH" | "MEDIUM" | "LOW";
  inspectedAt: string;
  sourcePresetId?: string;
  inspectionLevel?: "DISCOVERED" | "METADATA_INSPECTED" | "SCENE_INSPECTED" | "DEEPLY_INSPECTED";
  fieldEvidence?: Record<string, "METADATA_ONLY" | "SCENE_VERIFIED" | "PROPERTY_VERIFIED" | "BEHAVIOUR_VERIFIED" | "UNKNOWN">;
  categoryInferences?: string[];
}

export interface TrainingExercise {
  id: string;
  objective: string;
  skill: string;
  sourcePatternCardIds: string[];
  creativeBrief: string;
  buildSpecification: LensBuildSpecification;
  qaRequirements: Array<{ gate: LearningQAGate; requirement: string }>;
  difficulty: "FOUNDATION" | "INTERMEDIATE" | "ADVANCED";
  originalityRequirement: string;
  originalityStatus: OriginalityStatus;
  workflowStatus: LearningWorkflowStatus;
  humanConfirmed: boolean;
}

export interface OriginalityAssessment {
  status: OriginalityStatus;
  highestSimilarity: number | null;
  closestRecordId: string | null;
  reasons: string[];
  comparedRecordCount: number;
}

export interface LearningRecord {
  id: string;
  exerciseId: string;
  usedPatternCardIds: string[];
  buildPlan: LensBuildSpecification;
  successfulOperations: string[];
  failedOperations: string[];
  compileResult: "NOT_RUN" | "PASSED" | "FAILED";
  fixes: string[];
  visualQA: { status: QAResult; score: number | null; notes: string[] };
  experienceQA: { status: QAResult; criticalFailures: string[]; notes: string[] };
  humanReview: { decision: "PENDING" | "APPROVED" | "CHANGES_REQUESTED" | "REJECTED"; notes: string[] };
  finalOutcome: LearningOutcome;
  reusableLessons: string[];
  retrievedPatternCardIds?: string[];
  rejectedPatternDecisions?: Array<{ patternCardId: string; decision: "DO_NOT_USE" | "INSUFFICIENT_EVIDENCE"; reason: string }>;
  initialPropertyValues?: Array<{ target: string; property: string; value: unknown }>;
  iterations?: Array<{ number: number; changes: string[]; visualScore: number | null }>;
  finalPropertyValues?: Array<{ target: string; property: string; value: unknown }>;
  observedOutcomes?: Array<{ statement: string; scope: string }>;
  knowledgeGaps?: Array<{ topic: string; status: "KNOWLEDGE_GAP"; reason: string }>;
  futureLearningTargets?: string[];
  createdAt: string;
  completedAt: string | null;
}

export interface CapabilityKnowledgeEntry {
  id: string;
  capability: string;
  subjectType: "TOOL" | "COMPONENT" | "PROPERTY" | "OPERATION" | "LIMIT" | "VERSION_CHANGE";
  componentName: string | null;
  propertyPath: string | null;
  supportedOperations: string[];
  statement: string;
  status: KnowledgeStatus;
  evidenceSource: string | null;
  observedAt: string | null;
  lensStudioVersion: string | null;
  versionNotes: string[];
  limits: string[];
}

export interface RewardSuitabilityAssessment {
  topPerformerPotential: Suitability;
  lensPlusPotential: Suitability;
  reasons: string[];
  evidenceAvailable: boolean;
  disclaimer: string;
}

export interface CurriculumSlot {
  id: string;
  sequence: number;
  category: "Beauty" | "Randomisers" | "Games" | "Face effects" | "World AR" | "VFX" | "Fashion" | "Experimental";
  exerciseId: string | null;
  status: "UNASSIGNED" | "READY" | "IN_PROGRESS" | "COMPLETE" | "BLOCKED";
}

export interface LearningDashboardSummary {
  target: number;
  completed: number;
  inspectedResources: number;
  patternCards: number;
  verifiedCapabilities: number;
  publishCandidates: number;
  categoryProgress: Array<{ category: CurriculumSlot["category"]; completed: number; target: number }>;
}

export interface LearningCorpus {
  patternCards: PatternCard[];
  exercises: TrainingExercise[];
  records: LearningRecord[];
  knowledge: CapabilityKnowledgeEntry[];
}

export interface LearningPerformanceEvidence {
  id: string;
  learningRecordId: string;
  effectId: string;
  performanceRecordIds: string[];
  observedAt: string;
  sampleStartDate: string | null;
  sampleEndDate: string | null;
  analysisStatus: "NOT_ENOUGH_DATA" | "READY_FOR_HUMAN_ANALYSIS" | "HUMAN_REVIEWED";
  evidenceNotes: string[];
  recommendationImpact: "NONE" | "HUMAN_REVIEW_REQUIRED";
}

export interface OriginalityCorpus {
  officialResources: OfficialLearningResource[];
  exercises: TrainingExercise[];
  localIdeas: Idea[];
}
