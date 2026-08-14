import test from "node:test";
import assert from "node:assert/strict";
import { SnapchatAdapter } from "../adapters/snapchat-adapter.ts";
import { TikTokAdapter } from "../adapters/tiktok-adapter.ts";
import { demoIdeas } from "../data/demo-ideas.ts";
import { LensStudioConnectionService, type McpTransport } from "../services/lens-studio-connection.ts";

const transport: McpTransport = {
  async initialize(){return {serverName:"Lens Studio MCP Server",serverVersion:"1.0.0",protocolVersion:"2025-11-25"}},
  async listTools(){return [{name:"RecompileTypeScriptTool",description:"Compile the open project.",inputSchema:{type:"object"}}]},
  async callTool(){return {content:[{type:"text",text:"ok"}]};},
};

test("Snapchat fails safely when MCP is unavailable",async()=>{const adapter=new SnapchatAdapter();const result=await adapter.prepareBuild(demoIdeas[0]);assert.equal(result.success,false);assert.equal(adapter.canPublishAutomatically(),false);});
test("Snapchat uses capabilities discovered from the MCP server",async()=>{const adapter=new SnapchatAdapter(new LensStudioConnectionService(transport));const result=await adapter.testConnection();assert.equal(result.connected,true);assert.deepEqual(result.capabilities,["RecompileTypeScriptTool"]);});
test("TikTok produces a manual build pack and no publish automation",()=>{const adapter=new TikTokAdapter();const pack=adapter.createBuildPack(demoIdeas[2]);assert.equal(pack.status,"Manual Effect House step required");assert.equal(adapter.canPublishAutomatically(),false);assert.match(adapter.exportJSON(demoIdeas[2]),/submissionChecklist/);});
