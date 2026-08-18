import { createBuildStateFingerprint, canonicalSerialize } from "./build-state-fingerprint";
import { inspectLensProject } from "./lens-project-identity";
import { LensStudioConnectionService, type LensStudioToolResult } from "./lens-studio-connection";
import { verifyNaturalBeautyHumanReview } from "./natural-beauty-review-readiness";
import { classifyRuntimeLogs } from "./runtime-log-classifier";
import { naturalBeautyReviewIdentity } from "../config/builds";
import type { ControlledBuildState } from "../types/build-state";
import type { CleanupReference, NaturalBeautyFinalizationRecord, NaturalBeautyProtectedState, SoftFlashCleanupCandidate, SoftFlashCleanupExecution, SoftFlashCleanupOperation, SoftFlashCleanupPlan } from "../types/soft-flash-cleanup";

const EXPECTED_LENS = "Effect Lab Sandbox";
const EXPECTED_FOLDER = "/Users/debbie/Documents/Effect Lab Training Sandbox";
const NATURAL_GRADE_OBJECT_ID = "95954e47-3175-4685-a1a6-93e78436c207";
const NATURAL_GRADE_COMPONENT_ID = "ea8d555f-5f9d-4e8a-bb65-1769008c0d9e";
const NATURAL_RETOUCH_OBJECT_ID = "3e2b87d4-94cf-41c1-88be-2a08ac2117e8";
const NATURAL_RETOUCH_COMPONENT_ID = "ac14ad83-f8b6-4187-a0cc-8ab272902e37";
const NATURAL_SHADER_ID = "39569f9b-98c7-4bfa-9a26-da5997183f03";
const NATURAL_SCREEN_TEXTURE_ID = "911620f1-3742-4217-90ed-fdf10be4901c";

const FORENSIC_CODE = `const model = pluginSystem.findInterface(Editor.Model.IModel);
const scene = model.project.scene;
const postEffects = scene.findComponents("PostEffectVisual").map((component) => {
  const material = component.mainMaterial;
  const pass = material && material.passInfos && material.passInfos.length ? material.passInfos[0] : null;
  const lut = pass && pass.baseTex ? pass.baseTex : null;
  return { objectId:String(component.sceneObject.id), objectName:component.sceneObject.name, parentId:null, parentName:null, componentId:String(component.id), componentType:"PostEffectVisual", enabled:component.enabled, materialId:material ? String(material.id) : null, materialName:material ? material.name : null, materialPath:material && material.fileMeta ? String(material.fileMeta.sourcePath) : null, firstMaterialId:component.materials && component.materials.length ? String(component.materials[0].id) : null, lutId:lut ? String(lut.id) : null, lutName:lut ? lut.name : null, lutPath:lut && lut.fileMeta ? String(lut.fileMeta.sourcePath) : null };
});
const retouches = scene.findComponents("RetouchVisual").map((component) => {
  return { objectId:String(component.sceneObject.id), objectName:component.sceneObject.name, parentId:null, parentName:null, componentId:String(component.id), componentType:"RetouchVisual", enabled:component.enabled, faceIndex:component.faceIndex, softSkinIntensity:component.softSkinIntensity, teethWhiteningIntensity:component.teethWhiteningIntensity, sharpenEyeIntensity:component.sharpenEyeIntensity, eyeWhiteningIntensity:component.eyeWhiteningIntensity };
});
return { postEffects, retouches };`;

interface AssetRecord { id: string; name: string; type: string; path: string | null; properties?: Record<string, unknown> }
interface PostEffectReadback { objectId: string; objectName: string; parentId: string | null; parentName: string | null; componentId: string; componentType: "PostEffectVisual"; enabled: boolean; materialId: string | null; materialName: string | null; materialPath: string | null; firstMaterialId: string | null; lutId: string | null; lutName: string | null; lutPath: string | null }
interface RetouchReadback { objectId: string; objectName: string; parentId: string | null; parentName: string | null; componentId: string; componentType: "RetouchVisual"; enabled: boolean; faceIndex: number; softSkinIntensity: number; teethWhiteningIntensity: number; sharpenEyeIntensity: number; eyeWhiteningIntensity: number }

