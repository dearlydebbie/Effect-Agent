import test from "node:test";
import assert from "node:assert/strict";
import { softFlashTestSpecification } from "../data/soft-flash-test.ts";
import { LensStudioConnectionService, type McpTransport } from "../services/lens-studio-connection.ts";
import { SnapchatLensBuildOrchestrator } from "../services/snapchat-build-orchestrator.ts";

const requiredTools = ["QueryRuntimeSceneTool", "scene-graphql", "RecompileTypeScriptTool", "RunAndCollectLogsTool", "PreviewPanelTool"];
function transport(toolNames = requiredTools): McpTransport {
  return {
    async initialize(){ return { serverName: "Lens Studio MCP Server", serverVersion: "1.0.0", protocolVersion: "2025-11-25" }; },
    async listTools(){ return toolNames.map((name) => ({ name, inputSchema: { type: "object" } })); },
    async callTool(name){
      const text = name === "QueryRuntimeSceneTool" ? "Soft Flash Treatment" : name === "RunAndCollectLogsTool" ? JSON.stringify({ data: { errors: [] } }) : "succeeded";
      return { content: [{ type: "text", text }] };
    },
  };
}

test("build plan maps only capabilities returned by Lens Studio", async () => {
  const plan = await new SnapchatLensBuildOrchestrator(new LensStudioConnectionService(transport(["QueryRuntimeSceneTool"]))).createPlan(softFlashTestSpecification);
  assert.equal(plan.operations.find((item) => item.toolName === "QueryRuntimeSceneTool")?.supported, true);
  assert.equal(plan.operations.find((item) => item.toolName === "scene-graphql")?.supported, false);
});

test("build waits for human specification confirmation", async () => {
  const report = await new SnapchatLensBuildOrchestrator(new LensStudioConnectionService(transport())).build(softFlashTestSpecification, false);
  assert.equal(report.status, "WAITING");
  assert.equal(report.operationsCompleted.length, 0);
});

test("confirmed build stops at human review and never publishes", async () => {
  const report = await new SnapchatLensBuildOrchestrator(new LensStudioConnectionService(transport())).build(softFlashTestSpecification, true);
  assert.equal(report.status, "NEEDS_REVIEW");
  assert.equal(report.humanReviewRequired, true);
  assert.equal(report.logs.some((log) => /publish/i.test(log.toolName ?? "")), false);
});
