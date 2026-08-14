import type { ExperienceCriterion, ExperienceQAReport } from "../types/creative-qa";

export interface ExperienceEvidence { interactionWorks?: string; firstActionClear?: string; responseTime?: string; resultTiming?: string; animationCompletes?: string; resetWorks?: string; instructionUnderstood?: string; captureWorks?: string; noDeadEnd?: string }

const definitions: Array<[keyof ExperienceEvidence, string]> = [
  ["interactionWorks", "Interaction works"], ["firstActionClear", "First action is clear"], ["responseTime", "Response time is reasonable"],
  ["resultTiming", "Result appears at the correct time"], ["animationCompletes", "Animation completes"], ["resetWorks", "Reset behaviour works"],
  ["instructionUnderstood", "The user can understand what to do"], ["captureWorks", "The result can be captured"], ["noDeadEnd", "No interaction dead end exists"],
];

export class ExperienceQAAgent {
  evaluate(evidence: ExperienceEvidence = {}): ExperienceQAReport {
    const criteria: ExperienceCriterion[] = definitions.map(([id, label]) => ({ id, label, status: evidence[id] ? "PASS" : "UNKNOWN", evidence: evidence[id] ?? null }));
    const known = criteria.filter((item) => item.status !== "UNKNOWN");
    return { status: known.length ? (criteria.some((item) => item.status === "UNKNOWN") ? "WARNING" : "PASS") : "UNKNOWN", criteria, message: known.length ? "Only criteria with recorded evidence were evaluated." : "No interaction evidence is available. Human experience review is required." };
  }
}
