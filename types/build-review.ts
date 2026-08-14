import type { LearningRecord } from "./learning";

export type AssessmentAgreement = "AGREE" | "DISAGREE";
export type BuildHumanDecision = "APPROVED" | "NEEDS_CHANGES" | "REJECTED";

export interface BuildReviewIdentity {
  buildId: string;
  lensId: string;
  projectIdentityFingerprint: string;
  buildStateFingerprint: string;
}

export interface AssessmentDecisionRecord extends BuildReviewIdentity {
  assessmentId: string;
  agreement: AssessmentAgreement;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface HumanReviewRecord extends BuildReviewIdentity {
  decision: BuildHumanDecision;
  note: string;
  decidedAt: string;
  approvedBuildStateFingerprint: string | null;
  humanGate: "PASS" | "NEEDS_CHANGES" | "REJECTED";
  learningBuildComplete: boolean;
  publishCandidateEligible: boolean;
  published: false;
}

export interface BuildReviewState {
  identity: BuildReviewIdentity;
  assessmentDecisions: AssessmentDecisionRecord[];
  humanReview: HumanReviewRecord | null;
}

export interface GuardedBuildAction extends BuildReviewIdentity {
  activeBuildId: string;
}

export interface LearningQualityGates {
  technicalQA: "PASS" | "WARNING" | "FAIL" | "UNKNOWN" | "UNAVAILABLE";
  specificationQA: "PASS" | "WARNING" | "FAIL" | "UNKNOWN" | "UNAVAILABLE";
  visualQA: "PASS" | "WARNING" | "FAIL" | "UNKNOWN" | "UNAVAILABLE";
  unresolvedCriticalFindings: string[];
}

export interface HumanReviewResult {
  review: HumanReviewRecord;
  learningRecord: LearningRecord;
}