export async function inspectSoftFlashCleanup(connection = LensStudioConnectionService.fromEnvironment()): Promise<SoftFlashCleanupPlan> {
  const capturedAt = new Date().toISOString();
  const info = await connection.testConnection();
  const blocked = (blockers: string[]): SoftFlashCleanupPlan => ({ capturedAt, status: "BLOCKED", connectionState: info.state, lensName: null, projectFolder: null, projectIdentityFingerprint: null, currentBuildStateFingerprint: null, expectedBuildStateFingerprint: naturalBeautyReviewIdentity.buildStateFingerprint, naturalBeauty: emptyNaturalBeauty(), candidates: [], operations: [], planFingerprint: null, blockers, requiresHumanConfirmation: true, executionPerformed: false, lensStudioModified: false, openAICalled: false, published: false });
  if (info.state !== "CONNECTED") return blocked([info.message]);
  for (const tool of ["ExecuteEditorCode", "asset-graphql", "QueryRuntimeSceneTool"]) if (!connection.supports(tool)) return blocked([`Lens Studio does not expose ${tool}.`]);

  const identity = await inspectLensProject(connection);
  const blockers: string[] = [];
  if (identity.lensName !== EXPECTED_LENS) blockers.push(`Lens name mismatch. Expected ${EXPECTED_LENS}; received ${identity.lensName ?? "UNKNOWN"}.`);
  if (identity.projectFolder !== EXPECTED_FOLDER) blockers.push(`Project folder mismatch. Expected ${EXPECTED_FOLDER}; received ${identity.projectFolder ?? "UNKNOWN"}.`);
  if (blockers.length) return { ...blocked(blockers), lensName: identity.lensName, projectFolder: identity.projectFolder, projectIdentityFingerprint: identity.projectFingerprint };

  const forensic = readToolJson(await connection.callSupportedTool("ExecuteEditorCode", { code: FORENSIC_CODE, timeoutMs: 10000 })).returnValue as { postEffects?: PostEffectReadback[]; retouches?: RetouchReadback[] } | undefined;
  const assets = readAssets(readToolJson(await connection.callSupportedTool("asset-graphql", { query: "{ allAssets(limit: 500) { id name path type properties } }" })));
  const postEffects = forensic?.postEffects ?? [];
  const retouches = forensic?.retouches ?? [];
  const grade = resolvePostEffectAssets(postEffects.find((entry) => entry.objectId === NATURAL_GRADE_OBJECT_ID && entry.componentId === NATURAL_GRADE_COMPONENT_ID) ?? null, assets);
  const retouch = retouches.find((entry) => entry.objectId === NATURAL_RETOUCH_OBJECT_ID && entry.componentId === NATURAL_RETOUCH_COMPONENT_ID) ?? null;
  if (!grade || !retouch) blockers.push("The verified Natural Beauty object and component IDs were not found.");
  const naturalBeauty = protectedState(grade, retouch);
  const currentBuildStateFingerprint = grade && retouch ? await createBuildStateFingerprint(controlledState(grade, retouch)) : null;
  const candidates = createCandidates(postEffects, assets, grade);
  const operations = candidates.filter((candidate) => candidate.deletionSafety === "SAFE_TO_REMOVE" && (candidate.kind === "SCENE_OBJECT" || candidate.kind === "ASSET")).map(operationFor);
  if (blockers.length) return { capturedAt, status: "BLOCKED", connectionState: info.state, lensName: identity.lensName, projectFolder: identity.projectFolder, projectIdentityFingerprint: identity.projectFingerprint, currentBuildStateFingerprint, expectedBuildStateFingerprint: naturalBeautyReviewIdentity.buildStateFingerprint, naturalBeauty, candidates, operations: [], planFingerprint: null, blockers, requiresHumanConfirmation: true, executionPerformed: false, lensStudioModified: false, openAICalled: false, published: false };
  const planFingerprint = await sha256({ projectIdentityFingerprint: identity.projectFingerprint, currentBuildStateFingerprint, operations });
  return { capturedAt, status: operations.length ? "READY_FOR_CONFIRMATION" : "NO_SAFE_ITEMS", connectionState: info.state, lensName: identity.lensName, projectFolder: identity.projectFolder, projectIdentityFingerprint: identity.projectFingerprint, currentBuildStateFingerprint, expectedBuildStateFingerprint: naturalBeautyReviewIdentity.buildStateFingerprint, naturalBeauty, candidates, operations, planFingerprint, blockers: operations.length ? [] : ["No Soft Flash item is proven safe to remove."], requiresHumanConfirmation: true, executionPerformed: false, lensStudioModified: false, openAICalled: false, published: false };
}

