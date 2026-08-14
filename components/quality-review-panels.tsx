"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import type { CreativeDirection, ExperienceQAReport, HumanFeedback, IterationRecord, TechnicalIterationPlan, VisualQAReport, VisionProviderState } from "../types/creative-qa";
import type { QAResult } from "../types/domain";
import { BrowserHumanFeedbackStore } from "../services/human-feedback";
import { softFlashBuildId } from "../config/builds";

const buildId = softFlashBuildId;
interface QualityPayload {
  creativeDirection: CreativeDirection;
  technicalQA: { status: QAResult; message: string };
  specificationQA: { status: QAResult; message: string };
  visualQA: { status: QAResult; message: string };
  provider: { state: VisionProviderState; name: string; model: string | null; label: string };
  costControls: { enabled: boolean; maxIterations: number };
  experienceQA: ExperienceQAReport;
  initialIteration: IterationRecord;
  technicalIterationPlan: TechnicalIterationPlan | null;
  humanReview: "REQUIRED";
}

async function readJson(response: Response) { const value = await response.json() as Record<string, unknown>; if (!response.ok) throw new Error(String(value.error ?? "Quality review request failed.")); return value; }

export function QualityReviewPanels() {
  const [quality, setQuality] = useState<QualityPayload | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [visual, setVisual] = useState<VisualQAReport | null>(null);
  const [history, setHistory] = useState<IterationRecord[]>([]);
  const [feedback, setFeedback] = useState<HumanFeedback[]>([]);
  const [assessmentNote, setAssessmentNote] = useState("");
  const [technicalPlan, setTechnicalPlan] = useState<TechnicalIterationPlan | null>(null);
  const [iterationConfirmed, setIterationConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compare, setCompare] = useState(false);

  useEffect(() => {
    void fetch(`/api/lens-studio/quality?buildId=${encodeURIComponent(buildId)}`, { cache: "no-store" }).then(readJson).then((value) => {
      const next = value as unknown as QualityPayload; setQuality(next);
      const stored = window.localStorage.getItem(`effect-lab-iterations-${buildId}`);
      const parsedHistory = stored ? JSON.parse(stored) as IterationRecord[] : [next.initialIteration];
      const storedHistory = parsedHistory.filter((item) => item.buildId === buildId);
      setHistory(storedHistory); setPreview([...storedHistory].reverse().find((item) => item.previewDataUrl)?.previewDataUrl ?? null);
      const storedVisual = window.localStorage.getItem(`effect-lab-visual-qa-${buildId}`);
      if (storedVisual) setVisual(JSON.parse(storedVisual) as VisualQAReport);
      const storedTechnicalPlan = window.localStorage.getItem(`effect-lab-technical-plan-${buildId}`);
      const parsedTechnicalPlan = storedTechnicalPlan ? JSON.parse(storedTechnicalPlan) as TechnicalIterationPlan : next.technicalIterationPlan;
      const initialTechnicalPlan = parsedTechnicalPlan?.buildId === buildId ? parsedTechnicalPlan : null;
      if (initialTechnicalPlan) { setTechnicalPlan(initialTechnicalPlan); window.localStorage.setItem(`effect-lab-technical-plan-${buildId}`, JSON.stringify(initialTechnicalPlan)); }
      setFeedback(new BrowserHumanFeedbackStore(window.localStorage).list(buildId));
    }).catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Quality review could not load."));
  }, []);

  const capture = async (force = false) => {
    setBusy(true); setError(null);
    try {
      const value = await readJson(await fetch("/api/lens-studio/quality", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "capture-preview", buildId, force, iterationNumber: Math.max(0, history.length - 1) }) }));
      const nextPreview = String(value.previewDataUrl); const nextVisual = value.visualQA as unknown as VisualQAReport;
      const nextTechnicalPlan = (value.technicalIterationPlan ?? null) as TechnicalIterationPlan | null;
      setPreview(nextPreview); setVisual(nextVisual); setTechnicalPlan(nextTechnicalPlan); setIterationConfirmed(false);
      window.localStorage.setItem(`effect-lab-visual-qa-${buildId}`, JSON.stringify(nextVisual));
      if (nextTechnicalPlan) window.localStorage.setItem(`effect-lab-technical-plan-${buildId}`, JSON.stringify(nextTechnicalPlan));
      const record: IterationRecord = { id: `capture-${Date.now()}`, buildId, number: history.length, previewDataUrl: nextPreview, visualScore: nextVisual.overallScore, changesMade: history.length === 1 ? ["Captured the existing Lens result. No change was made."] : [], technicalQA: "PASS", visualQA: nextVisual.status, timestamp: new Date().toISOString() };
      const next = [...history, record]; setHistory(next); window.localStorage.setItem(`effect-lab-iterations-${buildId}`, JSON.stringify(next));
    } catch (captureError) { setError(captureError instanceof Error ? captureError.message : "Preview capture failed."); }
    finally { setBusy(false); }
  };

  const activeAssessmentId = visual ? `soft-flash-visual-${history.at(-1)?.id ?? "unknown"}` : null;
  const savedAssessment = activeAssessmentId ? feedback.find((item) => item.assessmentId === activeAssessmentId) ?? null : null;
  const saveAssessment = (agreement: "AGREE" | "DISAGREE") => { if (!activeAssessmentId) { setError("The current assessment ID is missing. Reload this build."); return; } const store = new BrowserHumanFeedbackStore(window.localStorage); store.saveAssessment(buildId, activeAssessmentId, agreement, assessmentNote); setFeedback(store.list(buildId)); setAssessmentNote(""); };
  const prepareTechnicalPlan = async () => {
    if (!visual?.findings.length) return;
    setBusy(true); setError(null);
    try {
      const value = await readJson(await fetch("/api/lens-studio/quality", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "technical-plan", buildId, findings: visual.findings, sourceVisualScore: visual.overallScore, preserve: visual.strengths }) }));
      const next = value.technicalIterationPlan as unknown as TechnicalIterationPlan; setTechnicalPlan(next); setIterationConfirmed(false); window.localStorage.setItem(`effect-lab-technical-plan-${buildId}`, JSON.stringify(next));
    } catch (planError) { setError(planError instanceof Error ? planError.message : "Technical inspection failed."); }
    finally { setBusy(false); }
  };
  const cancelTechnicalPlan = () => { setTechnicalPlan(null); setIterationConfirmed(false); window.localStorage.removeItem(`effect-lab-technical-plan-${buildId}`); };

  if (!quality) return <section className="panel quality-loading"><p>{error ?? "Loading creative and quality review."}</p></section>;
  const firstPreview = history.find((item) => item.previewDataUrl)?.previewDataUrl ?? preview;
  const latestPreview = [...history].reverse().find((item) => item.previewDataUrl)?.previewDataUrl ?? preview;
  const verifiedAssessmentFeedback = feedback.filter((item) => item.assessmentAgreement && item.assessmentId);
  const retainedLegacyFeedbackCount = feedback.length - verifiedAssessmentFeedback.length;
  return <div className="quality-stack">
    <CreativeDirectionPanel direction={quality.creativeDirection}/>
    <section className="panel quality-panel"><div className="panel-head"><div><h3>Quality gates</h3><p>Compilation is only one quality signal.</p></div><button onClick={() => void capture()} disabled={busy}>{busy ? "Analysing…" : quality.provider.state === "REAL" ? "Capture and analyse preview" : "Capture current preview"}</button></div>
      <div className="provider-strip"><span>Provider</span><strong>{quality.provider.label}</strong><b className={`provider-state ${quality.provider.state.toLowerCase()}`}>{quality.provider.state}</b><small>AI visual assessment · Human judgement is authoritative</small></div>
      <div className="quality-gates"><QualityGate label="Technical QA" status={quality.technicalQA.status} message={quality.technicalQA.message}/><QualityGate label="Specification QA" status={quality.specificationQA.status} message={quality.specificationQA.message}/><QualityGate label="Visual QA" status={visual?.status ?? quality.visualQA.status} message={visual?.message ?? quality.visualQA.message}/><QualityGate label="Experience QA" status={quality.experienceQA.status} message={quality.experienceQA.message}/><QualityGate label="Human review" status="UNKNOWN" message="A human decision is required."/></div>
      {error && <div className="build-error">{error}</div>}
      {preview && <div className="captured-preview"><img src={preview} alt="Current Lens Studio preview"/><div><strong>Captured preview</strong><p>{visual?.status === "UNAVAILABLE" ? visual.message : visual?.message}</p><b className={`qa-state ${(visual?.status ?? "UNKNOWN").toLowerCase()}`}>{visual?.status ?? "UNKNOWN"}</b>{visual?.providerState === "REAL" && <button className="reanalyze-button" disabled={busy} onClick={() => void capture(true)}>Re-analyse</button>}</div></div>}
      {visual?.status !== "UNAVAILABLE" && visual && <VisualAssessment report={visual} assessmentNote={assessmentNote} setAssessmentNote={setAssessmentNote} saveAssessment={saveAssessment} saved={savedAssessment}/>} 
      {visual?.iterationRecommended && !technicalPlan && <div className="technical-plan-empty"><div><strong>Technical Iteration Plan required</strong><p>Inspect the current Lens Studio project before confirming any visual change.</p></div><button disabled={busy} onClick={() => void prepareTechnicalPlan()}>{busy ? "Inspecting…" : "Inspect Lens Studio"}</button></div>}
      {technicalPlan && <TechnicalIterationPlanPanel plan={technicalPlan} confirmed={iterationConfirmed} confirm={() => { if (technicalPlan.buildId !== buildId) { setError("This iteration plan is stale. Reload this build."); return; } if (technicalPlan.readyOperationCount === 0) { setError("There are no confirmed changes to run."); return; } setIterationConfirmed(true); }} cancel={cancelTechnicalPlan}/>} 
    </section>
    <section className="panel experience-panel"><div className="panel-head"><div><h3>Experience QA</h3><p>Missing evidence stays unknown.</p></div><b className={`qa-state ${quality.experienceQA.status.toLowerCase()}`}>{quality.experienceQA.status}</b></div><div className="experience-grid">{quality.experienceQA.criteria.map((item) => <div key={item.id}><b className={`qa-state ${item.status.toLowerCase()}`}>{item.status}</b><strong>{item.label}</strong><p>{item.evidence ?? "No evidence is available."}</p></div>)}</div></section>
    <section className="panel iteration-panel"><div className="panel-head"><div><h3>Iteration History</h3><p>Each preview remains separate from technical QA.</p></div><button disabled={!firstPreview || !latestPreview} onClick={() => setCompare(!compare)}>Compare</button></div>{compare && firstPreview && latestPreview && <div className="preview-compare"><figure><img src={firstPreview} alt="Original Lens preview"/><figcaption>Original</figcaption></figure><figure><img src={latestPreview} alt="Latest Lens preview"/><figcaption>Latest</figcaption></figure></div>}<div className="iteration-list">{history.map((item) => <div key={item.id}><span>{String(item.number).padStart(2,"0")}</span>{item.previewDataUrl ? <img src={item.previewDataUrl} alt={`Lens iteration ${item.number}`}/> : <div className="preview-empty">No stored preview</div>}<div><strong>{item.number === 0 ? "Original build" : `Iteration ${item.number}`}</strong><p>{item.changesMade.join(" ")}</p><small>{new Date(item.timestamp).toLocaleString()}</small></div><dl><dt>Visual score</dt><dd>{item.visualScore ?? "—"}</dd><dt>Technical QA</dt><dd>{item.technicalQA}</dd><dt>Visual QA</dt><dd>{item.visualQA}</dd></dl></div>)}</div></section>
    <section className="panel human-review-panel"><div className="panel-head"><div><h3>Human Review</h3><p>This historical build has no verified build-state fingerprint.</p></div><b className="qa-state unknown">UNAVAILABLE</b></div><textarea placeholder="Review is unavailable for this historical record." aria-label="Human review feedback" disabled/><div className="human-actions"><button disabled>Reject</button><button disabled>Needs changes</button><button className="primary-button" disabled>Approve</button></div><p>Review actions are disabled. An exact build-state fingerprint is required.</p>{retainedLegacyFeedbackCount > 0 && <p>{retainedLegacyFeedbackCount} unverified legacy review record{retainedLegacyFeedbackCount === 1 ? " is" : "s are"} retained outside the active review.</p>}{verifiedAssessmentFeedback.length > 0 && <div className="feedback-history">{verifiedAssessmentFeedback.map((item) => <div key={item.id}><b>{item.assessmentAgreement} WITH AI</b><p>{item.assessmentNote || "No written feedback."}</p><time>{new Date(item.updatedAt ?? item.createdAt).toLocaleString()}</time></div>)}</div>}</section>
  </div>;
}

