import test from "node:test";
import assert from "node:assert/strict";
import { LensStudioTechnicalInspector, TechnicalIterationPlanner, compareTechnicalBaselines, type TechnicalInspectionConnection } from "../services/technical-iteration-planner.ts";
import type { LensStudioToolResult } from "../services/lens-studio-connection.ts";
import type { TechnicalBaselineValue, VisualQAFinding } from "../types/creative-qa.ts";

const findings: VisualQAFinding[] = [
  { type: "COLOUR", severity: "HIGH", description: "The result carries a noticeable pink-magenta cast rather than a restrained neutral-to-gently-warm balance.", evidence: "White surfaces and skin appear pink.", recommendedChange: "Reduce the global magenta/pink bias and return whites and skin toward a neutral, softly warm photographic balance." },
  { type: "LIGHTING", severity: "MEDIUM", description: "The treatment does not clearly communicate a controlled soft-flash look; it reads more as a bright, low-contrast pastel wash.", evidence: "Facial illumination is broad and flat.", recommendedChange: "Refine the tonal curve to create a subtle, believable direct-flash impression." },
  { type: "LIGHTING", severity: "MEDIUM", description: "Some bright areas lack tonal separation.", evidence: "White surfaces have limited visible detail.", recommendedChange: "Pull back upper-midtones and highlights so white surfaces retain more texture." },
  { type: "CATEGORY", severity: "MEDIUM", description: "Natural skin texture is not strongly evident and appears smoothed.", evidence: "The complexion is exceptionally uniform.", recommendedChange: "Preserve more fine complexion variation and skin texture." },
];

class FakeInspectionConnection implements TechnicalInspectionConnection {
  calls: Array<{ name: string; args: Record<string, unknown> }> = [];
  supports(name: string) { return ["QueryRuntimeSceneTool", "asset-graphql", "ExecuteEditorCode", "scene-graphql"].includes(name); }
  async callSupportedTool(name: string, args: Record<string, unknown>): Promise<LensStudioToolResult> {
    this.calls.push({ name, args });
    if (name === "QueryRuntimeSceneTool") return text({ data: { sceneRoots: [{ descendantsTree: [{ name: "Blown White" }] }] } });
    if (name === "asset-graphql") return text({ data: { allAssets: [
      { id: "material-id", name: "Color Correction", type: "Material", path: "Color Correction.mat", properties: {} },
      { id: "texture-id", name: "BlownWhite", type: "FileTexture", path: "BlownWhite.png", properties: {} },
    ] } });
    if (name === "scene-graphql") return text({ data: { preset: { name: "BlownWhitePreset", description: "PostEffectVisual with Blown White LUT" } } });
    return text({ status: "Execution Succeeded", returnValue: [{ objectName: "Blown White", objectId: "object-id", componentType: "PostEffectVisual", componentId: "component-id", materialName: "Color Correction", materialId: "material-id", materialPath: "Color Correction.mat", baseTextureId: "texture-id", baseColor: { x: 1, y: 1, z: 1, w: 1 }, opacityInput: 1 }] });
  }
}

test("technical planner grounds Soft Flash recommendations in discovered targets without guessing", async () => {
  const connection = new FakeInspectionConnection();
  const plan = await new TechnicalIterationPlanner(new LensStudioTechnicalInspector(connection, "Blown White", "BlownWhitePreset")).plan("build", findings, 5.9, ["Keep the face as the focal point."]);
  assert.deepEqual(plan.changes.map((change) => change.status), ["NEEDS_HUMAN_INPUT", "UNKNOWN", "UNKNOWN", "UNSUPPORTED"]);
  assert.equal(plan.changes[0].targetObject?.id, "object-id");
  assert.equal(plan.changes[0].targetComponentOrAsset?.path, "Color Correction.mat");
  assert.equal(plan.changes[0].targetPropertyOrParameter, "passInfos.0.baseTex");
  assert.deepEqual(plan.changes[0].currentValue, { id: "texture-id", name: "BlownWhite", path: "BlownWhite.png" });
  assert.equal(plan.readyOperationCount, 0);
  assert.equal(plan.executionEnabled, false);
  assert.equal(plan.changes.every((change) => change.reversible === false), true);
});

test("technical inspection uses query tools and read-only editor code only", async () => {
  const connection = new FakeInspectionConnection();
  await new LensStudioTechnicalInspector(connection, "Blown White", "BlownWhitePreset").inspect();
  assert.equal(connection.calls.some((call) => call.name === "VirtualScene"), false);
  const editorCode = String(connection.calls.find((call) => call.name === "ExecuteEditorCode")?.args.code);
  assert.doesNotMatch(editorCode, /\b(?:mutation|setProperty|createSceneObject|deleteSceneObject|destroy)\b/);
  assert.equal(connection.calls.every((call) => !String(call.args.query ?? "").includes("mutation")), true);
});

test("baseline comparison reports exact readable property changes", () => {
  const target = { id: "material-id", name: "Color Correction", type: "Material", path: "Color Correction.mat" };
  const before: TechnicalBaselineValue[] = [{ target, propertyPath: "passInfos.0.baseTex", value: { id: "old" }, evidenceSource: "test" }];
  const after: TechnicalBaselineValue[] = [{ target, propertyPath: "passInfos.0.baseTex", value: { id: "new" }, evidenceSource: "test" }];
  assert.deepEqual(compareTechnicalBaselines(before, after), [{ propertyPath: "passInfos.0.baseTex", before: { id: "old" }, after: { id: "new" } }]);
});

test("missing inspection capabilities leave every recommendation unknown", async () => {
  const connection: TechnicalInspectionConnection = { supports: () => false, callSupportedTool: async () => { throw new Error("must not call"); } };
  const plan = await new TechnicalIterationPlanner(new LensStudioTechnicalInspector(connection, "Blown White")).plan("build", [findings[0]], 5.9);
  assert.equal(plan.changes[0].status, "UNKNOWN");
  assert.equal(plan.changes[0].targetPropertyOrParameter, null);
});

function text(value: unknown): LensStudioToolResult { return { content: [{ type: "text", text: JSON.stringify(value) }], isError: false }; }