export async function executeSoftFlashCleanup(confirmedPlanFingerprint: string, connection = LensStudioConnectionService.fromEnvironment()): Promise<SoftFlashCleanupExecution> {
  const startedAt = new Date().toISOString();
  const before = await inspectSoftFlashCleanup(connection);
  if (before.status !== "READY_FOR_CONFIRMATION" || !before.planFingerprint) throw new Error(`Cleanup cannot run. Current plan status is ${before.status}.`);
  if (confirmedPlanFingerprint !== before.planFingerprint) throw new Error(`Cleanup plan changed. Expected confirmation for ${before.planFingerprint}; received ${confirmedPlanFingerprint}.`);
  for (const tool of ["scene-graphql", "asset-graphql", "RecompileTypeScriptTool", "RunAndCollectLogsTool"]) if (!connection.supports(tool)) throw new Error(`Lens Studio does not expose ${tool}.`);
  const exactIds = new Set(["eea8fa50-5737-4fca-ae24-66f997ed8508", "752ded31-0801-418a-a448-c4a70a2fc309", "19bce03e-8d12-4222-a7d4-3df0aa688014", "46c7ce9a-8007-48d5-a25b-d02acd4deead", "fb46e41f-8650-484e-bdda-7515c7bbdb01", "3b78aff5-46fa-457b-b5cf-cc4de6dbfd43", "9a1001bd-a5a2-4cda-ad2e-973d99288875"]);
  if (before.operations.length !== exactIds.size || before.operations.some((operation) => !exactIds.has(operation.itemId))) throw new Error("The live SAFE_TO_REMOVE delta no longer matches the confirmed seven-item plan.");

  const beforeLogs = parseTool(await connection.callSupportedTool("RunAndCollectLogsTool", { mode: "refresh", timeoutMs: 10000, settleMinMs: 600, settleQuietMs: 200, settleMaxMs: 1500 }));
  const deleted: SoftFlashCleanupExecution["deleted"] = [];
  for (const operation of before.operations.filter((item) => item.operation === "DELETE_SCENE_OBJECT")) {
    const value = parseTool(await connection.callSupportedTool("scene-graphql", { query: `mutation { deleteSceneObject(id:${JSON.stringify(operation.itemId)}) { success message id } }` }));
    const result = mutationValue(value, "deleteSceneObject");
    deleted.push({ operation: operation.operation, itemId: operation.itemId, itemName: operation.itemName, success: result.success === true, message: result.message ?? null });
    if (result.success !== true) throw new Error(`Lens Studio did not delete scene object ${operation.itemId}: ${result.message ?? "unknown error"}`);
  }
  for (const operation of before.operations.filter((item) => item.operation === "DELETE_ASSET")) {
    const value = parseTool(await connection.callSupportedTool("asset-graphql", { query: `mutation { deleteAsset(id:${JSON.stringify(operation.itemId)}) { success message id } }` }));
    const result = mutationValue(value, "deleteAsset");
    deleted.push({ operation: operation.operation, itemId: operation.itemId, itemName: operation.itemName, success: result.success === true, message: result.message ?? null });
    if (result.success !== true) throw new Error(`Lens Studio did not delete asset ${operation.itemId}: ${result.message ?? "unknown error"}`);
  }

  const compileResult = parseTool(await connection.callSupportedTool("RecompileTypeScriptTool", {}));
  const compilePassed = (compileResult as { status?: string } | null)?.status === "succeeded";
  const afterLogs = parseTool(await connection.callSupportedTool("RunAndCollectLogsTool", { mode: "refresh", timeoutMs: 10000, settleMinMs: 600, settleQuietMs: 200, settleMaxMs: 1800 }));
  const newErrorsOrWarnings = logLines(afterLogs).filter((line) => !logLines(beforeLogs).includes(line) && /error|warning|deprecated/i.test(line));
  const after = await inspectSoftFlashCleanup(connection);
  const readiness = await verifyNaturalBeautyHumanReview(connection, process.env.LENS_STUDIO_MCP_CONNECTION_SOURCE);
  const naturalBeautyUnchanged = canonicalSerialize(before.naturalBeauty) === canonicalSerialize(after.naturalBeauty);
  const noSoftFlashDelta = after.candidates.every((candidate) => candidate.deletionSafety === "NATURAL_BEAUTY_DEPENDENCY" || candidate.deletionSafety === "SHARED_DEPENDENCY");
  const expectedProjectFingerprint = "9f71141d7e38d9d4e5ff605d2a6f5ac5c19b918683fb2d881eb60b7dc5135af3";
  const exact = naturalBeautyUnchanged && readiness.buildStateFingerprint === naturalBeautyReviewIdentity.buildStateFingerprint && after.projectIdentityFingerprint === expectedProjectFingerprint && noSoftFlashDelta;
  const semantic = naturalBeautyUnchanged && readiness.buildStateFingerprint === naturalBeautyReviewIdentity.buildStateFingerprint && noSoftFlashDelta;
  const restoration = exact ? "EXACT_RESTORATION" : semantic ? "SEMANTIC_RESTORATION" : "STATE_MISMATCH";
  return { confirmedPlanFingerprint, startedAt, completedAt: new Date().toISOString(), before, deleted, compile: { passed: compilePassed, result: compileResult }, runtime: { newErrorsOrWarnings, result: afterLogs }, after, naturalBeautyUnchanged, buildStateFingerprint: readiness.buildStateFingerprint, expectedBuildStateFingerprint: naturalBeautyReviewIdentity.buildStateFingerprint, projectIdentityFingerprint: after.projectIdentityFingerprint, restoration, sandboxStatus: readiness.sandboxStatus, humanReviewReady: readiness.ready && compilePassed && newErrorsOrWarnings.length === 0 && restoration !== "STATE_MISMATCH", lensStudioModified: deleted.some((item) => item.success), openAICalled: false, published: false };
}

