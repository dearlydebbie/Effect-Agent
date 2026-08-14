import type { Category, QAResult } from "./domain";

export type LensStudioConnectionState = "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "ERROR";
export type LensBuildStatus = "WAITING" | "PLANNED" | "BUILDING" | "TESTING" | "NEEDS_REVIEW" | "FAILED";
export type LensBuildLogLevel = "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "AGENT";

export interface LensTextRequirement {
  purpose: "instruction" | "hint" | "description" | "call_to_action";
  text: string;
  publicFacing: true;
}

export interface LensSceneRequirement {
  name: string;
  purpose: string;
  requiredComponents: string[];
}

export interface LensAssetRequirement {
  name: string;
  kind: "texture" | "material" | "audio" | "script" | "font" | "other";
  source: "generated" | "local" | "lens_studio";
  permissionRequired: boolean;
}

export interface LensScriptRequirement {
  name: string;
  purpose: string;
  inputs: string[];
}

export interface LensBuildSpecification {
  id: string;
  title: string;
  concept: string;
  categories: Category[];
  targetPlatform: "Snapchat";
  interactionType: string;
  userExperience: string[];
  sceneRequirements: LensSceneRequirement[];
  assetRequirements: LensAssetRequirement[];
  textRequirements: LensTextRequirement[];
  behaviourRequirements: string[];
  scriptRequirements: LensScriptRequirement[];
  audioRequirements: string[];
  visualDirection: string[];
  technicalConstraints: string[];
  qaRequirements: string[];
}

export interface LensStudioCapability {
  name: string;
  title?: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

export interface LensStudioConnectionInfo {
  state: LensStudioConnectionState;
  message: string;
  serverName: string | null;
  serverVersion: string | null;
  protocolVersion: string | null;
  lensStudioVersion: string | null;
  capabilities: LensStudioCapability[];
}

export interface LensBuildOperation {
  id: string;
  label: string;
  toolName: string;
  purpose: string;
  required: boolean;
  supported: boolean;
  arguments?: Record<string, unknown>;
}

export interface LensBuildPlan {
  buildId: string;
  lensTitle: string;
  summary: string;
  operations: LensBuildOperation[];
  limitations: string[];
  humanConfirmationRequired: true;
}

export interface LensBuildLog {
  timestamp: string;
  level: LensBuildLogLevel;
  step: string;
  message: string;
  toolName?: string;
}

export interface LensBuildReport {
  buildId: string;
  lensTitle: string;
  status: LensBuildStatus;
  operationsCompleted: string[];
  assetsUsed: string[];
  scriptsCreated: string[];
  compileResult: "NOT_RUN" | "PASSED" | "FAILED";
  warnings: string[];
  errors: string[];
  qaResult: QAResult | "NOT_RUN";
  technicalQA: QAResult;
  specificationQA: QAResult;
  visualQA: QAResult;
  experienceQA: QAResult;
  deprecations: string[];
  previewDataUrl: string | null;
  humanReviewRequired: true;
  timestamp: string;
  logs: LensBuildLog[];
}
