import type { Idea } from "./domain";

export type SystemHealthState = "CONNECTED" | "DISCONNECTED" | "UNAVAILABLE" | "ERROR";
export type SandboxVerificationStatus = "VERIFIED" | "MISMATCH" | "UNKNOWN";

export interface LensProjectIdentity {
  lensName: string | null;
  projectFile: string | null;
  projectFolder: string | null;
  projectFingerprint: string | null;
  keySceneObjects: string[];
  assetNames: string[];
  checkedAt: string;
}

export interface SandboxVerification {
  status: SandboxVerificationStatus;
  reasons: string[];
  expectedLensName: string;
  expectedFolderName: string;
  expectedProjectPath: string;
  fingerprintPolicy: "CAPTURE_AND_COMPARE";
  excludedMarkersFound: string[];
}

export interface ServiceHealth {
  id: "lens-studio" | "openai-vision" | "database" | "learning-sandbox" | "research" | "ideas" | "critic" | "tiktok";
  label: string;
  state: SystemHealthState;
  lastSuccessfulCheck: string | null;
  error: string | null;
  nextAction: string;
}

export interface WorkspaceStatus {
  mode: "production" | "development" | "test";
  demoDataEnabled: boolean;
  demoIdeas: Idea[];
  lensProject: LensProjectIdentity | null;
  sandbox: SandboxVerification;
  services: ServiceHealth[];
  lensConnectionSource: "MANUAL_CONFIG" | "AUTO_DISCOVERY" | "UNKNOWN";
  lensLastVerified: string | null;
}