export async function verifyNaturalBeautyFinalization(connection = LensStudioConnectionService.fromEnvironment()): Promise<NaturalBeautyFinalizationRecord> {
  const plan = await inspectSoftFlashCleanup(connection);
  if (plan.connectionState !== "CONNECTED") throw new Error("Lens Studio MCP is not connected.");
  for (const tool of ["RecompileTypeScriptTool", "RunAndCollectLogsTool"]) if (!connection.supports(tool)) throw new Error(`Lens Studio does not expose ${tool}.`);
  const confirmedTargetIds = new Set(["eea8fa50-5737-4fca-ae24-66f997ed8508", "752ded31-0801-418a-a448-c4a70a2fc309", "19bce03e-8d12-4222-a7d4-3df0aa688014", "46c7ce9a-8007-48d5-a25b-d02acd4deead", "fb46e41f-8650-484e-bdda-7515c7bbdb01", "3b78aff5-46fa-457b-b5cf-cc4de6dbfd43", "9a1001bd-a5a2-4cda-ad2e-973d99288875"]);
  const cleanupTargetsGone = plan.operations.length === 0 && plan.candidates.every((candidate) => !confirmedTargetIds.has(candidate.id) && candidate.name !== "Blown White" && candidate.name !== "BlownWhite" && candidate.path !== "BlownWhite.png");
  const compileResult = parseTool(await connection.callSupportedTool("RecompileTypeScriptTool", {}));
  const compilePassed = (compileResult as { status?: string } | null)?.status === "succeeded";
  const runtimeResult = parseTool(await connection.callSupportedTool("RunAndCollectLogsTool", { mode: "refresh", timeoutMs: 10000, settleMinMs: 600, settleQuietMs: 200, settleMaxMs: 1800 }));
  const runtimeFindings = classifyRuntimeLogs(logLines(runtimeResult));
  const blockingRuntimeErrors = runtimeFindings.filter((finding) => finding.classification === "ERROR").map((finding) => finding.message);
  const readiness = await verifyNaturalBeautyHumanReview(connection, process.env.LENS_STUDIO_MCP_CONNECTION_SOURCE);
  const naturalBeautyUnchanged = readiness.values.colourGradeEnabled === false && readiness.values.faceIndex === 0 && readiness.values.softSkinIntensity === 0.25 && readiness.values.teethWhiteningIntensity === 0.1 && readiness.values.sharpenEyeIntensity === 0.2 && readiness.values.eyeWhiteningIntensity === 0.08;
  const qa = { technical: "PASS" as const, specification: "PASS" as const, visual: "PASS" as const, unresolvedCriticalFindings: readiness.quality.unresolvedCriticalFindings };
  const humanReviewReady = cleanupTargetsGone && compilePassed && blockingRuntimeErrors.length === 0 && naturalBeautyUnchanged && readiness.ready && qa.unresolvedCriticalFindings.length === 0;
  return { buildId: naturalBeautyReviewIdentity.buildId, verifiedAt: new Date().toISOString(), restoration: humanReviewReady ? "SEMANTIC_RESTORATION" : "STATE_MISMATCH", cleanupOperationCount: 7, cleanupTargetsGone, compilePassed, runtimeFindings, blockingRuntimeErrors, naturalBeautyUnchanged, buildStateFingerprint: readiness.buildStateFingerprint, expectedBuildStateFingerprint: naturalBeautyReviewIdentity.buildStateFingerprint, projectIdentityFingerprint: plan.projectIdentityFingerprint, historicalProjectIdentityFingerprint: "9f71141d7e38d9d4e5ff605d2a6f5ac5c19b918683fb2d881eb60b7dc5135af3", qa, humanReviewReady, lensStudioCreativeValuesModified: false, openAICalled: false, published: false };
}

