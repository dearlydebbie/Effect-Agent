import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LensStudioConnectionService, type LensStudioToolResult } from "../services/lens-studio-connection";
import { inspectLensProject, verifyLearningSandbox } from "../services/lens-project-identity";
import { classifyRuntimeLogs } from "../services/runtime-log-classifier";

const ITERATION_0_FINGERPRINT = "9f71141d7e38d9d4e5ff605d2a6f5ac5c19b918683fb2d881eb60b7dc5135af3";
const PROJECT_PATH = "/Users/debbie/Documents/Effect Lab Training Sandbox";
const SNAPSHOT_PATH = join(PROJECT_PATH, ".virtual-scene.json");
const PREVIEW_PATH = "/Users/debbie/Documents/effect-agent/public/natural-beauty-iteration-1.png";
const EVIDENCE_PATH = "/private/tmp/effect-lab-natural-beauty-iteration-1.json";
const GRADE_OBJECT_ID = "95954e47-3175-4685-a1a6-93e78436c207";
const GRADE_COMPONENT_ID = "ea8d555f-5f9d-4e8a-bb65-1769008c0d9e";
const RETOUCH_OBJECT_ID = "3e2b87d4-94cf-41c1-88be-2a08ac2117e8";
const RETOUCH_COMPONENT_ID = "ac14ad83-f8b6-4187-a0cc-8ab272902e37";
const connection = LensStudioConnectionService.fromEnvironment();
const operations: Array<{ step: string; tool: string; result: unknown }> = [];
let changed = false;

try {
  const info = await connection.testConnection();
  if (info.state !== "CONNECTED") throw new Error(info.message);
  const beforeIdentity = await inspectLensProject(connection);
  const verification = verifyLearningSandbox(beforeIdentity, true);
  if (process.env.LENS_STUDIO_MCP_CONNECTION_SOURCE !== "MANUAL_CONFIG") throw new Error("The connection source is not MANUAL_CONFIG.");
  if (beforeIdentity.lensName !== "Effect Lab Sandbox") throw new Error(`The live Lens name is ${beforeIdentity.lensName ?? "UNKNOWN"}.`);
  if (beforeIdentity.projectFolder !== PROJECT_PATH) throw new Error(`The live project path is ${beforeIdentity.projectFolder ?? "UNKNOWN"}.`);
  if (beforeIdentity.projectFingerprint !== ITERATION_0_FINGERPRINT) throw new Error("The live project does not match the confirmed Iteration 0 fingerprint.");
  const acceptedRecordedDeltaMarker = verification.status === "MISMATCH"
    && verification.reasons.length === 1
    && verification.excludedMarkersFound.length === 1
    && verification.excludedMarkersFound[0] === "color_correction";
  if (verification.status !== "VERIFIED" && !acceptedRecordedDeltaMarker) throw new Error(`Sandbox verification is ${verification.status}: ${verification.reasons.join(" ")}`);

  const beforeScene = await virtualScene();
  const before = inspectTargets(beforeScene);
  assertIteration0(before);

  await mutation("disable faulty colour grade", "scene-graphql", {
    query: `mutation { setEnabled(id:${q(GRADE_COMPONENT_ID)}, enabled:false) { success message id } }`,
  });
  changed = true;

  const compile = parse(await call("RecompileTypeScriptTool", {}));
  operations.push({ step: "compile", tool: "RecompileTypeScriptTool", result: compile });
  if ((compile as { status?: string } | null)?.status !== "succeeded") throw new Error("Iteration 1 compilation failed.");

  const runtimeLogs = parse(await call("RunAndCollectLogsTool", { mode: "refresh", timeoutMs: 10000, settleMinMs: 600, settleQuietMs: 250, settleMaxMs: 1800 }));
  operations.push({ step: "runtime logs", tool: "RunAndCollectLogsTool", result: runtimeLogs });
  const logLines = ((runtimeLogs as { errors?: unknown[] } | null)?.errors ?? []).map((entry) => typeof entry === "string" ? entry : JSON.stringify(entry));
  const classifiedLogs = classifyRuntimeLogs(logLines);
  if (classifiedLogs.some((entry) => entry.classification === "ERROR")) throw new Error("Iteration 1 produced a runtime error.");

  const afterScene = await virtualScene();
  const after = inspectTargets(afterScene);
  assertIteration1(after);
  const previewConfig = parse(await call("PreviewPanelTool", { action: "getConfig" }));
  const preview = parse(await call("PreviewPanelTool", { action: "screenshot", detail: "high", includeChrome: false, outputPath: PREVIEW_PATH }));
  operations.push({ step: "capture Iteration 1", tool: "PreviewPanelTool", result: preview });
  const afterIdentity = await inspectLensProject(connection);

  const evidence = {
    buildId: "learning-build-001-natural-beauty",
    iteration: 1,
    status: "NEEDS_VISUAL_QA",
    confirmed: true,
    approvedOperation: "Set Natural Beauty Grade PostEffectVisual.enabled to false.",
    sandboxVerification: { ...verification, acceptedRecordedDeltaMarker },
    beforeIdentity,
    afterIdentity,
    before,
    after,
    operations,
    compile,
    runtimeLogs,
    classifiedLogs,
    technicalQA: "PASS",
    isolationQA: "PASS",
    preview: { path: PREVIEW_PATH, publicPath: "/natural-beauty-iteration-1.png", config: previewConfig, captured: existsSync(PREVIEW_PATH) },
    lensStudioModified: true,
    rollback: { mechanism: "Set the same verified component enabled property back to true.", verified: false },
  };
  writeFileSync(EVIDENCE_PATH, JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify({ status: evidence.status, technicalQA: evidence.technicalQA, isolationQA: evidence.isolationQA, before: evidence.before, after: evidence.after, classifiedLogs, preview: evidence.preview, afterFingerprint: afterIdentity.projectFingerprint, evidenceFile: EVIDENCE_PATH, lensStudioModified: true }, null, 2));
} catch (error) {
  const message = error instanceof Error ? error.message : "Iteration 1 failed.";
  const rollback = changed ? await restoreIteration0().catch((restoreError) => ({ restored: false, error: restoreError instanceof Error ? restoreError.message : "Rollback failed." })) : { restored: true, notRequired: true };
  writeFileSync(EVIDENCE_PATH, JSON.stringify({ buildId: "learning-build-001-natural-beauty", iteration: 1, status: "FAILED", error: message, operations, rollback }, null, 2));
  console.error(JSON.stringify({ status: "FAILED", error: message, rollback, evidenceFile: EVIDENCE_PATH }, null, 2));
  process.exitCode = 2;
} finally {
  if (existsSync(SNAPSHOT_PATH)) unlinkSync(SNAPSHOT_PATH);
}

