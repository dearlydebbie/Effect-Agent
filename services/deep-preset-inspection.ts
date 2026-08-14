import { learningConfig } from "../config/learning";
import type { ResetAssessment } from "../types/deep-preset-inspection";

export interface DeepInspectionConfirmation {
  presetName: string;
  confirmedPresetName: string | null;
  humanConfirmed: boolean;
  sandboxStatus: "VERIFIED" | "MISMATCH" | "UNKNOWN";
  lensName: string | null;
  projectPath: string | null;
  fingerprint: string | null;
  connectionSource: "MANUAL_CONFIG" | "AUTO_DISCOVERY" | "UNKNOWN";
  softFlashMarkersAbsent: boolean;
}

export function validateBeautyPresetConfirmation(input: DeepInspectionConfirmation) {
  const reasons: string[] = [];
  if (input.presetName !== "BeautyPreset") reasons.push("Only BeautyPreset is allowed in this inspection.");
  if (!input.humanConfirmed || input.confirmedPresetName !== input.presetName) reasons.push("Confirm the exact BeautyPreset operation.");
  if (input.sandboxStatus !== "VERIFIED") reasons.push("The learning sandbox must be verified.");
  if (input.lensName !== learningConfig.sandbox.expectedLensName) reasons.push("The live Lens name does not match.");
  if (input.projectPath !== learningConfig.sandbox.expectedProjectPath) reasons.push("The saved project path does not match.");
  if (!input.fingerprint) reasons.push("The baseline fingerprint is missing.");
  if (input.connectionSource !== "MANUAL_CONFIG") reasons.push("The connection source must be MANUAL_CONFIG.");
  if (!input.softFlashMarkersAbsent) reasons.push("Soft Flash markers must be absent before instantiation.");
  return { allowed: reasons.length === 0, reasons };
}

export function determineResetStatus(input: { exactDeletePlanSupported: boolean; automaticResetComparedWithBaseline: boolean; manualResetVerified: boolean }): ResetAssessment {
  if (input.exactDeletePlanSupported && input.automaticResetComparedWithBaseline) return "SAFE_AUTOMATIC_RESET";
  if (input.manualResetVerified) return "SAFE_MANUAL_RESET";
  return "NO_VERIFIED_RESET";
}