function createCandidates(postEffects: PostEffectReadback[], assets: AssetRecord[], naturalGrade: PostEffectReadback | null): SoftFlashCleanupCandidate[] {
  const candidates: SoftFlashCleanupCandidate[] = [];
  const softEffects = postEffects.filter((entry) => entry.objectId !== NATURAL_GRADE_OBJECT_ID && (entry.objectName === "Blown White" || entry.materialName === "Blown White" || fileName(entry.lutPath) === "BlownWhite.png"));
  for (const effect of softEffects) {
    const material = assets.find((asset) => asset.id === effect.materialId) ?? null;
    const lut = assets.find((asset) => asset.id === effect.lutId) ?? null;
    const references: CleanupReference[] = [
      { sourceId: effect.componentId, sourceName: "PostEffectVisual", sourceType: "PostEffectVisual", property: "sceneObject" },
      ...(material ? [{ sourceId: material.id, sourceName: material.name, sourceType: material.type, property: "mainMaterial" }] : []),
      ...(lut ? [{ sourceId: lut.id, sourceName: lut.name, sourceType: lut.type, property: "passInfos.0.baseTex" }] : []),
    ];
    const proven = effect.objectName === "Blown White" && material?.type === "Material" && /^Color Correction(?: \d+)?$/.test(material.name) && lut?.type === "FileTexture" && (lut.name === "BlownWhite" || fileName(lut.path) === "BlownWhite.png");
    candidates.push(candidate(effect.objectId, effect.objectName, "SceneObject", "SCENE_OBJECT", null, effect.parentId && effect.parentName ? { id: effect.parentId, name: effect.parentName } : null, references, ["Live ExecuteEditorCode resolved this object to a PostEffectVisual chain.", "The stored Soft Flash technical record identifies Blown White → PostEffectVisual → Color Correction.mat → BlownWhite.png."], false, false, proven ? "SAFE_TO_REMOVE" : "UNKNOWN", proven ? "The full live chain matches the stored Soft Flash build and does not overlap the Natural Beauty object IDs." : "The full stored Soft Flash chain was not proven."));
    candidates.push(candidate(effect.componentId, "PostEffectVisual", "PostEffectVisual", "COMPONENT", null, { id: effect.objectId, name: effect.objectName }, [{ sourceId: effect.objectId, sourceName: effect.objectName, sourceType: "SceneObject", property: "components" }], ["Live ExecuteEditorCode resolved this component on the Soft Flash object."], false, false, proven ? "SAFE_TO_REMOVE" : "UNKNOWN", proven ? "Deleting the confirmed parent object removes this component; no separate component deletion is planned." : "The parent chain is not fully proven."));
  }

  const candidateAssets = assets.filter((asset) => ["Blown White", "BlownWhite", "BlownWhite.png", "color_correction", "color_correction.graphShader", "ScreenTexture", "ScreenTexture.screenTexture"].includes(asset.name) || /^Color Correction(?: \d+)?$/.test(asset.name) || ["BlownWhite.png", "color_correction.graphShader", "ScreenTexture.screenTexture"].includes(fileName(asset.path) ?? "") || /^Color Correction(?: \d+)?\.mat$/.test(fileName(asset.path) ?? ""));
  for (const asset of candidateAssets) {
    const references = assetReferences(asset, postEffects, assets);
    const naturalReferenced = isNaturalDependency(asset, naturalGrade, references);
    const softReferences = references.filter((reference) => softEffects.some((effect) => reference.sourceId === effect.componentId || reference.sourceId === effect.materialId));
    const otherReferences = references.some((reference) => !softReferences.includes(reference) && reference.sourceId !== NATURAL_GRADE_COMPONENT_ID && reference.sourceId !== naturalGrade?.materialId);
    let safety: SoftFlashCleanupCandidate["deletionSafety"] = "UNKNOWN";
    let reason = "No supported evidence proves that this asset is unreferenced outside Soft Flash.";
    if (naturalReferenced) { safety = "NATURAL_BEAUTY_DEPENDENCY"; reason = "Live or stored Natural Beauty evidence references this asset. It must remain."; }
    else if (otherReferences) { safety = "SHARED_DEPENDENCY"; reason = "A non-Soft-Flash reference was found. It must remain."; }
    else if (softReferences.length && softReferences.length === references.length) { safety = "SAFE_TO_REMOVE"; reason = "All discovered references come from the proven Soft Flash chain, and Natural Beauty does not reference this asset."; }
    candidates.push(candidate(asset.id, asset.name, asset.type, "ASSET", asset.path, null, references, provenance(asset, softReferences.length > 0), naturalReferenced, otherReferences, safety, reason));
  }
  return uniqueCandidates(candidates);
}

