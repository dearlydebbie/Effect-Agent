import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LensStudioConnectionService, type LensStudioToolResult } from "../services/lens-studio-connection";
import { inspectLensProject, verifyLearningSandbox } from "../services/lens-project-identity";

const BASELINE = "7cbeeba095c103f4f0f3d48599ceeb69745cb8afe3eae7caced3efc6093753aa";
const PROJECT_PATH = "/Users/debbie/Documents/Effect Lab Training Sandbox";
const ALLOWED = ["FaceRetouchObjectPreset", "SmoothingPreset", "FaceMeshObjectPreset", "HeadBindingObjectPreset"] as const;
const presetName = process.argv[2];
if (!ALLOWED.includes(presetName as (typeof ALLOWED)[number])) throw new Error("This preset is not in the confirmed beauty and face batch.");

const connection = LensStudioConnectionService.fromEnvironment();
const info = await connection.testConnection();
if (info.state !== "CONNECTED") throw new Error(info.message);
const beforeIdentity = await inspectLensProject(connection);
const sandbox = verifyLearningSandbox(beforeIdentity, true);
if (sandbox.status !== "VERIFIED" || beforeIdentity.projectFingerprint !== BASELINE) throw new Error("The sandbox does not match the exact batch baseline.");

const preset = data(await call("scene-graphql", { query: `{ preset(presetName:${JSON.stringify(presetName)}) { name description entityType section } }` })).preset as Record<string, unknown> | undefined;
if (!preset || preset.name !== presetName || preset.entityType !== "SceneObject") throw new Error("The exact confirmed SceneObject preset was not returned.");

const beforeScene = await virtualScene();
const beforeAssets = await assetList();
const mutation = data(await call("scene-graphql", { query: `mutation { createSceneObjectFromPreset(presetName:${JSON.stringify(presetName)}, name:${JSON.stringify(`${presetName} Inspection`)}) { success message id } }` })).createSceneObjectFromPreset as Record<string, unknown> | undefined;
if (mutation?.success !== true) throw new Error(`Lens Studio did not instantiate ${presetName}.`);

const afterScene = await virtualScene();
const afterAssets = await assetList();
const previousObjectIds = new Set(beforeScene.sceneObjects.map((item) => item.id));
const previousAssetIds = new Set(beforeAssets.map((item) => item.id));
const createdObjects = afterScene.sceneObjects.filter((item) => !previousObjectIds.has(item.id));
const createdAssets = afterAssets.filter((item) => !previousAssetIds.has(item.id));
const createdObjectIds = new Set(createdObjects.map((item) => item.id));
const deltaRoots = createdObjects.filter((item) => !item.parentId || !createdObjectIds.has(item.parentId));
if (!createdObjects.length || !deltaRoots.length) throw new Error("The preset scene delta could not be isolated safely.");

const compile = tool(await call("RecompileTypeScriptTool", {}));
const runtimeLogs = tool(await call("RunAndCollectLogsTool", { mode: "refresh", timeoutMs: 10000, settleMinMs: 600, settleQuietMs: 200, settleMaxMs: 1500 }));
const runtime = tool(await call("QueryRuntimeSceneTool", { query: "{ sceneRoots { summary descendantsTree(maxDepth: 5, enabledOnly: false) components { type properties } transform { localPosition localRotation localScale } } }", timeoutMs: 10000 }));
const assetDetails = createdAssets.length ? data(await call("asset-graphql", { query: `{ ${createdAssets.map((asset, index) => `a${index}: asset(id:${JSON.stringify(asset.id)}) { id name path type description tags properties }`).join(" ")} }` })) : {};
const sourceFiles = createdAssets.flatMap((asset) => {
  if (!asset.path || !/\.(mat|graphShader|ts)$/i.test(asset.path)) return [];
  const path = join(PROJECT_PATH, "Assets", asset.path);
  return existsSync(path) ? [{ assetId: asset.id, path: asset.path, content: readFileSync(path, "utf8") }] : [];
});
const previewPath = `/Users/debbie/Documents/effect-agent/public/${slug(presetName)}-preview.png`;
let preview: unknown = null;
try { preview = tool(await call("PreviewPanelTool", { action: "screenshot", detail: "high", includeChrome: false, outputPath: previewPath })); }
catch (error) { preview = { unavailable: error instanceof Error ? error.message : "Preview capture failed." }; }

