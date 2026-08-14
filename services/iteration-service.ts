import { productConfig } from "../config/product";
import type { IterationPlan, IterationRecord, QualityThresholds, VisualQAReport } from "../types/creative-qa";

export class VisualIterationService {
  constructor(private readonly thresholds: QualityThresholds = productConfig.visualQAThresholds, private readonly supportedCapabilities: string[] = []) {}

  propose(buildId: string, report: VisualQAReport): IterationPlan | null {
    const capability = this.supportedCapabilities.find((name) => name === "scene-graphql" || name === "VirtualScene");
    if (report.status === "UNAVAILABLE" || report.overallScore === null || !report.iterationRecommended || !report.findings.length || !capability) return null;
    return { id: `iteration-plan-${buildId}-${Date.now()}`, buildId, sourceVisualScore: report.overallScore, preserve: report.strengths, requiresHumanConfirmation: true, changes: report.findings.map((finding) => ({ target: finding.type.toLowerCase(), problem: finding.description, proposedChange: finding.recommendedChange, capability, bounded: true })) };
  }

  canIterate(history: IterationRecord[]) {
    if (history.length >= this.thresholds.maxVisualIterations) return { allowed: false, reason: "The maximum automatic visual iteration count was reached." };
    const scored = history.filter((item) => item.visualScore !== null);
    if (scored.length >= 3) {
      const last = scored.slice(-3).map((item) => item.visualScore as number);
      const firstGain = last[1] - last[0]; const secondGain = last[2] - last[1];
      if (firstGain < this.thresholds.minimumMeaningfulImprovement && secondGain < this.thresholds.minimumMeaningfulImprovement) return { allowed: false, reason: "The visual score did not improve meaningfully after two attempts." };
    }
    return { allowed: true, reason: "A bounded iteration is available after human confirmation." };
  }

  statusForScore(score: number) { return score >= this.thresholds.strongCandidate ? "PASS" as const : score >= this.thresholds.needsImprovement ? "WARNING" as const : "FAIL" as const; }
}
