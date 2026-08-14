import type { LensStudioToolResult } from "./lens-studio-connection";
import type { TechnicalBaselineValue, TechnicalIterationChange, TechnicalIterationPlan, TechnicalTargetReference, TechnicalValueDifference, VisualQAFinding } from "../types/creative-qa";

export interface TechnicalInspectionConnection {
  supports(toolName: string): boolean;
  callSupportedTool(name: string, args: Record<string, unknown>): Promise<LensStudioToolResult>;
}

interface EditorTarget {
  objectName: string;
  objectId: string;
  componentType: string;
  componentId: string;
  materialName: string | null;
  materialId: string | null;
  materialPath: string | null;
  baseTextureId: string | null;
  baseColor: unknown;
  opacityInput: unknown;
}

interface AssetRecord { id: string; name: string; type: string; path: string | null; properties: Record<string, unknown> }
export interface TechnicalProjectSnapshot {
  capturedAt: string;
  projectFingerprint: string;
  object: TechnicalTargetReference | null;
  component: TechnicalTargetReference | null;
  material: TechnicalTargetReference | null;
  baseTexture: TechnicalTargetReference | null;
  baseTextureValue: unknown;
  baseColorValue: unknown;
  undocumentedOpacityValue: unknown;
  baseline: TechnicalBaselineValue[];
  evidenceSources: string[];
  inspectionMessage: string;
}

const RUNTIME_QUERY = "{ sceneRoots { summary descendantsTree(maxDepth: 5, enabledOnly: false) } }";
const ASSET_QUERY = "{ allAssets(limit: 200) { id name type path properties } }";

export function editorInspectionCode(targetObjectName: string) {
  return `const model = pluginSystem.findInterface(Editor.Model.IModel);
const scene = model.project.scene;
const matches = scene.findComponents("PostEffectVisual").filter((component) => component.sceneObject.name === ${JSON.stringify(targetObjectName)});
return matches.map((component) => {
  const material = component.mainMaterial;
  const pass = material.passInfos && material.passInfos.length > 0 ? material.passInfos[0] : null;
  return {
    objectName: component.sceneObject.name,
    objectId: String(component.sceneObject.id),
    componentType: "PostEffectVisual",
    componentId: String(component.id),
    materialName: material ? material.name : null,
    materialId: material ? String(material.id) : null,
    materialPath: material && material.fileMeta ? String(material.fileMeta.sourcePath) : null,
    baseTextureId: pass && pass.baseTex ? String(pass.baseTex.id) : null,
    baseColor: pass && pass.baseColor ? {x:pass.baseColor.x,y:pass.baseColor.y,z:pass.baseColor.z,w:pass.baseColor.w} : null,
    opacityInput: pass && pass.Port_Input2_N011 !== undefined ? pass.Port_Input2_N011 : null
  };
});`;
}

export class LensStudioTechnicalInspector {
  constructor(private readonly connection: TechnicalInspectionConnection, private readonly targetObjectName: string, private readonly presetName: string | null = null) {}

