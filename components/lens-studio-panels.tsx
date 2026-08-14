"use client";

import { useEffect, useState } from "react";
import type { LensBuildPlan, LensBuildReport, LensBuildSpecification, LensStudioConnectionInfo } from "../types/lens-build";

const disconnected: LensStudioConnectionInfo = {
  state: "DISCONNECTED", message: "Lens Studio is not connected.", serverName: null,
  serverVersion: null, protocolVersion: null, lensStudioVersion: null, capabilities: [],
};

async function readJson(response: Response) {
  const payload = await response.json() as Record<string, unknown>;
  if (!response.ok) throw new Error(String(payload.error ?? "Lens Studio request failed."));
  return payload;
}

export function LensStudioStatusBadge() {
  const [connection, setConnection] = useState(disconnected);
  useEffect(() => { void fetch("/api/lens-studio?action=status", { cache: "no-store" }).then(readJson).then((value) => setConnection(value.connection as LensStudioConnectionInfo)).catch(() => setConnection(disconnected)); }, []);
  return <div className={`connection-pill lens-state-${connection.state.toLowerCase()}`}><i />Lens Studio · {label(connection.state)}</div>;
}

export function LensStudioConnectionPanel({ notify }: { notify?: (message: string) => void }) {
  const [connection, setConnection] = useState(disconnected);
  const [showCapabilities, setShowCapabilities] = useState(false);
  const [busy, setBusy] = useState(false);

  const test = async (action: "test" | "reconnect" = "test") => {
    setBusy(true); setConnection((current) => ({ ...current, state: "CONNECTING", message: "Testing the Lens Studio connection." }));
    try {
      const value = await readJson(await fetch("/api/lens-studio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) }));
      const next = value.connection as LensStudioConnectionInfo; setConnection(next); notify?.(next.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Lens Studio connection failed.";
      setConnection((current) => ({ ...current, state: "ERROR", message })); notify?.(message);
    } finally { setBusy(false); }
  };

  useEffect(() => {
    void fetch("/api/lens-studio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "test" }) })
      .then(readJson).then((value) => setConnection(value.connection as LensStudioConnectionInfo))
      .catch((error: unknown) => setConnection((current) => ({ ...current, state: "ERROR", message: error instanceof Error ? error.message : "Lens Studio connection failed." })));
  }, []);

  return <section className="panel lens-connection-settings">
    <div className="panel-head"><div><h3>Lens Studio</h3><p>Official local MCP connection</p></div><b className={`lens-status ${connection.state.toLowerCase()}`}>{label(connection.state)}</b></div>
    <div className="lens-connection-body">
      <div className="lens-identity"><span className="lens-mark">LS</span><div><strong>{connection.serverName ?? "Lens Studio MCP"}</strong><p>{connection.message}</p></div></div>
      {(connection.lensStudioVersion || connection.serverVersion || connection.protocolVersion) && <dl className="lens-meta">
        {connection.lensStudioVersion && <><dt>Lens Studio</dt><dd>{connection.lensStudioVersion}</dd></>}
        {connection.serverVersion && <><dt>MCP server</dt><dd>{connection.serverVersion}</dd></>}
        {connection.protocolVersion && <><dt>Protocol</dt><dd>{connection.protocolVersion}</dd></>}
        <dt>Capabilities</dt><dd>{connection.capabilities.length}</dd>
      </dl>}
      <div className="lens-actions"><button disabled={busy} onClick={() => void test("test")}>Test connection</button><button disabled={busy} onClick={() => void test("reconnect")}>Reconnect</button><button disabled={!connection.capabilities.length} onClick={() => setShowCapabilities(!showCapabilities)}>View capabilities</button></div>
      {showCapabilities && <div className="capability-list" aria-label="Lens Studio capabilities">{connection.capabilities.map((capability) => <div key={capability.name}><strong>{capability.title ?? capability.name}</strong><code>{capability.name}</code><p>{capability.description}</p></div>)}</div>}
    </div>
  </section>;
}

export function LensStudioBuildPanel() {
  const [specification, setSpecification] = useState<LensBuildSpecification | null>(null);
  const [plan, setPlan] = useState<LensBuildPlan | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [building, setBuilding] = useState(false);
  const [report, setReport] = useState<LensBuildReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const [specValue, planValue] = await Promise.all([
        fetch("/api/lens-studio?action=specification", { cache: "no-store" }).then(readJson),
        fetch("/api/lens-studio?action=plan", { cache: "no-store" }).then(readJson),
      ]);
      setSpecification(specValue.specification as LensBuildSpecification); setPlan(planValue.plan as LensBuildPlan);
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "The Lens build plan could not load."); }
  };
  useEffect(() => {
    void Promise.all([
      fetch("/api/lens-studio?action=specification", { cache: "no-store" }).then(readJson),
      fetch("/api/lens-studio?action=plan", { cache: "no-store" }).then(readJson),
    ]).then(([specValue, planValue]) => {
      setSpecification(specValue.specification as LensBuildSpecification);
      setPlan(planValue.plan as LensBuildPlan);
    }).catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "The Lens build plan could not load."));
  }, []);

  const build = async () => {
    setBuilding(true); setError(null); setReport(null);
    try {
      const value = await readJson(await fetch("/api/lens-studio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "build", confirmed }) }));
      setReport(value.report as LensBuildReport);
    } catch (buildError) { setError(buildError instanceof Error ? buildError.message : "The Lens build failed."); }
    finally { setBuilding(false); }
  };

  if (!specification || !plan) return <section className="panel lens-build-panel"><div className="panel-head"><div><h3>Lens Build Specification</h3><p>{error ?? "Preparing the controlled test."}</p></div></div></section>;
  const blocked = plan.limitations.length > 0 || plan.operations.some((operation) => operation.required && !operation.supported);
  return <section className="panel lens-build-panel">
    <div className="panel-head"><div><h3>Lens Build Specification</h3><p>Review every requirement before the first controlled build.</p></div><span className="status waiting">{report?.status ?? "PLANNED"}</span></div>
    <div className="spec-summary"><div><span>Concept</span><p>{specification.concept}</p></div><div><span>Platform</span><p>{specification.targetPlatform}</p></div><div><span>Categories</span><p>{specification.categories.join(" · ")}</p></div><div><span>Interaction</span><p>{specification.interactionType}</p></div></div>
    <div className="spec-columns"><SpecList title="User experience" items={specification.userExperience}/><SpecList title="Visual direction" items={specification.visualDirection}/><SpecList title="Technical constraints" items={specification.technicalConstraints}/><SpecList title="QA requirements" items={specification.qaRequirements}/></div>
    <div className="build-plan"><h4>Build Plan</h4>{plan.operations.map((operation, index) => <div className="plan-operation" key={operation.id}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{operation.label}</strong><small>{operation.purpose}</small></div><b className={operation.supported ? "supported" : "unsupported"}>{operation.supported ? "SUPPORTED" : "UNAVAILABLE"}</b></div>)}</div>
    {plan.limitations.length > 0 && <div className="lens-limitations"><strong>Build is waiting</strong>{plan.limitations.map((limitation) => <p key={limitation}>{limitation}</p>)}</div>}
    <div className="confirm-spec"><input aria-label="Confirm the Lens Build Specification" id="confirm-lens-build" type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)}/><span><strong>Confirm this Lens Build Specification.</strong><small>The build can change the open Lens Studio project. It cannot publish the Lens.</small></span></div>
    <div className="lens-build-actions"><button onClick={() => void load()}>Refresh plan</button><button className="primary-button" disabled={!confirmed || building || blocked} onClick={() => void build()}>{building ? "Building…" : "Build in Lens Studio"}</button></div>
    {error && <div className="build-error">{error}</div>}
    {report && <BuildReport report={report}/>} 
  </section>;
}