function CreativeDirectionPanel({ direction }: { direction: CreativeDirection }) { const groups: Array<[string,string[]]> = [["Composition",direction.composition],["Colour",direction.colourTreatment],["Lighting",direction.lightingTreatment],["Motion",direction.motionDirection],["Restraint",direction.restraint],["Avoid",direction.elementsToAvoid],["Success criteria",direction.successCriteria],["Category criteria",direction.categoryCriteria]]; return <section className="panel creative-direction"><div className="panel-head"><div><h3>Creative Direction</h3><p>{direction.visualObjective}</p></div><span className="status approved">APPROVED IDEA</span></div><div className="direction-lead"><div><span>Intended feeling</span><strong>{direction.intendedFeeling}</strong></div><div><span>Focal point</span><strong>{direction.focalPoint}</strong></div></div><div className="direction-grid">{groups.map(([label,items]) => <div key={label}><h4>{label}</h4>{items.map((item) => <p key={item}>{item}</p>)}</div>)}</div></section>; }
function QualityGate({ label, status, message }: { label: string; status: QAResult; message: string }) { return <div><b className={`qa-state ${status.toLowerCase()}`}>{status}</b><strong>{label}</strong><p>{message}</p></div>; }
function VisualAssessment({ report, assessmentNote, setAssessmentNote, saveAssessment, saved }: { report: VisualQAReport; assessmentNote: string; setAssessmentNote: (value: string) => void; saveAssessment: (value: "AGREE" | "DISAGREE") => void; saved: HumanFeedback | null }) { return <div className="visual-assessment"><div className="assessment-head"><div><span>AI VISUAL ASSESSMENT</span><h4>{report.provider}{report.model ? ` · ${report.model}` : ""}</h4></div><div><b>{report.overallScore ?? "—"}</b><small>Overall score</small></div><div><b>{report.confidence === null ? "—" : `${Math.round(report.confidence * 100)}%`}</b><small>Confidence</small></div></div>{report.cached && <div className="cache-badge">Cached result for this unchanged preview and brief</div>}<div className="visual-score-grid">{Object.entries(report.scores).map(([key,value]) => <div key={key}><span>{key.replace(/([A-Z])/g," $1")}</span><b>{value ?? "N/A"}</b></div>)}</div><div className="assessment-columns"><div><h5>Strengths</h5>{report.strengths.map((item) => <p key={item}>{item}</p>)}</div><div><h5>Limitations</h5>{report.limitations.map((item) => <p key={item}>{item}</p>)}</div></div>{report.findings.length > 0 && <div className="finding-list"><h5>Findings and recommended changes</h5>{report.findings.map((finding,index) => <div key={`${finding.type}-${index}`}><b className={`finding-${finding.severity.toLowerCase()}`}>{finding.severity}</b><strong>{finding.type}</strong><p>{finding.description}</p><small>Visible evidence: {finding.evidence}</small><em>{finding.recommendedChange}</em></div>)}</div>}<div className="iteration-verdict"><span>Iteration recommendation</span><strong>{report.iterationRecommended ? report.iterationPriority : "NONE"}</strong></div><div className="assessment-feedback"><textarea value={assessmentNote} onChange={(event) => setAssessmentNote(event.target.value)} placeholder="Add an optional note about this AI assessment." aria-label="AI assessment feedback"/><div><button onClick={() => saveAssessment("AGREE")}>Agree with assessment</button><button onClick={() => saveAssessment("DISAGREE")}>Disagree with assessment</button></div></div>{saved && <div className="feedback-history"><div><b>{saved.assessmentAgreement} WITH AI</b><p>{saved.assessmentNote || "No written note."}</p><time>{new Date(saved.updatedAt ?? saved.createdAt).toLocaleString()}</time></div></div>}</div>; }