  async inspect(): Promise<TechnicalProjectSnapshot> {
    const required = ["QueryRuntimeSceneTool", "asset-graphql", "ExecuteEditorCode"];
    const missing = required.filter((name) => !this.connection.supports(name));
    if (missing.length) return emptySnapshot(`Technical inspection is incomplete. Missing MCP capabilities: ${missing.join(", ")}.`);

    const runtime = toolJson(await this.connection.callSupportedTool("QueryRuntimeSceneTool", { query: RUNTIME_QUERY, timeoutMs: 5000 }));
    const assetsPayload = toolJson(await this.connection.callSupportedTool("asset-graphql", { query: ASSET_QUERY }));
    const editorPayload = toolJson(await this.connection.callSupportedTool("ExecuteEditorCode", { code: editorInspectionCode(this.targetObjectName), timeoutMs: 10000 }));
    const presetPayload = this.presetName && this.connection.supports("scene-graphql")
      ? toolJson(await this.connection.callSupportedTool("scene-graphql", { query: `{ preset(presetName:${JSON.stringify(this.presetName)}) { name description entityType section } }` }))
      : null;

    const editorTarget = Array.isArray(editorPayload.returnValue) ? editorPayload.returnValue[0] as EditorTarget | undefined : undefined;
    const assets = readAssets(assetsPayload);
    const materialAsset = editorTarget?.materialId ? assets.find((asset) => asset.id === editorTarget.materialId) ?? null : null;
    const textureAsset = editorTarget?.baseTextureId ? assets.find((asset) => asset.id === editorTarget.baseTextureId) ?? null : null;
    const shaderAssets = assets.filter((asset) => /shader/i.test(asset.type));
    const scriptAssets = assets.filter((asset) => /script/i.test(asset.type));
    const object = editorTarget ? target(editorTarget.objectName, editorTarget.objectId, "SceneObject", null) : null;
    const component = editorTarget ? target(editorTarget.componentType, editorTarget.componentId, "PostEffectVisual", null) : null;
    const material = materialAsset ? target(materialAsset.name, materialAsset.id, materialAsset.type, materialAsset.path) : null;
    const baseTexture = textureAsset ? target(textureAsset.name, textureAsset.id, textureAsset.type, textureAsset.path) : null;
    const baseTextureValue = baseTexture ? { id: baseTexture.id, name: baseTexture.name, path: baseTexture.path } : null;
    const baseColorValue = editorTarget?.baseColor ?? null;
    const undocumentedOpacityValue = editorTarget?.opacityInput ?? null;
    const evidenceSources = [
      `QueryRuntimeSceneTool: ${runtimeContainsObject(runtime, this.targetObjectName) ? `found ${this.targetObjectName} in the live preview hierarchy` : `${this.targetObjectName} was not visible in the live preview hierarchy`}.`,
      editorTarget ? `ExecuteEditorCode (read-only): ${editorTarget.objectName} has PostEffectVisual ${editorTarget.componentId} using material ${editorTarget.materialName}.` : "ExecuteEditorCode (read-only): no matching PostEffectVisual was found.",
      material && baseTexture ? `asset-graphql: ${material.path} uses ${baseTexture.path} as passInfos.0.baseTex.` : "asset-graphql: the material-to-texture link could not be resolved.",
      `asset-graphql: shader assets found: ${shaderAssets.map((asset) => `${asset.path ?? asset.name} (${asset.type})`).join(", ") || "none"}; project script assets found: ${scriptAssets.map((asset) => asset.path ?? asset.name).join(", ") || "none"}. No material-to-shader relationship was inferred without an exposed reference.`,
    ];
    if (presetPayload) evidenceSources.push(`scene-graphql: ${JSON.stringify((presetPayload.data as { preset?: unknown } | undefined)?.preset ?? "preset unavailable")}.`);
    const baseline = baselineValues(object, component, material, baseTexture, baseTextureValue, baseColorValue, undocumentedOpacityValue);
    const projectFingerprint = await fingerprint({ object, component, material, baseTextureValue, baseColorValue, undocumentedOpacityValue });
    return { capturedAt: new Date().toISOString(), projectFingerprint, object, component, material, baseTexture, baseTextureValue, baseColorValue, undocumentedOpacityValue, baseline, evidenceSources, inspectionMessage: editorTarget && material && baseTexture ? "The current Soft Flash post-effect and its material chain were resolved." : "The current post-effect chain could not be resolved completely. Uncertain changes remain unknown." };
  }
}

export class TechnicalIterationPlanner {
  constructor(private readonly inspector: LensStudioTechnicalInspector) {}

  async plan(buildId: string, findings: VisualQAFinding[], sourceVisualScore: number | null, preserve: string[] = []): Promise<TechnicalIterationPlan> {
    const snapshot = await this.inspector.inspect();
    const changes = findings.map((finding, index) => mapFinding(finding, index, snapshot));
    return { id: `technical-plan-${buildId}-${Date.now()}`, buildId, sourceVisualScore, createdAt: new Date().toISOString(), projectFingerprint: snapshot.projectFingerprint, baseline: snapshot.baseline, changes, preserve, readyOperationCount: changes.filter((change) => change.status === "READY").length, requiresHumanConfirmation: true, executionEnabled: false, inspectionMessage: snapshot.inspectionMessage };
  }
}

function mapFinding(finding: VisualQAFinding, index: number, snapshot: TechnicalProjectSnapshot): TechnicalIterationChange {
  const text = `${finding.description} ${finding.recommendedChange}`.toLowerCase();
  const common = { id: `technical-change-${index + 1}`, category: finding.type, visualProblem: finding.description, visualRecommendation: finding.recommendedChange, targetObject: snapshot.object, reason: "", expectedVisualResult: finding.recommendedChange, reversible: false, evidenceSources: snapshot.evidenceSources };
  if (/pink|magenta|colour cast|color cast/.test(text) && snapshot.material && snapshot.baseTexture) {
    return { ...common, targetComponentOrAsset: snapshot.material, targetPropertyOrParameter: "passInfos.0.baseTex", currentValue: snapshot.baseTextureValue, proposedValueOrOperation: "Replace only the colour-correction LUT after a reviewed neutral-to-warm LUT asset is supplied and its real asset ID is discovered.", reason: "The current material uses BlownWhite.png as its colour-correction LUT. No reviewed replacement LUT exists in the project, so an exact asset reference cannot be proposed yet.", confidence: "MEDIUM", status: "NEEDS_HUMAN_INPUT" };
  }
  if (/skin texture|complexion variation|smoothed/.test(text)) {
    return { ...common, targetComponentOrAsset: snapshot.component ?? snapshot.material, targetPropertyOrParameter: null, currentValue: null, proposedValueOrOperation: "No operation proposed. No smoothing component or independently editable texture-preservation control was discovered.", reason: "The current Lens exposes one LUT-based PostEffectVisual. Changing the LUT without a verified replacement cannot isolate skin texture from colour and tone.", confidence: "LOW", status: snapshot.component ? "UNSUPPORTED" : "UNKNOWN" };
  }
  if (/highlight|upper-midtones|tonal separation/.test(text)) {
    return { ...common, targetComponentOrAsset: snapshot.material ?? snapshot.component, targetPropertyOrParameter: null, currentValue: null, proposedValueOrOperation: "No operation proposed. No documented highlight or upper-midtone control was discovered.", reason: "The material exposes the LUT, white base colour, and an undocumented numeric input. The undocumented input cannot be assigned a meaning or value safely.", confidence: "LOW", status: "UNKNOWN" };
  }
  if (/soft-flash|soft flash|direct-flash|pastel wash|tonal curve/.test(text)) {
    return { ...common, targetComponentOrAsset: snapshot.material ?? snapshot.component, targetPropertyOrParameter: null, currentValue: null, proposedValueOrOperation: "No operation proposed. No documented flash-strength, curve, or falloff control was discovered.", reason: "The current effect is a LUT-based PostEffectVisual. The exposed raw numeric input has no label or documented role, so the planner will not guess that it controls flash strength.", confidence: "LOW", status: "UNKNOWN" };
  }
  return { ...common, targetComponentOrAsset: null, targetPropertyOrParameter: null, currentValue: null, proposedValueOrOperation: "No operation proposed.", reason: "No real supported property could be mapped to this recommendation.", confidence: "LOW", status: "UNKNOWN" };
}