const resetOperations: unknown[] = [];
for (const root of deltaRoots) resetOperations.push(tool(await call("scene-graphql", { query: `mutation { deleteSceneObject(id:${JSON.stringify(root.id)}) { success message id } }` })));
for (const asset of createdAssets) resetOperations.push(tool(await call("asset-graphql", { query: `mutation { deleteAsset(id:${JSON.stringify(asset.id)}) { success message id } }` })));
const resetCompile = tool(await call("RecompileTypeScriptTool", {}));
const resetLogs = tool(await call("RunAndCollectLogsTool", { mode: "refresh", timeoutMs: 10000, settleMinMs: 600, settleQuietMs: 200, settleMaxMs: 1500 }));
const afterResetIdentity = await inspectLensProject(connection);
const resetVerification = verifyLearningSandbox(afterResetIdentity, true);
const snapshotPath = join(PROJECT_PATH, ".virtual-scene.json");
if (existsSync(snapshotPath)) unlinkSync(snapshotPath);

const evidence = {
  presetName, preset, lensStudioVersion: info.lensStudioVersion, capabilityCount: info.capabilities.length,
  confirmed: true, baselineFingerprint: BASELINE, beforeIdentity, mutation,
  createdObjects, createdAssets, assetDetails, sourceFiles, compile, runtimeLogs, runtime,
  preview: { result: preview, publicPath: `/${slug(presetName)}-preview.png` },
  reset: { deltaRoots, operations: resetOperations, compile: resetCompile, logs: resetLogs, identity: afterResetIdentity, verification: resetVerification, baselineMatches: afterResetIdentity.projectFingerprint === BASELINE },
};
const outputPath = `/private/tmp/effect-lab-${slug(presetName)}-evidence.json`;
writeFileSync(outputPath, JSON.stringify(evidence, null, 2));
console.log(JSON.stringify({ presetName, createdObjectCount: createdObjects.length, createdAssetCount: createdAssets.length, deltaRootIds: deltaRoots.map((item) => item.id), compile, runtimeLogs, preview: evidence.preview, reset: evidence.reset, evidenceFile: outputPath }, null, 2));
if (!evidence.reset.baselineMatches || resetVerification.status !== "VERIFIED") process.exitCode = 2;

async function call(name: string, args: Record<string, unknown>) {
  const result = await connection.callSupportedTool(name, args);
  if (result.isError) throw new Error(`${name} returned an error.`);
  return result;
}
function tool(result: LensStudioToolResult) { const text = result.content?.find((item) => item.type === "text")?.text; if (!text) return null; try { return JSON.parse(text); } catch { return text; } }
function data(result: LensStudioToolResult) { const value = tool(result) as { data?: Record<string, unknown> } | null; return value?.data ?? {}; }
async function assetList() { const value = data(await call("asset-graphql", { query: "{ allAssets(limit: 500) { id name path type } }" })); return (value.allAssets ?? []) as Array<{ id: string; name: string; path: string | null; type: string }>; }
async function virtualScene() { await call("VirtualScene", { command: "read" }); return JSON.parse(readFileSync(join(PROJECT_PATH, ".virtual-scene.json"), "utf8")) as { sceneObjects: Array<{ id: string; name: string; enabled: boolean; parentId: string | null; transform: unknown; layers: number; components: Array<{ id: string; name: string; type: string; enabled: boolean; properties: Record<string, unknown> }> }>; assets: unknown[] }; }
function slug(value: string) { return value.replace(/Preset$/, "").replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(); }
