import type { HumanFeedback, HumanReviewDecision } from "../types/creative-qa";
import type { KeyValueStorage } from "./persistence";

export interface HumanFeedbackStore { list(buildId: string): HumanFeedback[]; save(buildId: string, decision: HumanReviewDecision, feedback: string): HumanFeedback; saveAssessment(buildId: string, assessmentId: string, agreement: "AGREE" | "DISAGREE", note: string): HumanFeedback }

export class BrowserHumanFeedbackStore implements HumanFeedbackStore {
  constructor(private readonly storage: KeyValueStorage, private readonly key = "effect-lab-build-feedback-v1") {}
  private all(): HumanFeedback[] { try { return JSON.parse(this.storage.getItem(this.key) ?? "[]") as HumanFeedback[]; } catch { return []; } }
  list(buildId: string) { return this.all().filter((item) => item.buildId === buildId); }
  save(buildId: string, decision: HumanReviewDecision, feedback: string) {
    const createdAt = new Date().toISOString();
    const record: HumanFeedback = { id: `feedback-${Date.now()}`, buildId, assessmentId: null, decision, feedback: feedback.trim(), assessmentAgreement: null, assessmentNote: "", createdAt, updatedAt: createdAt };
    this.storage.setItem(this.key, JSON.stringify([...this.all(), record])); return record;
  }
  saveAssessment(buildId: string, assessmentId: string, agreement: "AGREE" | "DISAGREE", note: string) { const all = this.all(); const existing = all.find((item) => item.buildId === buildId && item.assessmentId === assessmentId); const updatedAt = new Date().toISOString(); const record: HumanFeedback = { id: existing?.id ?? `assessment-${Date.now()}`, buildId, assessmentId, decision: null, feedback: "", assessmentAgreement: agreement, assessmentNote: note.trim(), createdAt: existing?.createdAt ?? updatedAt, updatedAt }; this.storage.setItem(this.key, JSON.stringify([...all.filter((item) => !(item.buildId === buildId && item.assessmentId === assessmentId)), record])); return record; }
}

export class MemoryHumanFeedbackStore implements HumanFeedbackStore {
  private records: HumanFeedback[] = [];
  list(buildId: string) { return this.records.filter((item) => item.buildId === buildId).map((item) => ({ ...item })); }
  save(buildId: string, decision: HumanReviewDecision, feedback: string) { const createdAt = new Date().toISOString(); const record: HumanFeedback = { id: `feedback-${this.records.length + 1}`, buildId, assessmentId: null, decision, feedback: feedback.trim(), assessmentAgreement: null, assessmentNote: "", createdAt, updatedAt: createdAt }; this.records.push(record); return { ...record }; }
  saveAssessment(buildId: string, assessmentId: string, agreement: "AGREE" | "DISAGREE", note: string) { const existing = this.records.find((item) => item.buildId === buildId && item.assessmentId === assessmentId); const updatedAt = new Date().toISOString(); const record: HumanFeedback = { id: existing?.id ?? `assessment-${this.records.length + 1}`, buildId, assessmentId, decision: null, feedback: "", assessmentAgreement: agreement, assessmentNote: note.trim(), createdAt: existing?.createdAt ?? updatedAt, updatedAt }; this.records = [...this.records.filter((item) => !(item.buildId === buildId && item.assessmentId === assessmentId)), record]; return { ...record }; }
}