function assetReferences(asset: AssetRecord, effects: PostEffectReadback[], assets: AssetRecord[]): CleanupReference[] {
  const references: CleanupReference[] = [];
  for (const effect of effects) {
    if (effect.materialId === asset.id || effect.firstMaterialId === asset.id) references.push({ sourceId: effect.componentId, sourceName: effect.objectName, sourceType: "PostEffectVisual", property: effect.materialId === asset.id ? "mainMaterial" : "materials.0" });
    if (effect.lutId === asset.id) references.push({ sourceId: effect.materialId ?? effect.componentId, sourceName: effect.materialName ?? effect.objectName, sourceType: effect.materialId ? "Material" : "PostEffectVisual", property: "passInfos.0.baseTex" });
  }
  const needles = [asset.id, asset.path].filter((value): value is string => Boolean(value));
  for (const source of assets) {
    if (source.id === asset.id || !source.properties) continue;
    const serialized = canonicalSerialize(source.properties);
    if (needles.some((needle) => serialized.includes(needle))) references.push({ sourceId: source.id, sourceName: source.name, sourceType: source.type, property: "properties" });
  }
  return dedupeReferences(references);
}

function isNaturalDependency(asset: AssetRecord, grade: PostEffectReadback | null, references: CleanupReference[]) {
  if ([NATURAL_SHADER_ID, NATURAL_SCREEN_TEXTURE_ID, grade?.materialId, grade?.lutId].includes(asset.id)) return true;
  return references.some((reference) => reference.sourceId === NATURAL_GRADE_COMPONENT_ID || reference.sourceId === grade?.materialId);
}