function TechnicalIterationPlanPanel({ plan, confirmed, confirm, cancel }: { plan: TechnicalIterationPlan; confirmed: boolean; confirm: () => void; cancel: () => void }) {
  return <section className="technical-iteration-plan"><div className="technical-plan-head"><div><span>TECHNICAL ITERATION PLAN</span><h4>Proposed Lens Studio changes</h4><p>{plan.inspectionMessage}</p></div><div><b>{plan.readyOperationCount}</b><small>READY operations</small></div></div><div className="baseline-summary"><strong>Iteration 0 baseline stored</strong><span>{plan.baseline.length} readable values · {plan.projectFingerprint.slice(0,12)}</span><p>This baseline supports an exact before-and-after report. It does not provide automatic rollback.</p></div><div className="technical-change-list">{plan.changes.map((change) => <article key={change.id}><header><span>{change.category}</span><b className={`technical-status ${change.status.toLowerCase()}`}>{change.status.replaceAll("_", " ")}</b></header><dl><dt>Visual issue</dt><dd>{change.visualProblem}</dd><dt>Visual recommendation</dt><dd>{change.visualRecommendation}</dd><dt>Target object</dt><dd>{formatTarget(change.targetObject)}</dd><dt>Component or asset</dt><dd>{formatTarget(change.targetComponentOrAsset)}</dd><dt>Property or parameter</dt><dd>{change.targetPropertyOrParameter ?? "Not safely identified"}</dd><dt>Current</dt><dd>{formatValue(change.currentValue)}</dd><dt>Proposed</dt><dd>{change.proposedValueOrOperation ?? "No operation proposed."}</dd><dt>Reason</dt><dd>{change.reason}</dd><dt>Expected</dt><dd>{change.expectedVisualResult}</dd><dt>Confidence</dt><dd>{change.confidence}</dd><dt>Reversible</dt><dd>{change.reversible ? "Yes" : "No"}</dd><dt>Evidence source</dt><dd>{change.evidenceSources.join(" ")}</dd></dl></article>)}</div><div className="technical-confirmation"><div><strong>{plan.readyOperationCount === 0 ? "There are no confirmed changes to run." : confirmed ? "Iteration intent confirmed" : "Human confirmation required"}</strong><p>{plan.readyOperationCount === 0 ? "Unknown or unsupported changes cannot run." : confirmed ? "No Lens Studio change was executed. Execution is not enabled in this milestone." : "Only READY operations can be eligible for execution. Review every operation first."}</p></div><button onClick={cancel}>Cancel</button><button className="primary-button" disabled={plan.readyOperationCount === 0 || confirmed} onClick={confirm}>Confirm iteration</button></div></section>;
}
function formatTarget(value: { name: string; id: string; type: string; path: string | null } | null) { return value ? `${value.name} · ${value.type} · ${value.path ?? value.id}` : "Not safely identified"; }
function formatValue(value: unknown) { return value === null || value === undefined ? "Not readable" : typeof value === "string" ? value : JSON.stringify(value); }
