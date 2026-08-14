import type { OfficialResourceSource, PatternCard } from "./learning";

export const presetCategories = [
  "Beauty", "Makeup", "Camera / Colour", "Face Tracking", "Face Effects", "Hair",
  "Fashion / Accessories", "Try-On", "Randomiser", "Quiz", "Game", "Interaction",
  "Hand Tracking", "Body Tracking", "World AR", "Object Placement", "VFX", "Particles",
  "Audio", "Text", "Segmentation", "Machine Learning", "GenAI", "Transformation",
  "Utility", "Experimental", "Unknown",
] as const;

export type PresetCategory = (typeof presetCategories)[number];
export type PresetInspectionLevel = "DISCOVERED" | "METADATA_INSPECTED" | "SCENE_INSPECTED" | "DEEPLY_INSPECTED";
export type EvidenceAuthority = "EXPLICIT_METADATA" | "INFERENCE" | "UNKNOWN";
export type PatternEvidenceLevel = "METADATA_ONLY" | "SCENE_VERIFIED" | "PROPERTY_VERIFIED" | "BEHAVIOUR_VERIFIED" | "UNKNOWN";

export interface InferredValue<T> {
  value: T;
  authority: EvidenceAuthority;
  rationale: string;
}

export interface PresetEvidence {
  source: string;
  kind: "DISCOVERY" | "METADATA" | "SCENE" | "PROPERTY" | "BEHAVIOUR" | "LIMITATION";
  detail: string;
  lensStudioVersion: string | null;
  observedAt: string;
}

export interface PresetInspectionEvent {
  level: PresetInspectionLevel;
  occurredAt: string;
  capability: string;
  result: "PASS" | "UNAVAILABLE" | "BLOCKED" | "ERROR";
  note: string;
}

export interface PresetRecord {
  id: string;
  exactName: string;
  source: OfficialResourceSource;
  rawMetadata: Record<string, unknown>;
  inferredCategory: InferredValue<PresetCategory>;
  secondaryCategories: Array<InferredValue<PresetCategory>>;
  likelyPurpose: InferredValue<string>;
  inspectionLevel: PresetInspectionLevel;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  evidence: PresetEvidence[];
  discoveredAt: string;
  patternCardIds: string[];
  inspectionHistory: PresetInspectionEvent[];
}

export interface RepresentativePreset {
  presetId: string;
  exactName: string;
  categories: PresetCategory[];
  reasons: string[];
  selectionScore: number;
  possibleDuplicateOf: string | null;
}

export interface RepresentativeSelection {
  target: number;
  selected: RepresentativePreset[];
  excludedNearDuplicates: Array<{ presetId: string; duplicateOf: string; reason: string }>;
  categoryCoverage: Array<{ category: PresetCategory; count: number }>;
  beautyRelatedCount: number;
  createdAt: string;
}

export interface SandboxConfirmation {
  expectedName: "Effect Lab Sandbox";
  currentProjectName: string | null;
  currentProjectPath: string | null;
  projectMarkedAsSandbox: boolean;
  liveMcpResponded: boolean;
  softFlashMarkersAbsent: boolean;
  projectFingerprint: string | null;
  humanConfirmed: boolean;
  confirmedPresetId: string | null;
  confirmedAt: string | null;
}

export interface SandboxDecision {
  allowed: boolean;
  reasons: string[];
  actionRequired: string | null;
  resetRequiredAfterInspection: boolean;
}

export interface CurriculumReadiness {
  category: "Beauty" | "Randomisers" | "Games" | "Face effects" | "World AR" | "VFX" | "Fashion" | "Experimental";
  status: "READY" | "PARTIAL" | "NOT_READY";
  patternCardCount: number;
  sceneVerifiedCount: number;
  verifiedCapabilityCount: number;
  reasons: string[];
}

export interface CensusSnapshot {
  presets: PresetRecord[];
  representativeSelection: RepresentativeSelection | null;
  updatedAt: string;
}

export type EvidenceAwarePatternCard = PatternCard & {
  sourcePresetId: string;
  inspectionLevel: PresetInspectionLevel;
  fieldEvidence: Record<string, PatternEvidenceLevel>;
};
