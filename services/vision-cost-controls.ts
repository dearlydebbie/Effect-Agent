export interface VisionQACostContext {
  enabled: boolean;
  hasPreview: boolean;
  buildPassed: boolean;
  userRequested: boolean;
  iterationNumber: number;
  maxIterations: number;
  manualReanalysis?: boolean;
}

export type VisionQACostDecision =
  | { allowed: true; reason: null }
  | { allowed: false; reason: string };

export function canRunVisionQA(context: VisionQACostContext): VisionQACostDecision {
  if (!context.enabled) return { allowed: false, reason: "AI visual assessment is disabled." };
  if (!context.userRequested) return { allowed: false, reason: "AI visual assessment requires a user request." };
  if (!context.hasPreview) return { allowed: false, reason: "A real preview is required for AI visual assessment." };
  if (!context.buildPassed) return { allowed: false, reason: "The build must pass before AI visual assessment." };
  if (!context.manualReanalysis && context.iterationNumber >= context.maxIterations) {
    return { allowed: false, reason: `The visual QA iteration limit of ${context.maxIterations} is reached.` };
  }
  return { allowed: true, reason: null };
}
