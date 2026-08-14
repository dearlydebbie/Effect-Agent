import { createHash } from "node:crypto";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";
import { LensStudioConnectionService, type LensStudioToolResult } from "../services/lens-studio-connection";
import { inspectLensProject, verifyLearningSandbox } from "../services/lens-project-identity";
import { classifyRuntimeLogs } from "../services/runtime-log-classifier";

const BASELINE = "7cbeeba095c103f4f0f3d48599ceeb69745cb8afe3eae7caced3efc6093753aa";
const PROJECT_PATH = "/Users/debbie/Documents/Effect Lab Training Sandbox";
const SNAPSHOT_PATH = join(PROJECT_PATH, ".virtual-scene.json");
const PREVIEW_PATH = "/Users/debbie/Documents/effect-agent/public/natural-beauty-iteration-0.png";
const EVIDENCE_PATH = "/private/tmp/effect-lab-natural-beauty-build-001.json";
const EXPECTED_OBJECTS = ["Camera Object", "Envmap", "Light", "Lighting", "AiPreviewAgent Handler"];
const connection = LensStudioConnectionService.fromEnvironment();
const operations: Array<{ step: string; tool: string; result: unknown }> = [];
const failures: string[] = [];
let createdObjects: SceneObject[] = [];
let createdAssets: Asset[] = [];
let deltaRoots: SceneObject[] = [];

