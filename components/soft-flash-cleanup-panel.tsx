"use client";

import { useEffect, useState } from "react";
import { classifyRuntimeLogs } from "../services/runtime-log-classifier";
import type { NaturalBeautyFinalizationRecord, SoftFlashCleanupExecution, SoftFlashCleanupPlan } from "../types/soft-flash-cleanup";

export const naturalBeautyCleanupRecordKey = "effect-lab-natural-beauty-cleanup-restoration";
export const naturalBeautyFinalizationRecordKey = "effect-lab-natural-beauty-finalization";

export function SoftFlashCleanupPanel() {
  const [plan, setPlan] = useState<SoftFlashCleanupPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [execution, setExecution] = useState<SoftFlashCleanupExecution | null>(() => {
    if (typeof window === "undefined") return null;
    try { return JSON.parse(window.localStorage.getItem(naturalBeautyCleanupRecordKey) ?? "null") as SoftFlashCleanupExecution | null; }
    catch { return null; }
  });
  const [finalization, setFinalization] = useState<NaturalBeautyFinalizationRecord | null>(() => {
    if (typeof window === "undefined") return null;
    try { return JSON.parse(window.localStorage.getItem(naturalBeautyFinalizationRecordKey) ?? "null") as NaturalBeautyFinalizationRecord | null; }
    catch { return null; }
  });

  useEffect(() => {
    void fetch("/api/learning-lab/natural-beauty-cleanup", { cache: "no-store" })
      .then(async (response) => { if (!response.ok) throw new Error("The cleanup inventory could not be read."); return response.json() as Promise<SoftFlashCleanupPlan>; })
      .then(setPlan)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "The cleanup inventory could not be read."));
  }, []);

  useEffect(() => {
    if (execution) window.localStorage.setItem(naturalBeautyCleanupRecordKey, JSON.stringify(execution));
  }, [execution]);

  useEffect(() => {
    if (finalization) window.localStorage.setItem(naturalBeautyFinalizationRecordKey, JSON.stringify(finalization));
  }, [finalization]);

  const confirmCleanup = async () => {
    if (!plan?.planFingerprint || plan.status !== "READY_FOR_CONFIRMATION") return;
    setExecuting(true); setError(null);
    try {
      const response = await fetch("/api/learning-lab/natural-beauty-cleanup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "CONFIRM_CLEANUP", planFingerprint: plan.planFingerprint }) });
      const result = await response.json() as SoftFlashCleanupExecution & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "The confirmed cleanup did not run.");
      setExecution(result); setPlan(result.after);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The confirmed cleanup did not run."); }
    finally { setExecuting(false); }
  };

  const verifyFinalization = async () => {
    setExecuting(true); setError(null);
    try {
      const response = await fetch("/api/learning-lab/natural-beauty-cleanup", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "VERIFY_FINALIZATION" }) });
      const result = await response.json() as NaturalBeautyFinalizationRecord & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "The final state could not be verified.");
      setFinalization(result);
      window.localStorage.setItem(naturalBeautyFinalizationRecordKey, JSON.stringify(result));
      window.dispatchEvent(new Event("effect-lab-natural-beauty-finalized"));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The final state could not be verified."); }
    finally { setExecuting(false); }
  };

  const runtimeFindings = classifyRuntimeLogs(execution?.runtime.newErrorsOrWarnings ?? []);
  const completedReviewReady = Boolean(execution && execution.restoration !== "STATE_MISMATCH" && execution.naturalBeautyUnchanged && execution.compile.passed && !runtimeFindings.some((finding) => finding.classification === "ERROR"));
  const operationCount = finalization?.cleanupOperationCount ?? execution?.deleted.length ?? plan?.operations.length ?? 0;

  return <section className="panel technical-iteration-plan" data-cleanup-plan={plan?.planFingerprint ?? "UNAVAILABLE"}>
    <div className="technical-plan-head">
      <div><span>FORENSIC CLEANUP</span><h4>Soft Flash cleanup plan</h4><p>Only proven Soft Flash items can enter this plan.</p></div>
      <div><b>{operationCount}</b><small>{execution ? "COMPLETED operations" : "SAFE operations"}</small></div>
    </div>
    {!plan && !error && <p>Effect Lab is reading the current Lens Studio project.</p>}
    {error && <p className="build-error">{error}</p>}
    {plan && <>
      <div className="quality-gates" aria-label="Cleanup preflight">
        <div><b className={`qa-state ${plan.connectionState === "CONNECTED" ? "pass" : "fail"}`}>{plan.connectionState}</b><strong>Lens Studio MCP</strong><p>{plan.lensName ?? "UNKNOWN"}</p></div>
        <div><b className={`qa-state ${plan.projectFolder === "/Users/debbie/Documents/Effect Lab Training Sandbox" ? "pass" : "fail"}`}>{plan.projectFolder === "/Users/debbie/Documents/Effect Lab Training Sandbox" ? "PASS" : "FAIL"}</b><strong>Project folder</strong><p>{plan.projectFolder ?? "UNKNOWN"}</p></div>
        <div><b className={`qa-state ${finalization?.humanReviewReady || execution ? "pass" : plan.status === "READY_FOR_CONFIRMATION" ? "warning" : "fail"}`}>{finalization ? finalization.restoration.replaceAll("_", " ") : execution ? execution.restoration.replaceAll("_", " ") : plan.status.replaceAll("_", " ")}</b><strong>Cleanup status</strong><p>{finalization ? `${finalization.cleanupOperationCount} confirmed cleanup operations completed.` : execution ? `${execution.deleted.length} confirmed operations completed.` : "Nothing has been deleted."}</p></div>
      </div>
      <div className="technical-plan-list">
        <article><div><span>PROTECTED STATE</span><b className="ready">NATURAL BEAUTY</b></div><h3>Controlled assignments</h3><dl><dt>Grade object</dt><dd><code>{plan.naturalBeauty.gradeObjectId ?? "UNKNOWN"}</code></dd><dt>Grade component</dt><dd><code>{plan.naturalBeauty.gradeComponentId ?? "UNKNOWN"}</code></dd><dt>Grade enabled</dt><dd>{String(plan.naturalBeauty.gradeEnabled ?? "UNKNOWN")}</dd><dt>Material</dt><dd>{plan.naturalBeauty.materialName ?? "UNKNOWN"} · <code>{plan.naturalBeauty.materialId ?? "UNKNOWN"}</code></dd><dt>LUT</dt><dd>{plan.naturalBeauty.lutName ?? "UNKNOWN"} · <code>{plan.naturalBeauty.lutId ?? "UNKNOWN"}</code></dd><dt>Retouch component</dt><dd><code>{plan.naturalBeauty.retouchComponentId ?? "UNKNOWN"}</code></dd><dt>Retouch values</dt><dd>face {plan.naturalBeauty.faceIndex ?? "UNKNOWN"} · skin {plan.naturalBeauty.softSkinIntensity ?? "UNKNOWN"} · teeth {plan.naturalBeauty.teethWhiteningIntensity ?? "UNKNOWN"} · eye sharpness {plan.naturalBeauty.sharpenEyeIntensity ?? "UNKNOWN"} · eye whitening {plan.naturalBeauty.eyeWhiteningIntensity ?? "UNKNOWN"}</dd><dt>Project fingerprint</dt><dd><code>{plan.projectIdentityFingerprint ?? "UNKNOWN"}</code></dd><dt>Verified build fingerprint</dt><dd><code>{finalization?.buildStateFingerprint ?? plan.currentBuildStateFingerprint ?? "UNKNOWN"}</code></dd><dt>Cleanup plan fingerprint</dt><dd><code>{plan.planFingerprint ?? "UNKNOWN"}</code></dd></dl></article>
      </div>
      <div className="technical-plan-list">
        {plan.candidates.map((item) => <article key={`${item.kind}-${item.id}`}>
          <div><span>{item.kind.replaceAll("_", " ")}</span><b className={item.deletionSafety.toLowerCase()}>{item.deletionSafety.replaceAll("_", " ")}</b></div>
          <h3>{item.name}</h3>
          <dl><dt>ID</dt><dd><code>{item.id}</code></dd><dt>Type</dt><dd>{item.type}</dd><dt>Path</dt><dd>{item.path ?? "UNKNOWN"}</dd><dt>Parent</dt><dd>{item.parent?.name ?? "UNKNOWN"}</dd><dt>References</dt><dd>{item.references.length ? item.references.map((reference) => `${reference.sourceName} (${reference.sourceId}).${reference.property}`).join(", ") : "None discovered"}</dd><dt>Evidence</dt><dd>{item.provenanceEvidence.join(" ")}</dd><dt>Reason</dt><dd>{item.deletionReason}</dd></dl>
        </article>)}
      </div>
      {!execution && !finalization && plan.status === "READY_FOR_CONFIRMATION" && <div className="technical-confirmation">
        <div><strong>{plan.operations.length ? "Review every operation before confirmation." : "No deletion can run."}</strong><p>Deletion has no verified rollback mechanism. Natural Beauty values must remain unchanged.</p></div>
        <button disabled title="No cleanup execution has started.">Cancel</button>
        <button className="primary-button" disabled={executing || plan.status !== "READY_FOR_CONFIRMATION"} onClick={() => void confirmCleanup()}>{executing ? "Running cleanup" : "Confirm cleanup"}</button>
      </div>}
      {!execution && !finalization && plan.status === "NO_SAFE_ITEMS" && <div className="technical-confirmation"><div><strong>The approved cleanup has no remaining targets.</strong><p>Verify the final build state and runtime findings.</p></div><button className="primary-button" disabled={executing} onClick={() => void verifyFinalization()}>{executing ? "Verifying" : "Verify final state"}</button></div>}
      {!execution && !finalization && plan.status === "BLOCKED" && plan.blockers.length > 0 && <p className="build-error">{plan.blockers.join(" ")}</p>}
      {execution && <div className="review-message"><strong>{execution.restoration.replaceAll("_", " ")}</strong><p>{execution.deleted.length} confirmed operations completed. Compile: {execution.compile.passed ? "PASS" : "FAIL"}.</p>{runtimeFindings.map((finding, index) => <p key={`${finding.classification}-${index}`}><b>{finding.classification}</b> — {finding.message}</p>)}<p>Human Review: {completedReviewReady ? "READY" : "DISABLED"}.</p></div>}
      {finalization && <div className="review-message"><strong>{finalization.restoration.replaceAll("_", " ")}</strong><p>{finalization.cleanupOperationCount} confirmed cleanup operations completed. Compile: {finalization.compilePassed ? "PASS" : "FAIL"}.</p>{finalization.runtimeFindings.map((finding, index) => <p key={`${finding.classification}-${index}`}><b>{finding.classification}</b> — {finding.message}</p>)}<p>Human Review: {finalization.humanReviewReady ? "READY" : "DISABLED"}.</p><button disabled={executing} onClick={() => void verifyFinalization()}>{executing ? "Verifying" : "Verify again"}</button></div>}
    </>}
  </section>;
}
