"use client";

import { useEffect, useState } from "react";
import { naturalBeautyAssessmentIds, naturalBeautyReviewIdentity } from "../config/builds";
import { naturalBeautyAutomatedQualityAssessment, naturalBeautyOpenEyesQA, naturalBeautyVisibleTeethQA } from "../data/natural-beauty-controlled-evidence-qa";
import { naturalBeautyIteration1VisualQA } from "../data/natural-beauty-build-001";
import { BrowserBuildReviewRepository, BuildReviewService } from "../services/build-review";
import { BrowserLearningRepository } from "../services/learning-persistence";
import type { AssessmentAgreement, AssessmentDecisionRecord, BuildHumanDecision, BuildReviewState } from "../types/build-review";
import type { LearningCorpus, LearningRecord } from "../types/learning";
import type { VisualQAReport } from "../types/creative-qa";
import type { NaturalBeautyReviewReadiness } from "../types/natural-beauty-review-readiness";

const currentIterationPlan = {
  id: "natural-beauty-iteration-2-plan",
  buildId: naturalBeautyReviewIdentity.buildId,
  readyOperationCount: naturalBeautyAutomatedQualityAssessment.iteration2ReadyOperations.length,
};

export function NaturalBeautyReview({ record, onCorpusChange }: { record: LearningRecord; onCorpusChange: (corpus: LearningCorpus) => void }) {
  const [state, setState] = useState<BuildReviewState>(() => {
    if (typeof window === "undefined") return { identity: naturalBeautyReviewIdentity, assessmentDecisions: [], humanReview: null };
    try { return new BuildReviewService(new BrowserBuildReviewRepository(window.localStorage)).load(naturalBeautyReviewIdentity); }
    catch { return { identity: naturalBeautyReviewIdentity, assessmentDecisions: [], humanReview: null }; }
  });
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [humanNote, setHumanNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [readiness, setReadiness] = useState<NaturalBeautyReviewReadiness | null>(null);
  const liveProjectMatches = readiness?.ready === true
    && `lens-name:${readiness.lensName ?? "UNKNOWN"}` === naturalBeautyReviewIdentity.lensId
    && readiness.buildStateFingerprint === naturalBeautyReviewIdentity.buildStateFingerprint;

  useEffect(() => {
    void fetch("/api/learning-lab/natural-beauty-review", { cache: "no-store" })
      .then(async (response) => { if (!response.ok) throw new Error("Live review verification failed."); return response.json() as Promise<NaturalBeautyReviewReadiness>; })
      .then(setReadiness)
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Live review verification failed."));
  }, []);

  const saveAssessment = (assessmentId: string, agreement: AssessmentAgreement) => {
    setMessage(null);
    try {
      const repository = new BrowserBuildReviewRepository(window.localStorage);
      const service = new BuildReviewService(repository);
      service.saveAssessment({ ...naturalBeautyReviewIdentity, activeBuildId: naturalBeautyReviewIdentity.buildId, assessmentId, expectedAssessmentId: assessmentId, agreement, note: notes[assessmentId] ?? "" });
      setState(service.load(naturalBeautyReviewIdentity));
      setMessage("The assessment decision was saved.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "The assessment decision was not saved."); }
  };

  const review = async (decision: BuildHumanDecision) => {
    setBusy(true); setMessage(null);
    try {
      const verificationResponse = await fetch("/api/learning-lab/natural-beauty-review", { cache: "no-store" });
      if (!verificationResponse.ok) throw new Error("Live review verification failed. Reload the current build.");
      const currentReadiness = await verificationResponse.json() as NaturalBeautyReviewReadiness;
      setReadiness(currentReadiness);
      if (!currentReadiness.ready || currentReadiness.buildId !== naturalBeautyReviewIdentity.buildId || currentReadiness.buildStateFingerprint !== naturalBeautyReviewIdentity.buildStateFingerprint) throw new Error(currentReadiness.mismatches[0] ?? "The active Lens project does not match this build. Reload the current build.");
      const repository = new BrowserBuildReviewRepository(window.localStorage);
      const service = new BuildReviewService(repository);
      const result = service.saveHumanReview({
        ...naturalBeautyReviewIdentity, activeBuildId: naturalBeautyReviewIdentity.buildId, decision, note: humanNote,
        learningRecord: record,
        gates: { technicalQA: naturalBeautyAutomatedQualityAssessment.technicalQA, specificationQA: naturalBeautyAutomatedQualityAssessment.specificationQA, visualQA: naturalBeautyAutomatedQualityAssessment.visualQA, unresolvedCriticalFindings: naturalBeautyAutomatedQualityAssessment.unresolvedCriticalFindings },
      });
      const learningRepository = new BrowserLearningRepository(window.localStorage);
      await learningRepository.saveRecord(result.learningRecord);
      onCorpusChange(await learningRepository.load());
      setState(service.load(naturalBeautyReviewIdentity)); setHumanNote("");
      setMessage(decision === "APPROVED" ? "The learning build was approved and completed. Nothing was published." : decision === "NEEDS_CHANGES" ? "The change request was saved. No technical change was created." : "The rejection was saved. The evidence was retained.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "The human review was not saved."); }
    finally { setBusy(false); }
  };

  const confirmIteration = () => {
    setMessage(null);
    try {
      new BuildReviewService(new BrowserBuildReviewRepository(window.localStorage)).confirmIteration({ ...naturalBeautyReviewIdentity, activeBuildId: naturalBeautyReviewIdentity.buildId, iterationPlanId: currentIterationPlan.id, expectedIterationPlanId: currentIterationPlan.id, readyOperationCount: currentIterationPlan.readyOperationCount });
    } catch (error) { setMessage(error instanceof Error ? error.message : "The iteration was not confirmed."); }
  };

  return <>
    <section className="panel quality-panel" data-build-id={naturalBeautyReviewIdentity.buildId}>
      <div className="panel-head"><div><h3>AI assessment feedback</h3><p>Each decision is stored with this build and assessment.</p></div><b className="qa-state pass">BUILD SCOPED</b></div>
      <AssessmentCard title="Iteration 1" assessmentId={naturalBeautyAssessmentIds.iteration1} report={naturalBeautyIteration1VisualQA} saved={decisionFor(state, naturalBeautyAssessmentIds.iteration1)} note={notes[naturalBeautyAssessmentIds.iteration1] ?? ""} setNote={(value) => setNotes((all) => ({ ...all, [naturalBeautyAssessmentIds.iteration1]: value }))} save={saveAssessment} />
      <AssessmentCard title="Open Eyes" assessmentId={naturalBeautyAssessmentIds.openEyes} report={naturalBeautyOpenEyesQA} saved={decisionFor(state, naturalBeautyAssessmentIds.openEyes)} note={notes[naturalBeautyAssessmentIds.openEyes] ?? ""} setNote={(value) => setNotes((all) => ({ ...all, [naturalBeautyAssessmentIds.openEyes]: value }))} save={saveAssessment} />
      <AssessmentCard title="Visible Teeth" assessmentId={naturalBeautyAssessmentIds.visibleTeeth} report={naturalBeautyVisibleTeethQA} saved={decisionFor(state, naturalBeautyAssessmentIds.visibleTeeth)} note={notes[naturalBeautyAssessmentIds.visibleTeeth] ?? ""} setNote={(value) => setNotes((all) => ({ ...all, [naturalBeautyAssessmentIds.visibleTeeth]: value }))} save={saveAssessment} />
    </section>
    <section className="panel technical-iteration-plan" data-iteration-plan-id={currentIterationPlan.id}>
      <div className="technical-plan-head"><div><span>ITERATION 2</span><h4>Proposed Lens Studio changes</h4><p>The automated quality process recommends that iteration stops.</p></div><div><b>{currentIterationPlan.readyOperationCount}</b><small>READY operations</small></div></div>
      <div className="technical-confirmation"><div><strong>There are no confirmed changes to run.</strong><p>Unknown or unsupported changes cannot run.</p></div><button disabled title="There is no active proposal to cancel.">Cancel</button><button className="primary-button" disabled={currentIterationPlan.readyOperationCount === 0} onClick={confirmIteration}>Confirm iteration</button></div>
    </section>
    <section className="panel human-review-panel" data-build-fingerprint={naturalBeautyReviewIdentity.buildStateFingerprint}>
      <div className="panel-head"><div><h3>Human Review</h3><p>Your decision is stored with the exact build state.</p></div><b className={`qa-state ${state.humanReview?.humanGate === "PASS" ? "pass" : liveProjectMatches ? "pass" : readiness ? "fail" : state.humanReview ? "warning" : "unknown"}`}>{state.humanReview?.decision.replaceAll("_", " ") ?? (liveProjectMatches ? "READY FOR DECISION" : readiness ? "NOT READY" : "VERIFYING")}</b></div>
      {readiness && <div className="quality-gates" aria-label="Natural Beauty final review summary">{readiness.checks.map((check) => <div key={check.id}><b className={`qa-state ${check.passed ? "pass" : "fail"}`}>{check.passed ? "PASS" : "FAIL"}</b><strong>{check.label}</strong><p>{check.actual}</p></div>)}</div>}
      <textarea value={humanNote} onChange={(event) => setHumanNote(event.target.value)} placeholder="Add review notes." aria-label="Natural Beauty human review feedback" />
      <div className="human-actions"><button disabled={busy || !liveProjectMatches} title={!liveProjectMatches ? "The active Lens project does not match this build." : undefined} onClick={() => void review("REJECTED")}>Reject</button><button disabled={busy || !liveProjectMatches || !humanNote.trim()} title={!liveProjectMatches ? "The active Lens project does not match this build." : !humanNote.trim() ? "Describe the changes that you need." : undefined} onClick={() => void review("NEEDS_CHANGES")}>Needs changes</button><button className="primary-button" disabled={busy || !liveProjectMatches} title={!liveProjectMatches ? "The active Lens project does not match this build." : undefined} onClick={() => void review("APPROVED")}>Approve</button></div>
      {!readiness && <p>Effect Lab is checking the live Natural Beauty build.</p>}
      {readiness && !liveProjectMatches && <p className="build-error">{readiness.mismatches.join(" ") || "The active Lens project does not match this build."} Review actions are disabled.</p>}
      {liveProjectMatches && <div className="review-message"><strong>Natural Beauty is ready for your decision.</strong><p>Approval would complete Exercise 001. Approval would not publish the Lens.</p><p>Curriculum progress becomes 1/100 only after valid human approval.</p></div>}
      {state.humanReview && <div className="feedback-history"><div><b>{state.humanReview.decision.replaceAll("_", " ")}</b><p>{state.humanReview.note || "No written feedback."}</p><time>{new Date(state.humanReview.decidedAt).toLocaleString()}</time><small>Build state {state.humanReview.buildStateFingerprint.slice(0, 12)} · Published: NO</small></div></div>}
      {message && <p role="status">{message}</p>}
    </section>
  </>;
}

function AssessmentCard({ title, assessmentId, report, saved, note, setNote, save }: { title: string; assessmentId: string; report: VisualQAReport; saved: AssessmentDecisionRecord | null; note: string; setNote: (value: string) => void; save: (assessmentId: string, agreement: AssessmentAgreement) => void }) {
  return <article className="visual-assessment" data-assessment-id={assessmentId}><div className="assessment-head"><div><span>AI VISUAL ASSESSMENT</span><h4>{title}</h4></div><div><b>{report.overallScore}</b><small>Overall score</small></div><div><b>{report.status}</b><small>Result</small></div></div><div className="assessment-feedback"><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add an optional note." aria-label={`${title} AI assessment feedback`} /><div><button onClick={() => save(assessmentId, "AGREE")}>Agree with assessment</button><button onClick={() => save(assessmentId, "DISAGREE")}>Disagree with assessment</button></div></div>{saved && <div className="feedback-history"><div><b>{saved.agreement} WITH AI</b><p>{saved.note || "No written note."}</p><time>{new Date(saved.updatedAt).toLocaleString()}</time><small>You can change this decision. The saved record will be updated.</small></div></div>}</article>;
}

function decisionFor(state: BuildReviewState, assessmentId: string) { return state.assessmentDecisions.find((entry) => entry.assessmentId === assessmentId) ?? null; }