try {
  const info = await connection.testConnection();
  if (info.state !== "CONNECTED") throw new Error(info.message);
  const beforeIdentity = await inspectLensProject(connection);
  const verification = verifyLearningSandbox(beforeIdentity, true);
  const unexpected = beforeIdentity.keySceneObjects.filter((name) => !EXPECTED_OBJECTS.includes(name));
  if (process.env.LENS_STUDIO_MCP_CONNECTION_SOURCE !== "MANUAL_CONFIG" || verification.status !== "VERIFIED" || beforeIdentity.projectFingerprint !== BASELINE || unexpected.length) throw new Error("Natural Beauty preflight no longer matches the confirmed baseline.");

  const beforeScene = await virtualScene();
  const beforeAssets = await assetList();
  await mutation("instantiate BeautyPreset", "scene-graphql", { query: 'mutation { createSceneObjectFromPreset(presetName:"BeautyPreset", name:"Natural Beauty Grade") { success message id } }' });
  await mutation("instantiate FaceRetouchObjectPreset", "scene-graphql", { query: 'mutation { createSceneObjectFromPreset(presetName:"FaceRetouchObjectPreset", name:"Natural Beauty Retouch") { success message id } }' });

  const constructedScene = await virtualScene();
  const constructedAssets = await assetList();
  const beforeObjectIds = new Set(beforeScene.sceneObjects.map((entry) => entry.id));
  const beforeAssetIds = new Set(beforeAssets.map((entry) => entry.id));
  createdObjects = constructedScene.sceneObjects.filter((entry) => !beforeObjectIds.has(entry.id));
  createdAssets = constructedAssets.filter((entry) => !beforeAssetIds.has(entry.id));
  const createdObjectIds = new Set(createdObjects.map((entry) => entry.id));
  deltaRoots = createdObjects.filter((entry) => !entry.parentId || !createdObjectIds.has(entry.parentId));
  if (!createdObjects.length || !deltaRoots.length) throw new Error("The Natural Beauty scene delta could not be isolated.");

  const gradeObject = createdObjects.find((entry) => entry.components.some((component) => component.type === "PostEffectVisual"));
  const retouchObject = createdObjects.find((entry) => entry.components.some((component) => component.type === "RetouchVisual"));
  const gradeComponent = gradeObject?.components.find((component) => component.type === "PostEffectVisual");
  const retouchComponent = retouchObject?.components.find((component) => component.type === "RetouchVisual");
  if (!gradeObject || !retouchObject || !gradeComponent || !retouchComponent) throw new Error("The confirmed PostEffectVisual and RetouchVisual components were not both created.");
  assertDefault(retouchComponent.properties, "faceIndex", 0);
  assertDefault(retouchComponent.properties, "softSkinIntensity", 1);
  assertDefault(retouchComponent.properties, "teethWhiteningIntensity", 0.4000000059604645);
  assertDefault(retouchComponent.properties, "sharpenEyeIntensity", 0.699999988079071);
  assertDefault(retouchComponent.properties, "eyeWhiteningIntensity", 0.30000001192092896);

  const officialMaterial = createdAssets.find((entry) => entry.type === "Material" && entry.name === "Color Correction");
  const officialLut = createdAssets.find((entry) => entry.type === "FileTexture" && entry.name === "Beauty");
  if (!officialMaterial || !officialLut) throw new Error("The verified BeautyPreset material and LUT assets were not found in the isolated delta.");

  const materialRenameResult = await mutation("name Natural Beauty colour material", "asset-graphql", { query: `mutation { renameAsset(id:${q(officialMaterial.id)}, newName:"Natural Beauty Colour Material") { success message id } }` });
  const materialRenamed = data(materialRenameResult).renameAsset as { success?: boolean; id?: string } | undefined;
  if (materialRenamed?.success !== true || !materialRenamed.id) throw new Error("The Natural Beauty colour material was not named.");
  const renameResult = await mutation("rename original LUT asset", "asset-graphql", { query: `mutation { renameAsset(id:${q(officialLut.id)}, newName:"Natural Beauty LUT") { success message id } }` });
  const renamed = data(renameResult).renameAsset as { success?: boolean } | undefined;
  if (renamed?.success !== true) throw new Error("The LUT asset could not be renamed.");

  const assetsAfterRename = await assetList();
  const naturalMaterial = assetsAfterRename.find((entry) => entry.id === materialRenamed.id);
  const naturalLut = assetsAfterRename.find((entry) => entry.id === officialLut.id);
  if (!naturalMaterial?.path || !naturalLut?.path) throw new Error("The generated Natural Beauty asset paths could not be read.");
  const lutBytes = createNaturalBeautyLut();
  writeFileSync(join(PROJECT_PATH, "Assets", naturalLut.path), lutBytes);
  await new Promise((resolve) => setTimeout(resolve, 600));

  await mutation("apply confirmed component values", "VirtualScene", { command: "apply", instructions: { modify: {
    [`@id:${gradeObject.id}`]: { "components.PostEffectVisual.mainMaterial": `@asset:${naturalMaterial.path}`, "components.PostEffectVisual.materials.0": `@asset:${naturalMaterial.path}` },
    [`@id:${retouchObject.id}`]: { "components.RetouchVisual.faceIndex": 0, "components.RetouchVisual.softSkinIntensity": 0.25, "components.RetouchVisual.teethWhiteningIntensity": 0.1, "components.RetouchVisual.sharpenEyeIntensity": 0.2, "components.RetouchVisual.eyeWhiteningIntensity": 0.08 },
  } } });
  await mutation("name grade object", "scene-graphql", { query: `mutation { setName(id:${q(gradeObject.id)}, newName:"Natural Beauty Grade") { success message id } }` });
  await mutation("name retouch object", "scene-graphql", { query: `mutation { setName(id:${q(retouchObject.id)}, newName:"Natural Beauty Retouch") { success message id } }` });

  const compile = parse(await call("RecompileTypeScriptTool", {}));
  operations.push({ step: "compile", tool: "RecompileTypeScriptTool", result: compile });
  if ((compile as { status?: string } | null)?.status !== "succeeded") throw new Error("Natural Beauty compilation failed.");
  const runtimeLogs = parse(await call("RunAndCollectLogsTool", { mode: "refresh", timeoutMs: 10000, settleMinMs: 600, settleQuietMs: 250, settleMaxMs: 1800 }));
  operations.push({ step: "runtime logs", tool: "RunAndCollectLogsTool", result: runtimeLogs });
  const logLines = ((runtimeLogs as { errors?: unknown[] } | null)?.errors ?? []).map((entry) => typeof entry === "string" ? entry : JSON.stringify(entry));
  const classifiedLogs = classifyRuntimeLogs(logLines);
  if (classifiedLogs.some((entry) => entry.classification === "ERROR")) throw new Error("Natural Beauty produced a runtime error.");

  const finalScene = await virtualScene();
  const finalAssets = await assetList();
  const finalGrade = finalScene.sceneObjects.find((entry) => entry.id === gradeObject.id);
  const finalRetouch = finalScene.sceneObjects.find((entry) => entry.id === retouchObject.id);
  const finalGradeComponent = finalGrade?.components.find((entry) => entry.type === "PostEffectVisual");
  const finalRetouchComponent = finalRetouch?.components.find((entry) => entry.type === "RetouchVisual");
  const lutDetail = data(await call("asset-graphql", { query: `{ asset(id:${q(naturalLut.id)}) { id name path type properties } }` })).asset as Record<string, unknown> | undefined;
  const prohibitedComponents = finalScene.sceneObjects.flatMap((entry) => entry.components).filter((entry) => ["RenderMeshVisual", "Head"].includes(entry.type));
  const propertyReadback = {
    faceIndex: finalRetouchComponent?.properties.faceIndex,
    softSkinIntensity: finalRetouchComponent?.properties.softSkinIntensity,
    teethWhiteningIntensity: finalRetouchComponent?.properties.teethWhiteningIntensity,
    sharpenEyeIntensity: finalRetouchComponent?.properties.sharpenEyeIntensity,
    eyeWhiteningIntensity: finalRetouchComponent?.properties.eyeWhiteningIntensity,
  };
  const specificationChecks = {
    gradeNamed: finalGrade?.name === "Natural Beauty Grade",
    retouchNamed: finalRetouch?.name === "Natural Beauty Retouch",
    gradeUsesOriginalMaterial: finalGradeComponent?.properties.mainMaterial === `@asset:${naturalMaterial.path}`,
    retouchValuesMatch: near(propertyReadback.faceIndex, 0) && near(propertyReadback.softSkinIntensity, 0.25) && near(propertyReadback.teethWhiteningIntensity, 0.1) && near(propertyReadback.sharpenEyeIntensity, 0.2) && near(propertyReadback.eyeWhiteningIntensity, 0.08),
    originalLutPresent: finalAssets.some((entry) => entry.id === naturalLut.id && entry.name === "Natural Beauty LUT"),
    officialBeautyLutAbsent: !finalAssets.some((entry) => entry.name === "Beauty" && entry.type === "FileTexture"),
    smoothingAbsent: !finalScene.sceneObjects.some((entry) => entry.name === "Smoothing"),
    faceMeshAndHeadAbsent: prohibitedComponents.length === 0,
  };
  if (Object.values(specificationChecks).some((value) => !value)) throw new Error("Natural Beauty specification QA failed.");

  const previewConfig = parse(await call("PreviewPanelTool", { action: "getConfig" }));
  const preview = parse(await call("PreviewPanelTool", { action: "screenshot", detail: "high", includeChrome: false, outputPath: PREVIEW_PATH }));
  operations.push({ step: "capture Iteration 0", tool: "PreviewPanelTool", result: preview });
  const afterIdentity = await inspectLensProject(connection);
  const evidence = {
    buildId: "learning-build-001-natural-beauty", confirmed: true, status: "NEEDS_REVIEW", lensStudioVersion: info.lensStudioVersion,
    baselineFingerprint: BASELINE, beforeIdentity, afterIdentity, createdObjects, createdAssets: finalAssets.filter((entry) => !beforeAssetIds.has(entry.id)), deltaRoots,
    operations, failures, generatedLut: { assetId: naturalLut.id, path: naturalLut.path, width: 256, height: 16, sha256: createHash("sha256").update(lutBytes).digest("hex"), provenance: "Generated by Effect Lab for Learning Build 001 from a 16-cube identity layout with neutral 2% desaturation and a bounded 1% midtone lift.", technicalAssumption: "The verified Lens Studio LUT 3D node accepts the observed 256 by 16 strip layout." },
    propertyReadback, finalTargets: { gradeObjectId: finalGrade?.id, gradeComponentId: finalGradeComponent?.id, retouchObjectId: finalRetouch?.id, retouchComponentId: finalRetouchComponent?.id, materialId: naturalMaterial.id, materialPath: naturalMaterial.path, lutId: naturalLut.id, lutPath: naturalLut.path },
    compile, runtimeLogs, classifiedLogs, technicalQA: "PASS", specificationQA: "PASS", specificationChecks, lutDetail,
    preview: { path: PREVIEW_PATH, publicPath: "/natural-beauty-iteration-0.png", config: previewConfig, captured: existsSync(PREVIEW_PATH) },
    visualQA: "NOT_RUN", experienceQA: "UNKNOWN", humanReview: "PENDING", lensStudioModified: true,
    rollback: { mechanism: "Delete only the recorded delta roots and created asset IDs, then require the exact baseline fingerprint.", verifiedForThisBuild: false },
  };
  writeFileSync(EVIDENCE_PATH, JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify({ status: evidence.status, technicalQA: evidence.technicalQA, specificationQA: evidence.specificationQA, propertyReadback, specificationChecks, classifiedLogs, preview: evidence.preview, finalTargets: evidence.finalTargets, afterFingerprint: afterIdentity.projectFingerprint, evidenceFile: EVIDENCE_PATH, lensStudioModified: true }, null, 2));
} catch (error) {
  const message = error instanceof Error ? error.message : "Natural Beauty build failed.";
  failures.push(message);
  const rollback = await rollbackDelta().catch((rollbackError) => ({ error: rollbackError instanceof Error ? rollbackError.message : "Rollback failed." }));
  writeFileSync(EVIDENCE_PATH, JSON.stringify({ buildId: "learning-build-001-natural-beauty", status: "FAILED", failures, operations, createdObjects, createdAssets, deltaRoots, rollback }, null, 2));
  console.error(JSON.stringify({ status: "FAILED", error: message, rollback, evidenceFile: EVIDENCE_PATH }, null, 2));
  process.exitCode = 2;
} finally {
  if (existsSync(SNAPSHOT_PATH)) unlinkSync(SNAPSHOT_PATH);
}

