"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { createLearningCurriculum, learningDashboardSummary } from "../services/curriculum-service";
import { BrowserLearningRepository } from "../services/learning-persistence";
import { evaluateLearningBuild, learningWorkflow } from "../services/learning-workflow";
import { OriginalityGuard } from "../services/originality-guard";
import { unknownRewardSuitability } from "../services/publish-candidate-service";
import { TrainingExerciseService } from "../services/training-exercise-service";
import { BrowserPresetCensusRepository } from "../services/preset-census-persistence";
import { assessCurriculumReadiness } from "../services/curriculum-readiness";
import type { LearningCorpus, OfficialLearningResource, PatternCard } from "../types/learning";
import type { CensusSnapshot, PresetRecord, RepresentativeSelection } from "../types/preset-census";
import { FirstWaveView, PresetLibraryView } from "./preset-census-panels";
import type { WorkspaceStatus } from "../types/system-health";
import { beautyPresetInspection } from "../data/beauty-preset-inspection";
import { beautyFaceBatchInspections, beautyFaceBatchKnowledge, beautyFaceBatchPatternCards } from "../data/beauty-face-batch";
import { createBeautyCapabilityMap } from "../services/beauty-face-batch";
import type { BatchPresetInspection, BeautyCapabilityMap, DeepPresetInspection, VerifiedInspectionItem } from "../types/deep-preset-inspection";
import { naturalBeautyLearningPlan } from "../data/natural-beauty-learning";
import { naturalBeautyIteration0, naturalBeautyIteration1 } from "../data/natural-beauty-build-001";
import { naturalBeautyControlledPreviewEvidence, naturalBeautyControlledPreviewSummary } from "../data/natural-beauty-controlled-evidence";
import { naturalBeautyIteration0BuildStateFingerprint, naturalBeautyIteration1BuildStateFingerprint, naturalBeautyProjectIdentityFingerprint } from "../data/natural-beauty-build-state";
import { naturalBeautyAutomatedQualityAssessment, naturalBeautyControlledPropertyDecisions, naturalBeautyOpenEyesQA, naturalBeautyVisibleTeethQA } from "../data/natural-beauty-controlled-evidence-qa";
import type { NaturalBeautyLearningPlan } from "../types/natural-beauty-learning";
import { NaturalBeautyReview } from "./natural-beauty-review";
import { SoftFlashCleanupPanel } from "./soft-flash-cleanup-panel";

type Tab = "overview" | "presets" | "first-wave" | "beauty-preset" | "beauty-map" | "build-001" | "patterns" | "curriculum" | "knowledge";
type Connection = { state: string; message: string; lensStudioVersion: string | null };
const emptyCorpus: LearningCorpus = { patternCards: [], exercises: [], records: [], knowledge: [] };

