import type { ConfirmationGate } from "../types/accelerated-learning";

export const acceleratedLearningConfig = {
  enabled: true,
  maxAutomaticRepairs: 2,
  confirmationGates: ["BUILD_SPECIFICATION", "UNKNOWN_OR_DESTRUCTIVE_OPERATION", "MATERIAL_CREATIVE_CHANGE", "FINAL_HUMAN_REVIEW", "PUBLISHING_OR_SUBMISSION"] as ConfirmationGate[],
  batchStopReasons: ["BOUNDED_REPAIR_FAILED", "RUNTIME_ERROR", "UNKNOWN_DESTRUCTIVE_OPERATION", "SANDBOX_RESTORATION_FAILED", "CROSS_BUILD_CONTAMINATION"] as const,
  earlyCurriculum: [
    "002 — Subtle Makeup / Face Mesh", "003 — Head Accessory", "004 — Camera / Colour treatment", "005 — Simple VFX", "006 — Face tracking interaction", "007 — Particles", "008 — Body tracking", "009 — Text / UI", "010 — Simple interactive effect",
  ],
} as const;