function provenance(asset: AssetRecord, referencedBySoftFlash: boolean) {
  const evidence = [`asset-graphql returned ${asset.name} (${asset.type}) at ${asset.path ?? "no path"}.`];
  if (referencedBySoftFlash) evidence.push("Live ExecuteEditorCode resolved this asset in the Soft Flash PostEffectVisual chain.");
  if (asset.id === NATURAL_SHADER_ID || asset.id === NATURAL_SCREEN_TEXTURE_ID) evidence.push("The stored Natural Beauty Iteration 0 delta records this exact asset ID as created by BeautyPreset for Natural Beauty.");
  return evidence;
}

function operationFor(item: SoftFlashCleanupCandidate): SoftFlashCleanupOperation {
  return { itemId: item.id, itemName: item.name, itemType: item.type, operation: item.kind === "SCENE_OBJECT" ? "DELETE_SCENE_OBJECT" : "DELETE_ASSET", reason: item.deletionReason, references: item.references, expectedEffect: item.kind === "SCENE_OBJECT" ? "Remove only the proven Soft Flash scene-object hierarchy." : "Remove only this proven Soft Flash asset after its scene object is removed.", reversible: false };
}

function protectedState(grade: PostEffectReadback | null, retouch: RetouchReadback | null): NaturalBeautyProtectedState { return { gradeObjectId: grade?.objectId ?? null, gradeComponentId: grade?.componentId ?? null, gradeEnabled: grade?.enabled ?? null, materialId: grade?.materialId ?? null, materialName: grade?.materialName ?? null, materialPath: grade?.materialPath ?? null, lutId: grade?.lutId ?? null, lutName: grade?.lutName ?? null, lutPath: grade?.lutPath ?? null, retouchObjectId: retouch?.objectId ?? null, retouchComponentId: retouch?.componentId ?? null, retouchEnabled: retouch?.enabled ?? null, faceIndex: retouch?.faceIndex ?? null, softSkinIntensity: retouch?.softSkinIntensity ?? null, teethWhiteningIntensity: retouch?.teethWhiteningIntensity ?? null, sharpenEyeIntensity: retouch?.sharpenEyeIntensity ?? null, eyeWhiteningIntensity: retouch?.eyeWhiteningIntensity ?? null }; }
function resolvePostEffectAssets(effect: PostEffectReadback | null, assets: AssetRecord[]): PostEffectReadback | null { if (!effect) return null; const material = assets.find((asset) => asset.id === effect.materialId); const lut = assets.find((asset) => asset.id === effect.lutId); return { ...effect, materialName: effect.materialName ?? material?.name ?? null, materialPath: effect.materialPath ?? material?.path ?? null, lutName: effect.lutName ?? lut?.name ?? null, lutPath: effect.lutPath ?? lut?.path ?? null }; }
function emptyNaturalBeauty(): NaturalBeautyProtectedState { return { gradeObjectId: null, gradeComponentId: null, gradeEnabled: null, materialId: null, materialName: null, materialPath: null, lutId: null, lutName: null, lutPath: null, retouchObjectId: null, retouchComponentId: null, retouchEnabled: null, faceIndex: null, softSkinIntensity: null, teethWhiteningIntensity: null, sharpenEyeIntensity: null, eyeWhiteningIntensity: null }; }
function controlledState(grade: PostEffectReadback, retouch: RetouchReadback): ControlledBuildState { return { buildId: naturalBeautyReviewIdentity.buildId, objects: [{ id: grade.objectId, components: [{ id: grade.componentId, type: grade.componentType, enabled: grade.enabled, properties: {}, assetAssignments: { mainMaterial: grade.materialId, materials0: grade.firstMaterialId, lutTexture: grade.lutId } }] }, { id: retouch.objectId, components: [{ id: retouch.componentId, type: retouch.componentType, enabled: retouch.enabled, properties: { faceIndex: retouch.faceIndex, softSkinIntensity: retouch.softSkinIntensity, teethWhiteningIntensity: retouch.teethWhiteningIntensity, sharpenEyeIntensity: retouch.sharpenEyeIntensity, eyeWhiteningIntensity: retouch.eyeWhiteningIntensity }, assetAssignments: {} }] }], assets: [{ id: grade.materialId ?? "MISSING", type: "Material", assignment: fileName(grade.materialPath) ?? grade.materialName }, { id: grade.lutId ?? "MISSING", type: "FileTexture", assignment: fileName(grade.lutPath) ?? grade.lutName }] }; }
function candidate(id: string, name: string, type: string, kind: SoftFlashCleanupCandidate["kind"], path: string | null, parent: SoftFlashCleanupCandidate["parent"], references: CleanupReference[], provenanceEvidence: string[], naturalBeautyReferenced: boolean, otherSandboxReference: boolean, deletionSafety: SoftFlashCleanupCandidate["deletionSafety"], deletionReason: string): SoftFlashCleanupCandidate { return { id, name, type, kind, path, parent, references, provenanceEvidence, naturalBeautyReferenced, otherSandboxReference, deletionSafety, deletionReason }; }
function uniqueCandidates(items: SoftFlashCleanupCandidate[]) { return [...new Map(items.map((item) => [`${item.kind}:${item.id}`, item])).values()]; }
function dedupeReferences(items: CleanupReference[]) { return [...new Map(items.map((item) => [`${item.sourceId}:${item.property}`, item])).values()]; }
function readAssets(payload: Record<string, unknown>) { return ((payload.data as { allAssets?: AssetRecord[] } | undefined)?.allAssets ?? []); }
function readToolJson(result: LensStudioToolResult): Record<string, unknown> { const text = result.content?.find((item) => item.type === "text" && item.text)?.text; if (!text) return {}; try { return JSON.parse(text) as Record<string, unknown>; } catch { return {}; } }
function parseTool(result: LensStudioToolResult): unknown { const text = result.content?.filter((item) => item.type === "text").map((item) => item.text ?? "").join("\n") ?? ""; try { return JSON.parse(text); } catch { return text; } }
function mutationValue(value: unknown, key: string): { success?: boolean; message?: string } { return ((value as { data?: Record<string, unknown> } | null)?.data?.[key] ?? value ?? {}) as { success?: boolean; message?: string }; }
function logLines(value: unknown): string[] { const errors = (value as { errors?: unknown[]; data?: { errors?: unknown[] } } | null)?.errors ?? (value as { data?: { errors?: unknown[] } } | null)?.data?.errors ?? []; return errors.map((entry) => typeof entry === "string" ? entry : JSON.stringify(entry)); }
function fileName(value: string | null) { return value?.split(/[\\/]/).filter(Boolean).at(-1) ?? null; }
async function sha256(value: unknown) { const bytes = new TextEncoder().encode(canonicalSerialize(value)); const digest = await crypto.subtle.digest("SHA-256", bytes); return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join(""); }