function SpecList({ title, items }: { title: string; items: string[] }) { return <div><h4>{title}</h4>{items.map((item) => <p key={item}>{item}</p>)}</div>; }
function BuildReport({ report }: { report: LensBuildReport }) { return <div className="build-report"><div className="report-head"><div><span>BUILD REPORT</span><h4>{report.lensTitle}</h4></div><b className={`report-${report.status.toLowerCase()}`}>{report.status}</b></div><dl><dt>Compile</dt><dd>{report.compileResult}</dd><dt>Technical QA</dt><dd>{report.technicalQA}</dd><dt>Specification QA</dt><dd>{report.specificationQA}</dd><dt>Visual QA</dt><dd>{report.visualQA}</dd><dt>Experience QA</dt><dd>{report.experienceQA}</dd><dt>Human review</dt><dd>{report.humanReviewRequired ? "Required" : "Not required"}</dd><dt>Completed</dt><dd>{report.operationsCompleted.length}</dd></dl>{report.deprecations.length > 0 && <div className="deprecation-list"><strong>Deprecations</strong>{report.deprecations.map((item) => <p key={item}>{item}</p>)}</div>}<h4>Structured logs</h4><div className="build-logs">{report.logs.map((log, index) => <div key={`${log.timestamp}-${index}`}><time>{new Date(log.timestamp).toLocaleTimeString()}</time><b className={`log-${log.level.toLowerCase()}`}>{log.level}</b><span>{log.step}</span><p>{log.message}</p></div>)}</div>{report.errors.length > 0 && <div className="report-errors">{report.errors.map((item) => <p key={item}>{item}</p>)}</div>}</div>; }
function label(state: LensStudioConnectionInfo["state"]) { return state === "CONNECTED" ? "Connected" : state === "CONNECTING" ? "Connecting" : state === "ERROR" ? "Error" : "Disconnected"; }
