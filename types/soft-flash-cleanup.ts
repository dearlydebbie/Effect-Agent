export type CleanupSafety = "SAFE_TO_REMOVE" | "SHARED_DEPENDENCY" | "NATURAL_BEAUTY_DEPENDENCY" | "UNKNOWN";

export interface CleanupReference {
  sourceId: string;
  sourceName: string;
  sourceType: string;
  property: string;
}

export interface SoftFlashCleanupCandidate {
  id: string;
  name: string;
  type: string;
  kind: "SCENE_OBJECT" | "COMPONENT" | "ASSET";
  path: string | null;
  parent: { id: string; name: string } | null;
  references: CleanupReference[];
  provenanceEvidence: string[];
  naturalBeautyReferenced: boolean;
  otherSandboxReference: boolean;
  deletionSafety: CleanupSafety;
  deletionReason: string;
}

export interface NaturalBeautyProtectedState {
  gradeObjectId: string | null;
  gradeComponentId: string | null;
  gradeEnabled: boolean | null;
  materialId: string | null;
  materialName: string | null;
  materialPath: string | null;
  lutId: string | null;
  lutName: string | null;
  lutPath: string | null;
  retouchObjectId: string | null;
  retouchComponentId: string | null;
  retouchEnabled: boolean | null;
  faceIndex: number | null;
  softSkinIntensity: number | null;
  teethWhiteningIntensity: number | null;
  sharpenEyeIntensity: number | null;
  eyeWhiteningIntensity: number | null;
}

export interface SoftFlashCleanupOperation {
  itemId: string;
  itemName: string;
  itemType: string;
  operation: "DELETE_SCENE_OBJECT" | "DELETE_ASSET";
  reason: string;
  references: CleanupReference[];
  expectedEffect: string;
  reversible: false;
}

export interface SoftFlashCleanupPlan {
  capturedAt: string;
  status: "READY_FOR_CONFIRMATION" | "NO_SAFE_ITEMS" | "BLOCKED";
  connectionState: string;
  lensName: string | null;
  projectFolder: string | null;
  projectIdentityFingerprint: string | null;
  currentBuildStateFingerprint: string | null;
  expectedBuildStateFingerprint: string;
  naturalBeauty: NaturalBeautyProtectedState;
  candidates: SoftFlashCleanupCandidate[];
  operations: SoftFlashCleanupOperation[];
  planFingerprint: string | null;
  blockers: string[];
  requiresHumanConfirmation: true;
  executionPerformed: false;
  lensStudioModified: false;
  openAICalled: false;
  published: false;
}

export interface SoftFlashCleanupExecution {
  confirmedPlanFingerprint: string;
  startedAt: string;
  completedAt: string;
  before: SoftFlashCleanupPlan;
  deleted: Array<{ operation: SoftFlashCleanupOperation["operation"]; itemId: string; itemName: string; success: boolean; message: string | null }>;
  compile: { passed: boolean; result: unknown };
  runtime: { newErrorsOrWarnings: string[]; result: unknown };
  after: SoftFlashCleanupPlan;
  naturalBeautyUnchanged: boolean;
  buildStateFingerprint: string | null;
  expectedBuildStateFingerprint: string;
  projectIdentityFingerprint: string | null;
  restoration: "EXACT_RESTORATION" | "SEMANTIC_RESTORATION" | "STATE_MISMATCH";
  sandboxStatus: "VERIFIED" | "MISMATCH" | "UNKNOWN";
  humanReviewReady: boolean;
  lensStudioModified: boolean;
  openAICalled: false;
  published: false;
}

export interface NaturalBeautyFinalizationRecord {
  buildId: "learning-build-001-natural-beauty";
  verifiedAt: string;
  restoration: "SEMANTIC_RESTORATION" | "STATE_MISMATCH";
  cleanupOperationCount: 7;
  cleanupTargetsGone: boolean;
  compilePassed: boolean;
  runtimeFindings: Array<{ classification: "ERROR" | "WARNING" | "DEPRECATION" | "INFO"; message: string }>;
  blockingRuntimeErrors: string[];
  naturalBeautyUnchanged: boolean;
  buildStateFingerprint: string | null;
  expectedBuildStateFingerprint: string;
  projectIdentityFingerprint: string | null;
  historicalProjectIdentityFingerprint: string;
  qa: { technical: "PASS"; specification: "PASS"; visual: "PASS"; unresolvedCriticalFindings: string[] };
  humanReviewReady: boolean;
  lensStudioCreativeValuesModified: false;
  openAICalled: false;
  published: false;
}
