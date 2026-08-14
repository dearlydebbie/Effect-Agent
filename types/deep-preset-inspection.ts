import type { CapabilityKnowledgeEntry, ObservedTechnicalElement, PatternCard } from "./learning";
import type { PatternEvidenceLevel } from "./preset-census";

export type ResetAssessment = "SAFE_AUTOMATIC_RESET" | "SAFE_MANUAL_RESET" | "NO_VERIFIED_RESET";

export interface VerifiedInspectionItem extends ObservedTechnicalElement {
  evidenceLevel: PatternEvidenceLevel;
  properties?: Array<{ name: string; value: unknown; evidenceLevel: PatternEvidenceLevel }>;
}

export interface DeepPresetInspection {
  id: string;
  presetName: "BeautyPreset";
  inspectionLevel: "DEEPLY_INSPECTED";
  capturedAt: string;
  sandbox: {
    status: "VERIFIED";
    lensName: string;
    projectFolder: string;
    connectionSource: "MANUAL_CONFIG";
    capabilities: number;
    softFlashMarkersAbsentBeforeInstantiation: boolean;
    baselineFingerprint: string;
    resultFingerprint: string;
  };
  confirmation: { confirmed: true; action: string; risk: string };
  instantiation: { success: true; operation: string; returnedId: string };
  sceneObjects: VerifiedInspectionItem[];
  components: VerifiedInspectionItem[];
  assets: VerifiedInspectionItem[];
  materials: VerifiedInspectionItem[];
  shaders: VerifiedInspectionItem[];
  textures: VerifiedInspectionItem[];
  scripts: VerifiedInspectionItem[];
  dependencies: Array<{ from: string; to: string; evidenceLevel: PatternEvidenceLevel }>;
  runtime: { compile: "PASSED"; errors: string[]; warnings: string[]; deprecations: string[]; findings: string[]; behaviorEvidence: PatternEvidenceLevel };
  previewPath: string | null;
  patternCardBeforeConfidence: PatternCard["confidence"];
  patternCard: PatternCard;
  knowledge: CapabilityKnowledgeEntry[];
  remainingUnknown: string[];
  resetStatus: ResetAssessment;
  resetReason: string;
  resetEvidence: { confirmedAt: string; deletedSceneObjectIds: string[]; deletedAssetIds: string[]; baselineRestored: boolean } | null;
  lensStudioModified: boolean;
}

export const beautyFaceBatchOrder = ["FaceRetouchObjectPreset", "SmoothingPreset", "FaceMeshObjectPreset", "HeadBindingObjectPreset"] as const;
export type BeautyFacePresetName = typeof beautyFaceBatchOrder[number];

export interface BatchPresetInspection {
  presetName: BeautyFacePresetName;
  order: number;
  status: "COMPLETE" | "STOPPED";
  baselineFingerprint: string;
  resetFingerprint: string;
  resetMatchesBaseline: boolean;
  resetStatus: ResetAssessment;
  capturedAt: string;
  previewPath: string | null;
  sceneObjects: VerifiedInspectionItem[];
  components: VerifiedInspectionItem[];
  assets: VerifiedInspectionItem[];
  materials: VerifiedInspectionItem[];
  shaders: VerifiedInspectionItem[];
  textures: VerifiedInspectionItem[];
  scripts: VerifiedInspectionItem[];
  relationships: Array<{ from: string; to: string; evidenceLevel: PatternEvidenceLevel }>;
  runtime: { compile: "PASSED" | "FAILED"; errors: string[]; warnings: string[]; findings: string[]; behaviorEvidence: PatternEvidenceLevel };
  unknowns: string[];
  patternCardBeforeConfidence: PatternCard["confidence"];
  patternCard: PatternCard;
  knowledge: CapabilityKnowledgeEntry[];
}

export interface BeautyCapabilityMap {
  generatedAt: string;
  lensStudioVersion: string;
  inspectedPresets: string[];
  verifiedFacts: Array<{ area: string; finding: string; evidenceLevel: PatternEvidenceLevel; sources: string[] }>;
  inferredDesignUses: Array<{ use: string; basis: string; status: "INFERENCE" }>;
  limitations: string[];
  readiness: Array<{ category: "Beauty" | "Face Effects" | "Fashion / Accessories"; status: "READY" | "PARTIAL" | "NOT_READY"; reasons: string[] }>;
}
