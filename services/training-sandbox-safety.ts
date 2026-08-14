import type { PresetRecord, SandboxConfirmation, SandboxDecision } from "../types/preset-census";
import { learningConfig } from "../config/learning";

export const TRAINING_SANDBOX_LENS_NAME = learningConfig.sandbox.expectedLensName;
export const TRAINING_SANDBOX_FOLDER_NAME = learningConfig.sandbox.expectedFolderName;
export const TRAINING_SANDBOX_PROJECT_PATH = learningConfig.sandbox.expectedProjectPath;

export function evaluateSandboxInstantiation(preset: PresetRecord, confirmation: SandboxConfirmation, resetSupported: boolean): SandboxDecision {
  const reasons: string[] = [];
  if (confirmation.currentProjectName !== TRAINING_SANDBOX_LENS_NAME) reasons.push(`The current Lens must be named ${TRAINING_SANDBOX_LENS_NAME}.`);
  if (confirmation.currentProjectPath !== TRAINING_SANDBOX_PROJECT_PATH) reasons.push(`The saved project path must be ${TRAINING_SANDBOX_PROJECT_PATH}.`);
  if (!confirmation.projectMarkedAsSandbox) reasons.push("The current project is not marked as the disposable training sandbox.");
  if (!confirmation.liveMcpResponded) reasons.push("The live Lens Studio MCP endpoint must respond.");
  if (!confirmation.softFlashMarkersAbsent) reasons.push("Soft Flash markers must be absent.");
  if (!confirmation.projectFingerprint) reasons.push("The project fingerprint must be captured.");
  if (!confirmation.humanConfirmed) reasons.push("Human confirmation is required before preset instantiation.");
  if (confirmation.confirmedPresetId !== preset.id) reasons.push("Confirm the exact preset that will be instantiated.");
  if (!resetSupported) reasons.push("A safe automatic sandbox reset has not been verified.");
  return { allowed: reasons.length === 0, reasons, actionRequired: reasons.length ? `Open the disposable Lens named ${TRAINING_SANDBOX_LENS_NAME}. Keep it in the ${TRAINING_SANDBOX_FOLDER_NAME} folder. Confirm it and the selected preset. Reset it by hand when automatic reset is unavailable.` : null, resetRequiredAfterInspection: true };
}

export function emptySandboxConfirmation(): SandboxConfirmation { return { expectedName: TRAINING_SANDBOX_LENS_NAME, currentProjectName: null, currentProjectPath: null, projectMarkedAsSandbox: false, liveMcpResponded: false, softFlashMarkersAbsent: false, projectFingerprint: null, humanConfirmed: false, confirmedPresetId: null, confirmedAt: null }; }
