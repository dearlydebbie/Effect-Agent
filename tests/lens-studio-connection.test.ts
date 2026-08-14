import test from "node:test";
import assert from "node:assert/strict";
import { LensStudioConnectionService, type McpTransport } from "../services/lens-studio-connection.ts";

const capability = { name: "QueryRuntimeSceneTool", description: "Read the runtime scene.", inputSchema: { type: "object" } };

test("connection service exposes server-discovered capabilities", async () => {
  const transport: McpTransport = {
    async initialize(){ return { serverName: "Lens Studio MCP Server", serverVersion: "1.0.0", protocolVersion: "2025-11-25" }; },
    async listTools(){ return [capability]; },
    async callTool(name){ return { content: [{ type: "text", text: name }] }; },
  };
  const service = new LensStudioConnectionService(transport, "5.x");
  const info = await service.testConnection();
  assert.equal(info.state, "CONNECTED");
  assert.equal(service.supports("QueryRuntimeSceneTool"), true);
  assert.equal(service.supports("InventedTool"), false);
});

test("connection service fails safely without MCP configuration", async () => {
  const info = await new LensStudioConnectionService(null).testConnection();
  assert.equal(info.state, "DISCONNECTED");
  assert.equal(info.capabilities.length, 0);
});