export function LearningLab({ workspace = null }: { workspace?: WorkspaceStatus | null }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [connection, setConnection] = useState<Connection>({ state: "CONNECTING", message: "Checking Lens Studio MCP.", lensStudioVersion: null });
  const [resources, setResources] = useState<OfficialLearningResource[]>([]);
  const [corpus, setCorpus] = useState<LearningCorpus>(emptyCorpus);
  const [census, setCensus] = useState<CensusSnapshot>({ presets: [], representativeSelection: null, updatedAt: new Date(0).toISOString() });
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const curriculum = useMemo(() => createLearningCurriculum(), []);
  const summary = useMemo(() => learningDashboardSummary(curriculum, corpus), [curriculum, corpus]);
  const readiness = useMemo(() => assessCurriculumReadiness(corpus.patternCards, corpus.knowledge), [corpus]);
  const reward = unknownRewardSuitability();
  const beautyMap = useMemo(() => createBeautyCapabilityMap(beautyFaceBatchInspections), []);

  useEffect(() => {
    if (window.location.hash === "#build-001") window.queueMicrotask(() => setTab("build-001"));
    const repository = new BrowserLearningRepository(window.localStorage);
    repository.load().then((value) => setCorpus(withBeautyInspection(value)));
    new BrowserPresetCensusRepository(window.localStorage).load().then(setCensus);
    fetch("/api/learning-lab").then(async (response) => {
      const data = await response.json() as { connection?: Connection };
      if (data.connection) setConnection(data.connection);
    }).catch(() => setConnection({ state: "ERROR", message: "Effect Lab could not check Lens Studio MCP.", lensStudioVersion: null }));
  }, []);

  const discover = async () => {
    setBusy("discover"); setMessage(null);
    try {
      const response = await fetch("/api/learning-lab", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "discover" }) });
      const data = await response.json() as { connection?: Connection; resources?: OfficialLearningResource[]; presets?: PresetRecord[]; representativeSelection?: RepresentativeSelection; errors?: string[]; error?: string };
      if (data.connection) setConnection(data.connection);
      if (!response.ok) throw new Error(data.error ?? "Official resources could not be discovered.");
      setResources(data.resources ?? []);
      const censusRepository = new BrowserPresetCensusRepository(window.localStorage);
      await censusRepository.saveCensus(data.presets ?? []);
      if (data.representativeSelection) await censusRepository.saveSelection(data.representativeSelection);
      setCensus(await censusRepository.load());
      setMessage((data.presets?.length ?? 0) ? `${data.presets?.length} presets were stored in the evidence census. Categories remain marked as inference.` : data.errors?.[0] ?? "No eligible presets were returned.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Discovery failed."); }
    finally { setBusy(null); }
  };

  const inspectWave = async () => {
    const ids = census.representativeSelection?.selected.map((item) => item.presetId) ?? [];
    setBusy("wave"); setMessage(null);
    try {
      const response = await fetch("/api/learning-lab", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "inspect-wave", presetIds: ids }) });
      const data = await response.json() as { patternCards?: PatternCard[]; presetRecords?: PresetRecord[]; representativeSelection?: RepresentativeSelection; errors?: Array<{ presetId: string; error: string }>; error?: string };
      if (!response.ok) throw new Error(data.error ?? "The read-only first wave failed.");
      const learningRepository = new BrowserLearningRepository(window.localStorage); for (const card of data.patternCards ?? []) await learningRepository.savePatternCard(card); setCorpus(withBeautyInspection(await learningRepository.load()));
      const censusRepository = new BrowserPresetCensusRepository(window.localStorage); for (const record of data.presetRecords ?? []) await censusRepository.savePreset(record); if (data.representativeSelection) await censusRepository.saveSelection(data.representativeSelection); setCensus(await censusRepository.load());
      setMessage(`${data.patternCards?.length ?? 0} presets were metadata-inspected. ${data.errors?.length ?? 0} could not be inspected. Lens Studio was not modified.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "The read-only first wave failed."); }
    finally { setBusy(null); }
  };

  const createExercise = async (card: PatternCard) => {
    const exercise = new TrainingExerciseService().create(card, corpus.exercises.length + 1);
    const assessment = new OriginalityGuard().assess(exercise, { officialResources: resources, exercises: corpus.exercises, localIdeas: [] });
    const assessed = { ...exercise, originalityStatus: assessment.status };
    const repository = new BrowserLearningRepository(window.localStorage);
    await repository.saveExercise(assessed); setCorpus(withBeautyInspection(await repository.load()));
    setMessage(assessment.status === "TOO_SIMILAR" ? "The exercise is too similar. Build is blocked." : assessment.status === "UNKNOWN" ? "The exercise needs more comparison evidence." : "The draft exercise was saved. Complete and confirm its build specification before build.");
  };

  return <>
    <div className="page-heading"><div><span className="eyebrow">TEMPLATE LEARNING MODE</span><h1>Learning Lab</h1><p>Learn from official Lens Studio resources. Build original exercises. Keep every claim tied to evidence.</p></div><div className="heading-actions"><span className={`learning-connection ${connection.state.toLowerCase()}`}><i /> Lens Studio {connection.state}</span><button className="primary-button" onClick={discover} disabled={busy !== null}>{busy === "discover" ? "Discovering…" : "Discover official resources"}</button></div></div>
    <div className="learning-boundary"><span>Official corpus only</span><p>Automatic learning accepts <b>OFFICIAL_SNAP</b> and <b>LOCAL_OFFICIAL_RESOURCE</b>. It does not scrape, copy, publish, or modify Lens Studio during discovery.</p></div>
    {connection.state !== "CONNECTED" && <div className="notice"><span>!</span><div><strong>Lens Studio is not available</strong><p>{connection.message} No resources or Pattern Cards are being fabricated.</p></div></div>}
    {workspace?.sandbox.status !== "VERIFIED" && <div className="notice"><span>!</span><div><strong>The training project is not ready</strong><p>{workspace?.sandbox.reasons.join(" ") || "Effect Lab could not verify the training project."} Learning operations cannot change Lens Studio.</p></div></div>}
    {workspace?.lensProject && <section className="panel sandbox-gate"><div><span>CURRENT TARGET</span><h2>{workspace.lensProject.lensName ?? "Unknown Lens"}</h2><p>{workspace.lensProject.projectFolder ?? "The project folder is unknown."}</p></div><dl><dt>Sandbox</dt><dd>{workspace.sandbox.status}</dd><dt>Fingerprint</dt><dd>{workspace.lensProject.projectFingerprint?.slice(0, 12) ?? "Unknown"}</dd><dt>Checked</dt><dd>{new Date(workspace.lensProject.checkedAt).toLocaleString()}</dd></dl><small>Effect Lab compares the project identity before a modifying learning operation.</small></section>}
    {message && <div className="learning-message" role="status">{message}</div>}
    <div className="learning-tabs" role="tablist" aria-label="Learning Lab sections">{(["overview", "presets", "first-wave", "beauty-preset", "beauty-map", "build-001", "patterns", "curriculum", "knowledge"] as Tab[]).map((item) => <button role="tab" aria-selected={tab === item} className={tab === item ? "active" : ""} key={item} onClick={() => { setTab(item); window.history.replaceState(null, "", item === "build-001" ? "/learning#build-001" : "/learning"); }}>{item === "presets" ? "Preset Library" : item === "first-wave" ? "First wave" : item === "beauty-preset" ? "BeautyPreset" : item === "beauty-map" ? "Beauty map" : item === "build-001" ? "Build 001" : item}</button>)}</div>

    {tab === "overview" && <LearningOverview summary={summary} corpus={corpus} reward={reward} census={census} readiness={readiness} />}
    {tab === "presets" && <PresetLibraryView snapshot={census} />}
    {tab === "first-wave" && <FirstWaveView snapshot={census} busy={busy} inspectWave={inspectWave} />}
    {tab === "beauty-preset" && <BeautyPresetInspectionView inspection={beautyPresetInspection} />}
    {tab === "beauty-map" && <BeautyCapabilityMapView inspections={beautyFaceBatchInspections} map={beautyMap} />}
    {tab === "build-001" && <NaturalBeautyConfirmationView plan={naturalBeautyLearningPlan} workspace={workspace} corpus={corpus} onCorpusChange={(value) => setCorpus(withBeautyInspection(value))} />}
    {tab === "patterns" && <PatternView cards={corpus.patternCards} createExercise={createExercise} curriculumReady={readiness.some((item) => item.status !== "NOT_READY")} />}
    {tab === "curriculum" && <CurriculumView summary={summary} corpus={corpus} />}
    {tab === "knowledge" && <KnowledgeView corpus={corpus} />}
  </>;
}

function withBeautyInspection(corpus: LearningCorpus): LearningCorpus {
  const verifiedCards = [beautyPresetInspection.patternCard, ...beautyFaceBatchPatternCards];
  const cardIds = new Set(verifiedCards.map((card) => card.id));
  const verifiedKnowledge = [...beautyPresetInspection.knowledge, ...beautyFaceBatchKnowledge];
  const knowledgeIds = new Set(verifiedKnowledge.map((entry) => entry.id));
  const exercises = [...corpus.exercises.filter((entry) => entry.id !== naturalBeautyLearningPlan.exercise.id), naturalBeautyLearningPlan.exercise];
  const storedRecord = corpus.records.find((entry) => entry.id === naturalBeautyLearningPlan.draftRecord.id);
  const currentRecord = storedRecord ? { ...naturalBeautyIteration1.learningRecord, humanReview: storedRecord.humanReview, finalOutcome: storedRecord.finalOutcome, completedAt: storedRecord.completedAt, reusableLessons: storedRecord.reusableLessons } : naturalBeautyIteration1.learningRecord;
  const records = [...corpus.records.filter((entry) => entry.id !== naturalBeautyLearningPlan.draftRecord.id), currentRecord];
  return { ...corpus, patternCards: [...corpus.patternCards.filter((card) => !cardIds.has(card.id)), ...verifiedCards], knowledge: [...corpus.knowledge.filter((entry) => !knowledgeIds.has(entry.id)), ...verifiedKnowledge], exercises, records };
}

function NaturalBeautyConfirmationView({ plan, workspace, corpus, onCorpusChange }: { plan: NaturalBeautyLearningPlan; workspace: WorkspaceStatus | null; corpus: LearningCorpus; onCorpusChange: (corpus: LearningCorpus) => void }) {
  const specification = plan.specification;
  const expectedObjects = ["Camera Object", "Envmap", "Light", "Lighting", "AiPreviewAgent Handler"];
  const unexpected = workspace?.lensProject?.keySceneObjects.filter((name) => !expectedObjects.includes(name)) ?? [];
  const checks = [
    ["Sandbox", workspace?.sandbox.status ?? "UNKNOWN", workspace?.sandbox.status === "VERIFIED"],
    ["Connection", workspace?.lensConnectionSource ?? "UNKNOWN", workspace?.lensConnectionSource === "MANUAL_CONFIG"],
    ["Lens", workspace?.lensProject?.lensName ?? "UNKNOWN", workspace?.lensProject?.lensName === specification.sandboxRequirements.lensName],
    ["Folder", workspace?.lensProject?.projectFolder ?? "UNKNOWN", workspace?.lensProject?.projectFolder === specification.sandboxRequirements.projectFolder],
    ["Baseline", workspace?.lensProject?.projectFingerprint?.slice(0, 12) ?? "UNKNOWN", workspace?.lensProject?.projectFingerprint === specification.sandboxRequirements.baselineFingerprint],
    ["Unexpected objects", unexpected.length ? unexpected.join(", ") : "None", unexpected.length === 0 && Boolean(workspace?.lensProject)],
  ] as const;
  return <div className="natural-beauty-build">
    <section className="panel natural-build-head" data-build-id={plan.id}><div><span className="eyebrow">LEARNING BUILD 001 · ITERATION 1</span><h2>{specification.title}</h2><p>{specification.creativeObjective}</p></div><div><span>{(corpus.records.find((entry) => entry.id === naturalBeautyIteration1.learningRecord.id)?.completedAt ? "COMPLETE" : naturalBeautyIteration1.status).replaceAll("_", " ")}</span><strong>Lens Studio is modified.</strong><small>The approved isolated change is complete.</small></div></section>
    <section className="iteration-comparison" aria-label="Natural Beauty preview comparison"><article className="panel iteration-zero-review"><Image src={naturalBeautyIteration0.previewPath} alt="Natural Beauty Iteration 0 Lens Studio preview" width={720} height={1280}/><div><span className="eyebrow">ITERATION 0 · REAL VISION QA</span><h2>Faulty colour grade enabled</h2><strong>{naturalBeautyIteration0.visualQA.overallScore} / 10</strong><p>Visual QA: {naturalBeautyIteration0.visualQA.status}</p></div></article><article className="panel iteration-zero-review iteration-one"><Image src={naturalBeautyIteration1.previewPath} alt="Natural Beauty Iteration 1 Lens Studio preview" width={720} height={1280}/><div><span className="eyebrow">ITERATION 1 · REAL VISION QA</span><h2>Faulty colour grade disabled</h2><strong>{naturalBeautyIteration1.visualQA.overallScore} / 10</strong><p>Technical QA: {naturalBeautyIteration1.technicalQA} · Final Visual QA gate: {naturalBeautyAutomatedQualityAssessment.visualQA}</p><small>{naturalBeautyIteration1.visualQA.provider} · {naturalBeautyIteration1.visualQA.model} · confidence {naturalBeautyIteration1.visualQA.confidence}</small></div></article></section>
    <section className="controlled-qa-grid" aria-label="Natural Beauty quality gates"><article className="panel"><span className="eyebrow">AUTOMATED QUALITY</span><h2>Required gates</h2><p>Technical QA: {naturalBeautyAutomatedQualityAssessment.technicalQA}</p><p>Specification QA: {naturalBeautyAutomatedQualityAssessment.specificationQA}</p><p>Visual QA: {naturalBeautyAutomatedQualityAssessment.visualQA}</p><p>Experience QA: {naturalBeautyAutomatedQualityAssessment.experienceQA}</p></article><article className="panel"><span className="eyebrow">ITERATION DECISION</span><h2>{naturalBeautyAutomatedQualityAssessment.automatedIterationRecommendation}</h2><p>{naturalBeautyAutomatedQualityAssessment.iteration2ReadyOperations.length} READY Iteration 2 operations.</p><p>{naturalBeautyAutomatedQualityAssessment.workflowStatus.replaceAll("_", " ")}</p></article></section>
    <section className="panel evidence-matrix"><header><div><span className="eyebrow">CONTROLLED PREVIEW EVIDENCE</span><h2>Iteration 1 evidence matrix</h2><p>Each image stays local until you explicitly approve external Visual QA.</p></div><b>{naturalBeautyControlledPreviewSummary.sufficientForIteration2 ? "SUFFICIENT" : "MORE EVIDENCE REQUIRED"}</b></header><div>{naturalBeautyControlledPreviewEvidence.map((entry) => <article key={entry.condition}><div><strong>{entry.condition === "OPEN_EYES" ? "Open eyes" : entry.condition === "VISIBLE_TEETH" ? "Visible teeth" : "Close skin view"}</strong><b className={entry.state.toLowerCase()}>{entry.state}</b></div>{entry.imagePath ? <Image src={entry.imagePath} alt={`${entry.condition.replaceAll("_", " ").toLowerCase()} preview evidence`} width={720} height={1280}/> : <div className="evidence-unavailable">No preview</div>}<p>{entry.evidence}</p>{entry.manualAction && <small>{entry.manualAction}</small>}<span>{entry.externalSubmission.replaceAll("_", " ")}</span></article>)}</div></section>
    <section className="controlled-qa-grid"><article className="panel"><span className="eyebrow">OPEN EYES · REAL VISION QA</span><h2>{naturalBeautyOpenEyesQA.status} · {naturalBeautyOpenEyesQA.overallScore} / 10</h2>{naturalBeautyOpenEyesQA.strengths.map((finding) => <p key={finding}>{finding}</p>)}<small>Confidence {naturalBeautyOpenEyesQA.confidence}. This does not prove close-range skin texture.</small></article><article className="panel"><span className="eyebrow">VISIBLE TEETH · REAL VISION QA</span><h2>{naturalBeautyVisibleTeethQA.status} · {naturalBeautyVisibleTeethQA.overallScore} / 10</h2>{naturalBeautyVisibleTeethQA.strengths.map((finding) => <p key={finding}>{finding}</p>)}<small>Confidence {naturalBeautyVisibleTeethQA.confidence}. This does not prove close-range skin texture.</small></article></section>
    <section className="panel property-evidence"><header><div><span className="eyebrow">PROPERTY EVIDENCE</span><h2>Current value decisions</h2></div><b>NO ITERATION 2 OPERATIONS READY</b></header><div>{naturalBeautyControlledPropertyDecisions.map((entry) => <article key={entry.property}><code>{entry.property}</code><strong>{entry.value}</strong><b className={entry.decision.toLowerCase()}>{entry.decision.replaceAll("_", " ")}</b><p>{entry.evidence}</p></article>)}</div></section>
    <section className="panel fingerprint-evidence"><header><div><span className="eyebrow">TECHNICAL EVIDENCE</span><h2>Iteration fingerprints</h2><p>The project fingerprint verifies sandbox identity. The build fingerprint verifies controlled component state.</p></div></header><dl><dt>Project Identity Fingerprint</dt><dd><code>{naturalBeautyProjectIdentityFingerprint}</code><small>Unchanged between Iterations 0 and 1.</small></dd><dt>Iteration 0 Build State Fingerprint</dt><dd><code>{naturalBeautyIteration0BuildStateFingerprint}</code><small>Colour grade enabled.</small></dd><dt>Iteration 1 Build State Fingerprint</dt><dd><code>{naturalBeautyIteration1BuildStateFingerprint}</code><small>Colour grade disabled.</small></dd></dl></section>
    <section className="panel visual-findings-panel"><header><div><span className="eyebrow">ITERATION 1 FINDINGS</span><h2>Low-priority evidence gaps</h2></div><b>{naturalBeautyIteration1.visualQA.iterationPriority} PRIORITY</b></header><div>{naturalBeautyIteration1.visualQA.findings.map((finding) => <article key={`${finding.type}-${finding.description}`}><span className={finding.severity.toLowerCase()}>{finding.severity}</span><div><strong>{finding.description}</strong><p>{finding.evidence}</p><small>{finding.recommendedChange}</small></div></article>)}</div></section>
    <section className="panel visual-findings-panel"><header><div><span className="eyebrow">EVIDENCE-BASED FINDINGS</span><h2>Visible issues</h2></div><b>{naturalBeautyIteration0.visualQA.iterationPriority} PRIORITY</b></header><div>{naturalBeautyIteration0.visualQA.findings.map((finding) => <article key={`${finding.type}-${finding.description}`}><span className={finding.severity.toLowerCase()}>{finding.severity}</span><div><strong>{finding.description}</strong><p>{finding.evidence}</p><small>{finding.recommendedChange}</small></div></article>)}</div></section>
    <section className="panel retrieval-panel"><header><div><span className="eyebrow">KNOWLEDGE RETRIEVED FIRST</span><h2>Pattern decisions</h2></div><small>{plan.retrievedCards.length} verified Pattern Cards</small></header><div>{specification.patternDecisions.map((entry) => <article key={entry.patternCardId}><div><strong>{entry.presetName}</strong><b className={entry.decision.toLowerCase()}>{entry.decision.replaceAll("_", " ")}</b></div><p>{entry.reason}</p></article>)}</div></section>
    <div className="natural-build-grid"><section className="panel architecture-panel"><span className="eyebrow">PROPOSED ARCHITECTURE</span><h2>Two verified mechanisms</h2>{specification.proposedComponents.map((component) => <article key={component.name}><strong>{component.name}</strong><small>{component.type} · learned from {component.sourcePattern}</small><p>{component.purpose}</p></article>)}<h3>Assets</h3>{specification.assetRequirements.map((asset) => <p key={asset.name}>{asset.name} · {asset.kind} · {asset.source}</p>)}</section><section className="panel lut-decision"><span className="eyebrow">COLOUR DECISION · OPTION B</span><h2>Original Natural Beauty LUT</h2><p>{specification.colourDecision.decision}</p><strong>Provenance</strong><p>{specification.colourDecision.provenance}</p>{specification.colourDecision.constraints.map((constraint) => <small key={constraint}>{constraint}</small>)}<b>{specification.colourDecision.aestheticStatus.replaceAll("_", " ")}</b></section></div>
    <section className="panel retouch-proposal"><header><div><span className="eyebrow">PROPOSED DESIGN VALUES</span><h2>RetouchVisual controls</h2><p>These values are not verified aesthetic outcomes.</p></div></header><div className="retouch-table"><div className="retouch-row retouch-labels"><span>Property</span><span>Official preset</span><span>Natural Beauty</span><span>Relation</span><span>Reason</span></div>{specification.proposedPropertyValues.map((entry) => <div className="retouch-row" key={entry.property}><strong>{entry.property}</strong><code>{entry.officialPresetValue}</code><code>{entry.proposedValue}</code><b>{entry.relation}</b><p>{entry.reason}</p></div>)}</div></section>
    <div className="natural-build-grid"><section className="panel build-unknowns"><span className="eyebrow">KNOWN UNKNOWNS</span><h2>Evidence still required</h2>{specification.knownUnknowns.map((value) => <p key={value}>{value}</p>)}</section><section className="panel build-unknowns"><span className="eyebrow">VISUAL QA</span><h2>Iteration 0 criteria</h2>{specification.visualQACriteria.map((value) => <p key={value}>{value}</p>)}</section></div>
    <section className="panel preflight-panel"><header><div><span className="eyebrow">FUTURE EXECUTION PREFLIGHT</span><h2>Sandbox safety</h2><p>Every check must pass again immediately before a confirmed build.</p></div><b>{checks.every((entry) => entry[2]) ? "CURRENTLY MATCHES" : "NOT READY"}</b></header><div>{checks.map(([label, value, pass]) => <article key={label}><span>{label}</span><strong>{value}</strong><b className={pass ? "pass" : "fail"}>{pass ? "PASS" : "BLOCK"}</b></article>)}</div></section>
    <section className="panel effectiveness-panel"><span className="eyebrow">LEARNING EFFECTIVENESS</span><h2>Evidence contribution</h2><div><article><strong>{plan.learningEffectiveness.retrievedPatternCards}</strong><span>Patterns retrieved</span></article><article><strong>{plan.learningEffectiveness.selectedPatternCards}</strong><span>Patterns selected</span></article><article><strong>{plan.learningEffectiveness.successfulLearnedOperations.length}</strong><span>Successful operations</span></article><article><strong>{plan.learningEffectiveness.failedOperations.length}</strong><span>Failed operations</span></article><article><strong>{plan.learningEffectiveness.qaResult}</strong><span>QA result</span></article><article><strong>{plan.learningEffectiveness.humanResult}</strong><span>Human result</span></article></div><p>No universal percentage is calculated.</p></section>
    <section className="panel technical-iteration-review"><header><div><span className="eyebrow">ITERATION 1 · EXECUTED PLAN</span><h2>Historical Lens Studio change</h2><p>{naturalBeautyIteration0.iterationPlan.inspectionMessage}</p></div><strong>{naturalBeautyIteration0.iterationPlan.readyOperationCount} EXECUTED</strong></header>{naturalBeautyIteration0.iterationPlan.changes.map((change) => <article key={change.id}><div><span>{change.category}</span><b className={change.status.toLowerCase()}>{change.status.replaceAll("_", " ")}</b></div><h3>{change.visualProblem}</h3><dl><dt>Target object</dt><dd>{change.targetObject?.name ?? "UNKNOWN"}</dd><dt>Component or asset</dt><dd>{change.targetComponentOrAsset?.name ?? "UNKNOWN"}</dd><dt>Property</dt><dd>{change.targetPropertyOrParameter ?? "UNKNOWN"}</dd><dt>Current</dt><dd>{formatValue(change.currentValue)}</dd><dt>Proposed</dt><dd>{change.proposedValueOrOperation ?? "No operation"}</dd><dt>Expected</dt><dd>{change.expectedVisualResult}</dd><dt>Confidence</dt><dd>{change.confidence}</dd><dt>Reversible</dt><dd>{change.reversible ? "Yes" : "No verified operation"}</dd></dl></article>)}</section>
    <section className="panel confirmation-gate"><div className="review-message"><span className="eyebrow">HUMAN REVIEW GATE</span><h2>Learning Build 001 awaits human review</h2><p>Technical QA, Specification QA, and scoped Visual QA passed. Experience QA remains a warning because static previews do not prove movement, recording, startup, reset behaviour, or broad camera coverage.</p><strong role="status">{naturalBeautyAutomatedQualityAssessment.workflowStatus.replaceAll("_", " ")}. The Lens remains training-only. Nothing was published.</strong></div></section>
    <SoftFlashCleanupPanel />
    <NaturalBeautyReview record={corpus.records.find((entry) => entry.id === naturalBeautyIteration1.learningRecord.id) ?? naturalBeautyIteration1.learningRecord} onCorpusChange={onCorpusChange} />
    <section className="panel knowledge-gap"><div><span className="eyebrow">KNOWLEDGE GAP</span><h2>Original LUT generation and encoding</h2><p>The required Lens Studio LUT packing and channel encoding are not verified. This build does not support a general claim about LUT quality.</p></div><div><strong>Future learning target</strong><p>Lens Studio LUT Construction and Encoding</p><small>Not investigated in this task.</small></div></section>
  </div>;
}

function BeautyCapabilityMapView({ inspections, map }: { inspections: BatchPresetInspection[]; map: BeautyCapabilityMap }) {
  const [selected, setSelected] = useState(inspections[0].presetName);
  const current = inspections.find((entry) => entry.presetName === selected) ?? inspections[0];
  const groups: Array<[string, VerifiedInspectionItem[]]> = [["Objects", current.sceneObjects], ["Components", current.components], ["Materials", current.materials], ["Shaders", current.shaders], ["Textures", current.textures], ["Scripts", current.scripts]];
  return <div className="beauty-capability-map">
    <section className="panel batch-head"><div><span className="eyebrow">CONTROLLED BATCH COMPLETE</span><h2>Beauty Capability Map</h2><p>Five inspected presets. Verified facts stay separate from design inferences.</p></div><dl><dt>Batch progress</dt><dd>4 / 4</dd><dt>Current preset</dt><dd>Complete</dd><dt>Pattern Cards</dt><dd>5</dd><dt>Lens Studio</dt><dd>Clean baseline</dd></dl></section>
    <section className="batch-progress" aria-label="Beauty preset batch progress">{inspections.map((entry) => <button key={entry.presetName} className={selected === entry.presetName ? "active" : ""} onClick={() => setSelected(entry.presetName)}><span>{String(entry.order).padStart(2, "0")}</span><strong>{entry.presetName}</strong><small>{entry.status} · reset {entry.resetMatchesBaseline ? "EXACT" : "MISMATCH"}</small></button>)}</section>
    <section className="panel batch-detail"><header><div><span className="eyebrow">{current.patternCard.inspectionLevel}</span><h2>{current.presetName}</h2><p>Confidence {current.patternCardBeforeConfidence} → {current.patternCard.confidence}</p></div><b>{current.resetStatus}</b></header>{current.previewPath && <Image src={current.previewPath} alt={`${current.presetName} preview`} width={720} height={1280}/>}<div className="batch-detail-groups">{groups.map(([label, entries]) => <article key={label}><h3>{label} <span>{entries.length}</span></h3>{entries.length ? entries.map((entry) => <div key={`${label}-${entry.id ?? entry.name}`}><strong>{entry.name}</strong><small>{entry.type} · {entry.evidenceLevel}</small>{entry.properties?.map((value) => <p key={value.name}><span>{value.name}</span> {formatValue(value.value)}</p>)}</div>) : <p>None observed.</p>}</article>)}</div><div className="batch-runtime"><div><h3>Runtime</h3><p>Compile: {current.runtime.compile}</p>{current.runtime.findings.map((finding) => <p key={finding}>{finding}</p>)}</div><div><h3>Important UNKNOWN</h3>{current.unknowns.map((unknown) => <p key={unknown}>{unknown}</p>)}</div></div></section>
    <section className="capability-facts"><div className="panel"><span className="eyebrow">VERIFIED FACTS</span><h2>Available evidence</h2>{map.verifiedFacts.map((fact) => <article key={fact.area}><header><strong>{fact.area}</strong><b>{fact.evidenceLevel}</b></header><p>{fact.finding}</p><small>{fact.sources.join(", ")}</small></article>)}</div><div className="panel"><span className="eyebrow">INFERRED DESIGN USES</span><h2>Not yet verified as builds</h2>{map.inferredDesignUses.map((entry) => <article key={entry.use}><header><strong>{entry.use}</strong><b>{entry.status}</b></header><p>{entry.basis}</p></article>)}</div></section>
    <section className="panel capability-readiness"><span className="eyebrow">CURRICULUM READINESS</span><h2>Evidence-based status</h2><div>{map.readiness.map((entry) => <article key={entry.category}><header><strong>{entry.category}</strong><b className={entry.status.toLowerCase()}>{entry.status}</b></header>{entry.reasons.map((reason) => <p key={reason}>{reason}</p>)}</article>)}</div></section>
  </div>;
}

function BeautyPresetInspectionView({ inspection }: { inspection: DeepPresetInspection }) {
  const groups: Array<[string, VerifiedInspectionItem[]]> = [["Scene objects", inspection.sceneObjects], ["Components", inspection.components], ["Materials", inspection.materials], ["Shaders", inspection.shaders], ["Textures and LUTs", inspection.textures], ["Scripts", inspection.scripts]];
  return <div className="deep-inspection">
    <section className="panel deep-inspection-head"><div><span className="eyebrow">{inspection.inspectionLevel}</span><h2>{inspection.presetName}</h2><p>Evidence from the verified disposable Lens Studio sandbox.</p></div><dl><dt>Sandbox</dt><dd>{inspection.sandbox.status}</dd><dt>Connection</dt><dd>{inspection.sandbox.connectionSource}</dd><dt>Pattern confidence</dt><dd>{inspection.patternCardBeforeConfidence} → {inspection.patternCard.confidence}</dd><dt>Reset</dt><dd>{inspection.resetStatus}</dd></dl></section>
    <section className="panel deep-confirmation"><span>CONFIRMED ACTION</span><h3>{inspection.confirmation.action}</h3><p>{inspection.confirmation.risk}</p><small>Operation: {inspection.instantiation.operation} · ID: {inspection.instantiation.returnedId}</small></section>
    {inspection.previewPath && <section className="panel deep-preview"><Image src={inspection.previewPath} alt="BeautyPreset Lens Studio preview" width={720} height={1280}/><div><span className="eyebrow">PREVIEW EVIDENCE</span><h3>Preview captured</h3><p>Visual QA was not run.</p><small>Captured {new Date(inspection.capturedAt).toLocaleString()}</small></div></section>}
    <div className="deep-grid">{groups.map(([label, values]) => <section className="panel deep-group" key={label}><header><h3>{label}</h3><span>{values.length}</span></header>{values.length ? values.map((value) => <article key={`${label}-${value.id}`}><div><strong>{value.name}</strong><small>{value.type} · {value.id}</small><small>{value.path ?? "No path"}</small></div><b>{value.evidenceLevel}</b>{value.properties?.map((property) => <dl key={property.name}><dt>{property.name}</dt><dd>{formatValue(property.value)}</dd><small>{property.evidenceLevel}</small></dl>)}</article>) : <p>None were created by BeautyPreset.</p>}</section>)}</div>
    <section className="panel deep-group"><header><h3>Dependencies</h3><span>{inspection.dependencies.length}</span></header>{inspection.dependencies.map((dependency) => <article key={`${dependency.from}-${dependency.to}`}><div><strong>{dependency.from}</strong><small>→ {dependency.to}</small></div><b>{dependency.evidenceLevel}</b></article>)}</section>
    <div className="deep-grid"><section className="panel deep-summary"><h3>Runtime findings</h3><dl><dt>Compile</dt><dd>{inspection.runtime.compile}</dd><dt>Errors</dt><dd>{inspection.runtime.errors.length || "None"}</dd><dt>Warnings</dt><dd>{inspection.runtime.warnings.length || "None"}</dd><dt>Deprecations</dt><dd>{inspection.runtime.deprecations.length || "None"}</dd><dt>Behavior</dt><dd>{inspection.runtime.behaviorEvidence}</dd></dl>{inspection.runtime.findings.map((finding) => <p key={finding}>{finding}</p>)}</section><section className="panel deep-summary"><h3>Remaining unknown</h3>{inspection.remainingUnknown.map((value) => <p key={value}>{value}</p>)}</section></div>
    <section className="panel deep-reset"><span>{inspection.resetStatus}</span><h3>{inspection.lensStudioModified ? "The sandbox is still modified." : "The sandbox baseline is restored."}</h3><p>{inspection.resetReason}</p><small>Baseline {inspection.sandbox.baselineFingerprint.slice(0, 12)} · Inspection result {inspection.sandbox.resultFingerprint.slice(0, 12)}</small></section>
  </div>;
}

function LearningOverview({ summary, corpus, reward, census, readiness }: { summary: ReturnType<typeof learningDashboardSummary>; corpus: LearningCorpus; reward: ReturnType<typeof unknownRewardSuitability>; census: CensusSnapshot; readiness: ReturnType<typeof assessCurriculumReadiness> }) {
  return <>
    <section className="learning-metrics" aria-label="Learning progress">{[
      ["Curriculum", `${summary.completed}/${summary.target}`, "Completed exercises"], ["Resources inspected", String(summary.inspectedResources), "Current evidence"], ["Pattern Cards", String(summary.patternCards), "Saved locally"], ["Verified capabilities", String(summary.verifiedCapabilities), "Evidence required"], ["Publish candidates", String(summary.publishCandidates), "Human gate required"],
    ].map(([label, value, note]) => <article className="panel" key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}</section>
    <div className="learning-overview-grid"><section className="panel curriculum-progress"><header><div><span className="eyebrow">TARGET 100</span><h2>Curriculum progress</h2></div><strong>{summary.completed}%</strong></header>{summary.categoryProgress.map((item) => <div className="learning-progress-row" key={item.category}><span>{item.category}</span><i><b style={{ width: `${item.target ? item.completed / item.target * 100 : 0}%` }} /></i><small>{item.completed}/{item.target}</small></div>)}</section>
      <section className="panel learning-workflow"><header><span className="eyebrow">CONTROLLED WORKFLOW</span><h2>Evidence to reusable lesson</h2></header>{learningWorkflow.map((step, index) => <div key={step}><span>{String(index + 1).padStart(2, "0")}</span><p>{step}</p></div>)}</section></div>
    <section className="panel learning-outcomes"><div><span className="eyebrow">OUTCOMES</span><h2>Training first. Publishing stays separate.</h2><p>Every completed exercise starts as <b>TRAINING_ONLY</b>. It becomes a <b>PUBLISH_CANDIDATE</b> only after configured QA and human gates pass. Effect Lab never publishes it automatically.</p></div><div className="reward-grid"><div><span>Top Performer potential</span><strong>{reward.topPerformerPotential}</strong></div><div><span>Lens+ potential</span><strong>{reward.lensPlusPotential}</strong></div><small>{reward.disclaimer}</small></div></section>
    <section className="panel readiness-panel"><header><div><span className="eyebrow">CURRICULUM READINESS</span><h2>Verified knowledge by category</h2><p>A census record does not make a category ready.</p></div><small>{census.presets.length} presets in census</small></header><div>{readiness.map((item) => <article key={item.category}><span>{item.category}</span><b className={item.status.toLowerCase()}>{item.status}</b><small>{item.patternCardCount} cards · {item.sceneVerifiedCount} scene verified</small></article>)}</div></section>
    {!corpus.patternCards.length && <Empty title="No learning evidence yet" text="Connect Lens Studio. Discover an eligible official resource. Inspect it before you create an exercise." />}
  </>;
}

function PatternView({ cards, createExercise, curriculumReady }: { cards: PatternCard[]; createExercise: (card: PatternCard) => void; curriculumReady: boolean }) {
  return cards.length ? <div className="pattern-list">{cards.map((card) => <article className="panel pattern-card" key={card.id}><header><div><span className="eyebrow">PATTERN CARD · {card.inspectionLevel ?? "METADATA_INSPECTED"}</span><h2>{card.name}</h2><p>{card.source} · {card.officialResourceType}{card.categoryInferences?.length ? ` · category inference: ${card.categoryInferences.join(", ")}` : ""}</p></div><span className={`confidence ${card.confidence.toLowerCase()}`}>{card.confidence} confidence</span></header><div className="pattern-columns"><dl><EvidenceRow label="Official resource" field="officialResourceName" card={card} value={card.officialResourceName}/><EvidenceRow label="Learning objective" field="learningObjective" card={card} value={card.learningObjective}/><EvidenceRow label="Scene structure" field="sceneStructure" card={card} value={renderObserved(card.sceneStructure)}/><EvidenceRow label="Important objects" field="importantObjects" card={card} value={renderObserved(card.importantObjects)}/></dl><dl><EvidenceRow label="Components" field="importantComponents" card={card} value={renderObserved(card.importantComponents)}/><EvidenceRow label="Materials" field="importantMaterials" card={card} value={renderObserved(card.importantMaterials)}/><EvidenceRow label="Scripts" field="importantScripts" card={card} value={renderObserved(card.importantScripts)}/><EvidenceRow label="Properties" field="importantProperties" card={card} value={renderObserved(card.importantProperties)}/></dl></div><div className="unsafe-note"><strong>Unsafe assumptions</strong><p>{card.unsafeAssumptions.join(" ")}</p></div><footer><span>Inspected {new Date(card.inspectedAt).toLocaleString()}</span><button disabled={!curriculumReady} title={curriculumReady ? "Create an original exercise" : "Scene-verified knowledge is required first."} onClick={() => createExercise(card)}>{curriculumReady ? "Create original exercise" : "Curriculum not ready"}</button></footer></article>)}</div> : <Empty title="No Pattern Cards" text="A Pattern Card appears only after Effect Lab inspects an eligible resource through a supported MCP capability." />;
}

function CurriculumView({ summary, corpus }: { summary: ReturnType<typeof learningDashboardSummary>; corpus: LearningCorpus }) {
  return <><section className="panel curriculum-map"><header><div><span className="eyebrow">100 EXERCISES</span><h2>Curriculum allocation</h2><p>Slots are targets. They are not fabricated exercises.</p></div><strong>{summary.completed}/{summary.target}</strong></header><div>{summary.categoryProgress.map((item) => <article key={item.category}><span>{item.category}</span><b>{item.target}</b><small>target exercises</small></article>)}</div></section>
    <section className="panel exercise-list"><header><div><span className="eyebrow">EXERCISES</span><h2>Original build practice</h2></div><small>{corpus.exercises.length} created</small></header>{corpus.exercises.length ? corpus.exercises.map((exercise) => { const decision = evaluateLearningBuild(exercise, corpus.patternCards); return <article key={exercise.id}><div><span className={`originality ${exercise.originalityStatus.toLowerCase()}`}>{exercise.originalityStatus}</span><h3>{exercise.objective}</h3><p>{exercise.creativeBrief}</p></div><dl><dt>Difficulty</dt><dd>{exercise.difficulty}</dd><dt>Workflow</dt><dd>{exercise.workflowStatus}</dd><dt>Build gate</dt><dd>{decision.allowed ? "READY" : decision.reasons.join(" ")}</dd></dl><button disabled title="No confirmed build action is available from this list.">Build unavailable</button></article>; }) : <Empty title="No exercises" text="Create an exercise from an inspected Pattern Card. The originality and confirmation gates run before any build." />}</section></>;
}

function KnowledgeView({ corpus }: { corpus: LearningCorpus }) {
  return <><div className="notice"><span>i</span><div><strong>Evidence rule</strong><p>An LLM assumption cannot become permanent capability knowledge. VERIFIED entries require Lens Studio MCP or official Snap evidence.</p></div></div>{corpus.knowledge.length ? <div className="knowledge-list">{corpus.knowledge.map((entry) => <article className="panel" key={entry.id}><span>{entry.status}</span><h3>{entry.capability}</h3><p>{entry.statement}</p><small>{entry.evidenceSource ?? "No evidence source"}</small></article>)}</div> : <Empty title="No capability claims saved" text="Verified knowledge will appear here after a supported capability is observed and its evidence is recorded." />}</>;
}

function Empty({ title, text }: { title: string; text: string }) { return <div className="panel learning-empty"><span>◇</span><h2>{title}</h2><p>{text}</p></div>; }
function renderObserved(items: unknown[]) { return items.map((item) => item === "UNKNOWN" ? "UNKNOWN" : item && typeof item === "object" && "name" in item ? String((item as { name: unknown }).name) : "UNKNOWN").join(", "); }
function formatValue(value: unknown) { return typeof value === "string" ? value : JSON.stringify(value); }
function EvidenceRow({ label, field, card, value }: { label: string; field: string; card: PatternCard; value: string }) { const level = card.fieldEvidence?.[field] ?? "UNKNOWN"; return <><dt>{label}<small className={`evidence-level ${level.toLowerCase()}`}>{level.replaceAll("_", " ")}</small></dt><dd>{value}</dd></>; }
