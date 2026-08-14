import { learningConfig } from "../config/learning";
import type { LensProjectIdentity, SandboxVerification } from "../types/system-health";
import type { LensStudioConnectionService, LensStudioToolResult } from "./lens-studio-connection";

const EXCLUDED_MARKERS = ["Blown White", "Color Correction", "color_correction", "BlownWhite"];
const IDENTITY_CODE = `const model = pluginSystem.findInterface(Editor.Model.IModel);
const project = model.project;
return {
  lensName: project.metaInfo ? project.metaInfo.lensName : null,
  projectFile: String(project.projectFile),
  projectDirectory: String(project.projectDirectory),
  assetsDirectory: String(project.assetsDirectory)
};`;

export async function inspectLensProject(connection: LensStudioConnectionService): Promise<LensProjectIdentity> {
  const checkedAt = new Date().toISOString();
  for (const tool of ["ExecuteEditorCode", "QueryRuntimeSceneTool", "asset-graphql"]) {
    if (!connection.supports(tool)) throw new Error(`Lens Studio does not expose ${tool}.`);
  }
  const [editor, runtime, assets] = await Promise.all([
    connection.callSupportedTool("ExecuteEditorCode", { code: IDENTITY_CODE, timeoutMs: 10000 }),
    connection.callSupportedTool("QueryRuntimeSceneTool", { query: "{ sceneRoots { summary descendantsTree(maxDepth: 5, enabledOnly: false) } }", timeoutMs: 10000 }),
    connection.callSupportedTool("asset-graphql", { query: "{ allAssets(limit: 500) { id name path type } }" }),
  ]);
  const editorValue = readToolJson(editor).returnValue as Record<string, unknown> | undefined;
  const runtimeValue = readToolJson(runtime);
  const assetValue = readToolJson(assets);
  const keySceneObjects = collectNamedValues(runtimeValue).slice(0, 40);
  const assetNames = collectAssets(assetValue).slice(0, 200);
  const identity = {
    lensName: stringOrNull(editorValue?.lensName),
    projectFile: stringOrNull(editorValue?.projectFile),
    projectFolder: stringOrNull(editorValue?.projectDirectory),
    keySceneObjects,
    assetNames,
  };
  return { ...identity, projectFingerprint: await sha256(identity), checkedAt };
}

export function verifyLearningSandbox(identity: LensProjectIdentity | null, liveMcpResponded: boolean): SandboxVerification {
  const { expectedLensName, expectedFolderName, expectedProjectPath } = learningConfig.sandbox;
  const base = { expectedLensName, expectedFolderName, expectedProjectPath, fingerprintPolicy: "CAPTURE_AND_COMPARE" as const, excludedMarkersFound: [] as string[] };
  if (!liveMcpResponded) return { ...base, status: "UNKNOWN", reasons: ["The live Lens Studio MCP endpoint did not respond."] };
  if (!identity) return { ...base, status: "UNKNOWN", reasons: ["Effect Lab could not read the training project."] };
  const reasons: string[] = [];
  if (identity.lensName !== expectedLensName) reasons.push(`The Lens name is ${identity.lensName ?? "unknown"}. Expected ${expectedLensName}.`);
  const folderName = identity.projectFolder?.split(/[\\/]/).filter(Boolean).at(-1) ?? null;
  if (folderName !== expectedFolderName) reasons.push(`The project folder is ${folderName ?? "unknown"}.`);
  if (normalizePath(identity.projectFolder) !== normalizePath(expectedProjectPath)) reasons.push(`The project path is ${identity.projectFolder ?? "unknown"}. Expected ${expectedProjectPath}.`);
  const searchable = [...identity.keySceneObjects, ...identity.assetNames];
  const excludedMarkersFound = EXCLUDED_MARKERS.filter((marker) => searchable.some((value) => value.toLowerCase().includes(marker.toLowerCase())));
  if (excludedMarkersFound.length) reasons.push("The project contains excluded training markers. Verify a clean sandbox before another learning operation.");
  if (!identity.projectFingerprint) return { ...base, status: "UNKNOWN", reasons: ["The project fingerprint was not captured."], excludedMarkersFound };
  return { ...base, status: reasons.length ? "MISMATCH" : "VERIFIED", reasons, excludedMarkersFound };
}

export function sandboxAllowsModification(verification: SandboxVerification, expectedFingerprint: string | null, currentFingerprint: string | null) {
  if (verification.status !== "VERIFIED") return false;
  return Boolean(expectedFingerprint && currentFingerprint && expectedFingerprint === currentFingerprint);
}

function readToolJson(result: LensStudioToolResult): Record<string, unknown> {
  const text = result.content?.find((item) => item.type === "text" && item.text)?.text;
  if (!text) return {};
  try { return JSON.parse(text) as Record<string, unknown>; } catch { return {}; }
}

function collectNamedValues(value: unknown): string[] {
  const names = new Set<string>();
  const visit = (item: unknown) => {
    if (Array.isArray(item)) return item.forEach(visit);
    if (!item || typeof item !== "object") return;
    for (const [key, child] of Object.entries(item as Record<string, unknown>)) {
      if (key === "name" && typeof child === "string") names.add(child);
      else visit(child);
    }
  };
  visit(value);
  return [...names];
}

function collectAssets(value: Record<string, unknown>): string[] {
  const allAssets = (value.data as { allAssets?: Array<{ name?: string; path?: string }> } | undefined)?.allAssets ?? [];
  return allAssets.flatMap((asset) => [asset.name, asset.path].filter((item): item is string => Boolean(item)));
}

function stringOrNull(value: unknown) { return typeof value === "string" && value.length ? value : null; }
function normalizePath(value: string | null) { return value?.replace(/[\\/]+$/, "") ?? null; }
async function sha256(value: unknown) { const bytes = new TextEncoder().encode(JSON.stringify(value)); const digest = await crypto.subtle.digest("SHA-256", bytes); return Array.from(new Uint8Array(digest)).map((item) => item.toString(16).padStart(2, "0")).join(""); }