async function rollbackDelta() {
  const results: unknown[] = [];
  for (const root of deltaRoots) results.push(parse(await call("scene-graphql", { query: `mutation { deleteSceneObject(id:${q(root.id)}) { success message id } }` })));
  const currentAssets = await assetList().catch(() => []);
  const ids = new Set(createdAssets.map((entry) => entry.id));
  for (const asset of currentAssets.filter((entry) => ids.has(entry.id))) results.push(parse(await call("asset-graphql", { query: `mutation { deleteAsset(id:${q(asset.id)}) { success message id } }` })));
  await call("RecompileTypeScriptTool", {});
  await call("RunAndCollectLogsTool", { mode: "refresh", timeoutMs: 10000, settleMinMs: 600, settleQuietMs: 200, settleMaxMs: 1500 });
  const identity = await inspectLensProject(connection);
  return { results, identity, baselineRestored: identity.projectFingerprint === BASELINE };
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
function data(result: LensStudioToolResult) { const value = parse(result) as { data?: Record<string, unknown> } | null; return value?.data ?? {}; }
function text(result: LensStudioToolResult) { return result.content?.filter((entry) => entry.type === "text").map((entry) => entry.text ?? "").join("\n") ?? ""; }
async function assetList() { const value = data(await call("asset-graphql", { query: "{ allAssets(limit: 500) { id name path type } }" })); return (value.allAssets ?? []) as Asset[]; }
async function virtualScene() { await call("VirtualScene", { command: "read" }); return JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8")) as { sceneObjects: SceneObject[]; assets: unknown[] }; }
function assertDefault(properties: Record<string, unknown>, name: string, expected: number) { if (!near(properties[name], expected)) throw new Error(`The live default for ${name} no longer matches the inspected evidence.`); }
function near(value: unknown, expected: number) { return typeof value === "number" && Math.abs(value - expected) < 0.00001; }
function q(value: string) { return JSON.stringify(value); }

function createNaturalBeautyLut() {
  const width = 256; const height = 16; const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let greenIndex = 0; greenIndex < 16; greenIndex += 1) {
    const row = greenIndex * (width * 4 + 1); raw[row] = 0;
    for (let blueIndex = 0; blueIndex < 16; blueIndex += 1) for (let redIndex = 0; redIndex < 16; redIndex += 1) {
      const red = redIndex / 15; const green = greenIndex / 15; const blue = blueIndex / 15;
      const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
      const transform = (channel: number) => { const desaturated = luminance + 0.98 * (channel - luminance); return Math.max(0, Math.min(1, desaturated + 0.01 * 4 * desaturated * (1 - desaturated))); };
      const x = blueIndex * 16 + redIndex; const offset = row + 1 + x * 4;
      raw[offset] = Math.round(transform(red) * 255); raw[offset + 1] = Math.round(transform(green) * 255); raw[offset + 2] = Math.round(transform(blue) * 255); raw[offset + 3] = 255;
    }
  }
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const header = Buffer.alloc(13); header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 6;
  return Buffer.concat([signature, chunk("IHDR", header), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
function chunk(type: string, payload: Buffer) { const name = Buffer.from(type); const output = Buffer.alloc(payload.length + 12); output.writeUInt32BE(payload.length, 0); name.copy(output, 4); payload.copy(output, 8); output.writeUInt32BE(crc32(Buffer.concat([name, payload])), payload.length + 8); return output; }
function crc32(value: Buffer) { let crc = 0xffffffff; for (const byte of value) { crc ^= byte; for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0); } return (crc ^ 0xffffffff) >>> 0; }

interface Asset { id: string; name: string; path: string | null; type: string }
interface SceneObject { id: string; name: string; parentId: string | null; components: Array<{ id: string; name: string; type: string; properties: Record<string, unknown> }> }
