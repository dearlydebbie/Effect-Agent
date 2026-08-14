import test from "node:test";
import assert from "node:assert/strict";
import { naturalBeautyReviewIdentity } from "../config/builds.ts";
import { verifyNaturalBeautyHumanReview } from "../services/natural-beauty-review-readiness.ts";
import { LensStudioConnectionService, type LensStudioToolResult, type McpTransport } from "../services/lens-studio-connection.ts";

const capabilities = ["ExecuteEditorCode", "QueryRuntimeSceneTool", "asset-graphql"];

function connection(options: { gradeEnabled?: boolean; includeSoftFlashMarker?: boolean } = {}) {
  const transport: McpTransport = {
    async initialize() { return { serverName: "Lens Studio", serverVersion: "5.x", protocolVersion: "2025-03-26" }; },
    async listTools() { return capabilities.map((name) => ({ name, description: name, inputSchema: {} })); },
    async callTool(name, args) {
      if (name === "QueryRuntimeSceneTool") return json({ data: { sceneRoots: [{ name: "Camera" }, { name: "Natural Beauty Grade" }, { name: "Natural Beauty Retouch" }] } });
      if (name === "asset-graphql") return json({ data: { allAssets: [
        { name: "Natural Beauty Colour Material", path: "Assets/Natural Beauty Colour Material.mat" },
        { name: "Natural Beauty LUT", path: "Assets/Natural Beauty LUT.png" },
        ...(options.includeSoftFlashMarker ? [{ name: "BlownWhite", path: "Assets/BlownWhite.png" }] : []),
      ] } });
      const code = String(args.code ?? "");
      if (code.includes("project.metaInfo")) return json({ returnValue: {
        lensName: "Effect Lab Sandbox",
        projectFile: "/Users/debbie/Documents/Effect Lab Training Sandbox/Project.esproj",
        projectDirectory: "/Users/debbie/Documents/Effect Lab Training Sandbox",
        assetsDirectory: "/Users/debbie/Documents/Effect Lab Training Sandbox/Assets",
      } });
      return json({ returnValue: {
        grade: {
          objectId: "95954e47-3175-4685-a1a6-93e78436c207", objectName: "Natural Beauty Grade",
          componentId: "ea8d555f-5f9d-4e8a-bb65-1769008c0d9e", componentType: "PostEffectVisual",
          enabled: options.gradeEnabled ?? false,
          materialId: "9984c94e-8f7a-4198-a59b-e4f8d061ed7c", materialName: "Natural Beauty Colour Material",
          materialPath: "Assets/Natural Beauty Colour Material.mat", firstMaterialId: "9984c94e-8f7a-4198-a59b-e4f8d061ed7c",
          lutId: "8da2358c-e0d0-4b1c-a475-07948c97f36d", lutName: "Natural Beauty LUT", lutPath: "Assets/Natural Beauty LUT.png",
        },
        retouch: {
          objectId: "3e2b87d4-94cf-41c1-88be-2a08ac2117e8", objectName: "Natural Beauty Retouch",
          componentId: "ac14ad83-f8b6-4187-a0cc-8ab272902e37", componentType: "RetouchVisual", enabled: true,
          faceIndex: 0, softSkinIntensity: 0.25, teethWhiteningIntensity: 0.1, sharpenEyeIntensity: 0.2, eyeWhiteningIntensity: 0.08,
        },
      } });
    },
  };
  return new LensStudioConnectionService(transport, "5.x");
}

test("Natural Beauty review readiness requires the exact live Iteration 1 state", async () => {
  const result = await verifyNaturalBeautyHumanReview(connection(), "MANUAL_CONFIG");
  assert.equal(result.ready, true);
  assert.equal(result.sandboxStatus, "VERIFIED");
  assert.equal(result.buildStateFingerprint, naturalBeautyReviewIdentity.buildStateFingerprint);
  assert.deepEqual(result.mismatches, []);
  assert.equal(result.lensStudioModifiedByVerification, false);
  assert.equal(result.openAICalled, false);
  assert.equal(result.published, false);
});

test("Natural Beauty review readiness rejects a changed controlled value", async () => {
  const result = await verifyNaturalBeautyHumanReview(connection({ gradeEnabled: true }), "MANUAL_CONFIG");
  assert.equal(result.ready, false);
  assert.equal(result.checks.find((check) => check.id === "grade")?.passed, false);
  assert.equal(result.checks.find((check) => check.id === "build-fingerprint")?.passed, false);
});

test("Natural Beauty review readiness rejects Soft Flash markers", async () => {
  const result = await verifyNaturalBeautyHumanReview(connection({ includeSoftFlashMarker: true }), "MANUAL_CONFIG");
  assert.equal(result.ready, false);
  assert.equal(result.sandboxStatus, "MISMATCH");
  assert.match(result.mismatches.join(" "), /Soft Flash markers/);
});

function json(value: unknown): LensStudioToolResult {
  return { content: [{ type: "text", text: JSON.stringify(value) }] };
}