async function restoreIteration0() {
  await mutation("restore Iteration 0 colour grade", "scene-graphql", { query: `mutation { setEnabled(id:${q(GRADE_COMPONENT_ID)}, enabled:true) { success message id } }` });
  await call("RecompileTypeScriptTool", {});
  const identity = await inspectLensProject(connection);
  return { restored: identity.projectFingerprint === ITERATION_0_FINGERPRINT, fingerprint: identity.projectFingerprint };
}

function inspectTargets(scene: VirtualScene) {
  const gradeObject = scene.sceneObjects.find((entry) => entry.id === GRADE_OBJECT_ID);
  const grade = gradeObject?.components.find((entry) => entry.id === GRADE_COMPONENT_ID);
  const retouchObject = scene.sceneObjects.find((entry) => entry.id === RETOUCH_OBJECT_ID);
  const retouch = retouchObject?.components.find((entry) => entry.id === RETOUCH_COMPONENT_ID);
  if (!gradeObject || !grade || !retouchObject || !retouch) throw new Error("A recorded Natural Beauty target is missing.");
  return {
    grade: { objectId: gradeObject.id, objectName: gradeObject.name, componentId: grade.id, componentType: grade.type, enabled: grade.enabled ?? grade.properties.enabled },
    retouch: { objectId: retouchObject.id, objectName: retouchObject.name, componentId: retouch.id, componentType: retouch.type, faceIndex: retouch.properties.faceIndex, softSkinIntensity: retouch.properties.softSkinIntensity, teethWhiteningIntensity: retouch.properties.teethWhiteningIntensity, sharpenEyeIntensity: retouch.properties.sharpenEyeIntensity, eyeWhiteningIntensity: retouch.properties.eyeWhiteningIntensity },
  };
}

function assertIteration0(targets: ReturnType<typeof inspectTargets>) {
  if (targets.grade.objectName !== "Natural Beauty Grade" || targets.grade.componentType !== "PostEffectVisual" || targets.grade.enabled !== true) throw new Error("The colour-grade target no longer matches Iteration 0.");
  assertRetouch(targets);
}
function assertIteration1(targets: ReturnType<typeof inspectTargets>) {
  if (targets.grade.enabled !== false) throw new Error("The approved colour-grade operation was not confirmed by readback.");
  assertRetouch(targets);
}
function assertRetouch(targets: ReturnType<typeof inspectTargets>) {
  if (targets.retouch.objectName !== "Natural Beauty Retouch" || targets.retouch.componentType !== "RetouchVisual") throw new Error("The retouch target no longer matches the recorded build.");
  const values = targets.retouch;
  if (!near(values.faceIndex, 0) || !near(values.softSkinIntensity, 0.25) || !near(values.teethWhiteningIntensity, 0.1) || !near(values.sharpenEyeIntensity, 0.2) || !near(values.eyeWhiteningIntensity, 0.08)) throw new Error("A preserved retouch value changed.");
}

async function mutation(step: string, tool: string, args: Record<string, unknown>) {
  const result = await call(tool, args);
  const value = parse(result);
  operations.push({ step, tool, result: value });
  const payload = value as { data?: Record<string, { success?: boolean; message?: string }> } | null;
  const mutationValue = payload?.data ? Object.values(payload.data)[0] : value as { success?: boolean; message?: string } | null;
  if (mutationValue && typeof mutationValue === "object" && "success" in mutationValue && mutationValue.success !== true) throw new Error(`${step} failed: ${mutationValue.message ?? "unknown mutation error"}`);
  return result;
}
async function call(name: string, args: Record<string, unknown>) { const result = await connection.callSupportedTool(name, args); if (result.isError) throw new Error(`${name} returned an error: ${text(result)}`); return result; }
function parse(result: LensStudioToolResult) { const value = text(result); try { return JSON.parse(value); } catch { return value; } }
function text(result: LensStudioToolResult) { return result.content?.filter((entry) => entry.type === "text").map((entry) => entry.text ?? "").join("\n") ?? ""; }
async function virtualScene() { await call("VirtualScene", { command: "read" }); return JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8")) as VirtualScene; }
function near(value: unknown, expected: number) { return typeof value === "number" && Math.abs(value - expected) < 0.00001; }
function q(value: string) { return JSON.stringify(value); }

interface VirtualScene { sceneObjects: SceneObject[] }
interface SceneObject { id: string; name: string; components: Component[] }
interface Component { id: string; type: string; enabled?: boolean; properties: Record<string, unknown> }
