export type PreviewEvidenceCondition = "OPEN_EYES" | "VISIBLE_TEETH" | "CLOSE_SKIN_VIEW";
export type PreviewEvidenceState = "AVAILABLE" | "CAPTURED" | "UNAVAILABLE";

export interface ControlledPreviewEvidence {
  condition: PreviewEvidenceCondition;
  state: PreviewEvidenceState;
  iteration: 1;
  imagePath: string | null;
  sourcePath: string | null;
  componentValuesPreserved: boolean;
  externalSubmission: "NOT_SENT" | "SENT_WITH_APPROVAL";
  evidence: string;
  manualAction: string | null;
}
