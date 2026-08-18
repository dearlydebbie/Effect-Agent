import { acceleratedLearningConfig } from "../config/accelerated-learning";
import { learningBuild001PostMortem, naturalBeautyPublicationCandidate } from "../data/learning-build-001-postmortem";
import { learningBuild002Specification } from "../data/learning-build-002";
import type { LearningVelocitySummary } from "../types/accelerated-learning";

const metric = (value: number | null, suffix = "") => value === null ? "Not recorded" : `${Number.isInteger(value) ? value : value.toFixed(1)}${suffix}`;

export function LearningVelocityPanel({ summary }: { summary: LearningVelocitySummary }) {
  return <section className="panel learning-velocity">
    <header><div><span className="eyebrow">LEARNING VELOCITY</span><h2>Production efficiency</h2></div><b>ACCELERATED MODE ON</b></header>
    <div>{[
      ["Completed", `${summary.completed}/${summary.target}`], ["Average build time", metric(summary.averageBuildTimeMinutes, " min")], ["Average confirmations", metric(summary.averageHumanConfirmations)], ["First-pass success", summary.firstPassSuccessRate === null ? "Not recorded" : `${Math.round(summary.firstPassSuccessRate * 100)}%`], ["Average iterations", metric(summary.averageIterations)], ["Reusable capabilities", String(summary.verifiedReusableCapabilities)], ["Knowledge gaps", String(summary.newKnowledgeGaps)],
    ].map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>
    <p>Build 001 timings, operation count, and confirmation count were not recorded. Effect Lab does not estimate them.</p>
  </section>;
}

export function LearningBuild001OutcomePanel() {
  return <section className="panel learning-outcome-summary">
    <header><div><span className="eyebrow">BUILD 001 POST-MORTEM</span><h2>Natural Beauty</h2></div><div><b>{learningBuild001PostMortem.trainingStatus}</b><strong>{naturalBeautyPublicationCandidate.publicationStatus}</strong></div></header>
    <div className="learning-outcome-grid"><article><h3>Reusable evidence</h3>{learningBuild001PostMortem.demonstratedCapabilities.map((entry) => <p key={entry.capability}><b>{entry.status}</b> {entry.capability}</p>)}</article><article><h3>Publication candidate</h3><p>Build state: {naturalBeautyPublicationCandidate.approvedBuildStateFingerprint.slice(0, 12)}</p><p>Submission: {naturalBeautyPublicationCandidate.submissionReadiness.replaceAll("_", " ")}</p>{naturalBeautyPublicationCandidate.requiredSnapchatMetadataStillMissing.map((item) => <p key={item}>{item}</p>)}<small>Published: NO · Rewards eligibility: UNKNOWN</small></article></div>
  </section>;
}

export function LearningBuild002View() {
  const specification = learningBuild002Specification;
  return <div className="natural-beauty-build build-002">
    <section className="panel natural-build-head"><div><span className="eyebrow">LEARNING BUILD 002</span><h2>{specification.title}</h2><p>{specification.concept}</p></div><div><span>{specification.status.replaceAll("_", " ")}</span><strong>ONE BUILD AT A TIME</strong><small>Nothing has changed in Lens Studio.</small></div></section>
    <section className="panel retrieval-panel"><header><div><span className="eyebrow">RETRIEVED PATTERN CARDS</span><h2>Evidence selection</h2></div><small>{specification.patternEvidence.length} cards</small></header><div>{specification.patternEvidence.map((entry) => <article key={entry.presetName}><div><strong>{entry.presetName}</strong><b className={entry.decision.toLowerCase()}>{entry.decision.replaceAll("_", " ")}</b></div><p>{entry.reason}</p><small>{entry.status.replaceAll("_", " ")}</small></article>)}</div></section>
    <div className="natural-build-grid"><section className="panel architecture-panel"><span className="eyebrow">APPROVED SCOPE</span><h2>Construction</h2>{specification.sceneRequirements.map((entry) => <article key={entry.name}><strong>{entry.name}</strong><p>{entry.purpose}</p><small>{entry.requiredComponents.join(" → ")}</small></article>)}<h3>Assets</h3>{specification.assetRequirements.map((entry) => <p key={entry.name}>{entry.name} · {entry.kind}</p>)}</section><section className="panel build-unknowns"><span className="eyebrow">EVIDENCE BOUNDARY</span><h2>Known and unknown</h2><p>{specification.inspectionDecisionReason}</p>{specification.unknowns.map((entry) => <p key={entry}>{entry}</p>)}<small>Additional preset inspection required: NO</small></section></div>
    <section className="panel build-operations"><span className="eyebrow">PLANNED OPERATIONS</span><h2>Accelerated execution plan</h2>{specification.plannedOperations.map((entry) => <article key={entry.operation}><div><strong>{entry.operation}</strong><b>{entry.status.replaceAll("_", " ")}</b></div><p>{entry.evidence}</p></article>)}</section>
    <section className="panel build-unknowns"><span className="eyebrow">VISUAL AND QA SPECIFICATION</span><h2>Subtle editorial makeup</h2>{specification.visualDirection.map((entry) => <p key={entry}>{entry}</p>)}<h3>QA</h3>{specification.qaRequirements.map((entry) => <p key={entry}>{entry}</p>)}</section>
    <section className="panel confirmation-gate"><div className="review-message"><span className="eyebrow">BUILD SPECIFICATION GATE</span><h2>One confirmation starts the controlled build</h2><p>Routine VERIFIED_REUSABLE operations will not ask again. Effect Lab will stop for an UNKNOWN or destructive operation. A material visual correction will require the creative-change gate.</p><strong>Lens Studio has not been modified. Publishing is disabled.</strong></div><button className="primary-button" type="button" disabled title="Confirm this action explicitly before execution.">{specification.confirmationAction}</button></section>
    <section className="panel learning-policy-summary"><span className="eyebrow">ACCELERATED LEARNING POLICY</span><h2>Bounded safety</h2><p>Automatic repair limit: {acceleratedLearningConfig.maxAutomaticRepairs}. Build 002 runs alone. The batch stops on a runtime error, failed bounded repair, unknown destructive operation, restoration failure, or cross-build contamination.</p></section>
  </div>;
}