function baselineValues(object: TechnicalTargetReference | null, component: TechnicalTargetReference | null, material: TechnicalTargetReference | null, texture: TechnicalTargetReference | null, baseTextureValue: unknown, baseColorValue: unknown, opacity: unknown): TechnicalBaselineValue[] {
  const values: TechnicalBaselineValue[] = [];
  if (component && material) values.push({ target: component, propertyPath: "mainMaterial", value: { id: material.id, name: material.name, path: material.path }, evidenceSource: "ExecuteEditorCode (read-only)" });
  if (material && texture) values.push({ target: material, propertyPath: "passInfos.0.baseTex", value: baseTextureValue, evidenceSource: "asset-graphql and ExecuteEditorCode (read-only)" });
  if (material && baseColorValue !== null) values.push({ target: material, propertyPath: "passInfos.0.baseColor", value: baseColorValue, evidenceSource: "asset-graphql and ExecuteEditorCode (read-only)" });
  if (material && opacity !== null) values.push({ target: material, propertyPath: "passInfos.0.Port_Input2_N011", value: opacity, evidenceSource: "asset-graphql and ExecuteEditorCode (read-only); semantic meaning is undocumented" });
  if (object) values.push({ target: object, propertyPath: "identity", value: { id: object.id, name: object.name }, evidenceSource: "QueryRuntimeSceneTool and ExecuteEditorCode (read-only)" });
  return values;
}

export function compareTechnicalBaselines(before: TechnicalBaselineValue[], after: TechnicalBaselineValue[]): TechnicalValueDifference[] {
  const next = new Map(after.map((item) => [`${item.target.id}:${item.propertyPath}`, item]));
  return before.flatMap((item) => { const current = next.get(`${item.target.id}:${item.propertyPath}`); return current && stable(current.value) !== stable(item.value) ? [{ propertyPath: item.propertyPath, before: item.value, after: current.value }] : []; });
}

function readAssets(payload: Record<string, unknown>) { return (((payload.data as { allAssets?: AssetRecord[] } | undefined)?.allAssets) ?? []); }
function target(name: string, id: string, type: string, path: string | null): TechnicalTargetReference { return { name, id, type, path }; }
function toolJson(result: LensStudioToolResult): Record<string, unknown> { const text = result.content?.find((item) => item.type === "text" && item.text)?.text; if (!text) return {}; try { return JSON.parse(text) as Record<string, unknown>; } catch { return {}; } }
function runtimeContainsObject(payload: Record<string, unknown>, name: string) { return JSON.stringify(payload).includes(`"name":"${name}"`) || JSON.stringify(payload).includes(name); }
function stable(value: unknown): string { if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`; if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([a],[b]) => a.localeCompare(b)).map(([key,item]) => `${JSON.stringify(key)}:${stable(item)}`).join(",")}}`; return JSON.stringify(value); }
async function fingerprint(value: unknown) { const bytes = new TextEncoder().encode(JSON.stringify(value)); const digest = await crypto.subtle.digest("SHA-256", bytes); return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join(""); }
function emptySnapshot(message: string): TechnicalProjectSnapshot { return { capturedAt: new Date().toISOString(), projectFingerprint: "unavailable", object: null, component: null, material: null, baseTexture: null, baseTextureValue: null, baseColorValue: null, undocumentedOpacityValue: null, baseline: [], evidenceSources: [message], inspectionMessage: message }; }
