import type { ControlledPreviewEvidence } from "../types/controlled-preview-evidence";

export const naturalBeautyControlledPreviewEvidence: ControlledPreviewEvidence[] = [
  { condition: "OPEN_EYES", state: "CAPTURED", iteration: 1, imagePath: "/natural-beauty-evidence-open-eyes.png", sourcePath: "/Applications/Lens Studio.app/Contents/Resources/PreviewResources.bundle/Images/Idle/Person 1.jpg", componentValuesPreserved: true, externalSubmission: "SENT_WITH_APPROVAL", evidence: "The saved Lens Studio preview visibly shows both eyes open. Scoped real Vision QA passed at 8.3.", manualAction: null },
  { condition: "VISIBLE_TEETH", state: "CAPTURED", iteration: 1, imagePath: "/natural-beauty-evidence-visible-teeth.png", sourcePath: "/Applications/Lens Studio.app/Contents/Resources/PreviewResources.bundle/Images/Idle/Smile 2.jpg", componentValuesPreserved: true, externalSubmission: "SENT_WITH_APPROVAL", evidence: "The saved Lens Studio preview visibly shows a natural smile with teeth. Scoped real Vision QA passed at 8.8.", manualAction: null },
  { condition: "CLOSE_SKIN_VIEW", state: "UNAVAILABLE", iteration: 1, imagePath: null, sourcePath: null, componentValuesPreserved: true, externalSubmission: "NOT_SENT", evidence: "The connected PreviewPanelTool does not expose crop, zoom, or camera-distance controls. The available smile source is not sufficient for a reliable close skin assessment.", manualAction: "Add a verified close facial source in the Preview panel or use a real camera close to the face. Then capture the preview." },
];

export const naturalBeautyControlledPreviewSummary = {
  iteration: 1 as const,
  externalSubmission: "SENT_WITH_APPROVAL" as const,
  submissionAuthorization: "EXPLICIT_USER_APPROVAL" as const,
  propertyValuesPreserved: true,
  sufficientForIteration2: false,
};
