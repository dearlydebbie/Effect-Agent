import { existsSync, readFileSync, readdirSync, writeFileSync, chmodSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { parseCopiedMcpConfig, parseStoredEnvironment, redactSecrets, selectVerifiedCandidate } from "./lens-mcp-config-lib.mjs";

const EXPECTED_FLAG = "--expect";
const EXPECTED_PATH_FLAG = "--expect-path";
const MANUAL_FLAG = "--stdin";
const EXCLUDED_MARKERS = ["Blown White", "Color Correction", "color_correction", "BlownWhite"];

function argumentValue(flag) { const index = process.argv.indexOf(flag); return index >= 0 ? process.argv[index + 1] : null; }
async function readStdin() { const chunks = []; let size = 0; for await (const chunk of process.stdin) { size += chunk.length; if (size > 1024 * 1024) throw new Error("The MCP config is too large."); chunks.push(chunk); } const value = Buffer.concat(chunks).toString("utf8").trim(); if (!value) throw new Error("No MCP config was received on stdin."); return value; }

function discoverDiskConfigs() {
  const found = [];
  const visit = (folder, depth) => {
    if (depth > 5) return;
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const path = join(folder, entry.name);
      const config = join(path, ".mcp.json");
      if (existsSync(config)) found.push(config);
      visit(path, depth + 1);
    }
  };
  for (const entry of readdirSync(tmpdir(), { withFileTypes: true })) if (entry.isDirectory() && entry.name.startsWith("LensStudio_")) visit(join(tmpdir(), entry.name), 0);
  return found.flatMap((path) => { try { return [{ ...parseCopiedMcpConfig(readFileSync(path, "utf8"), "AUTO_DISCOVERY"), configPath: path }]; } catch { return []; } });
}

async function rpc(candidate, method, params, sessionId = null) {
  const headers = { "Content-Type": "application/json", Accept: "application/json, text/event-stream", Authorization: candidate.authorization };
  if (sessionId) headers["mcp-session-id"] = sessionId;
  const response = await fetch(candidate.url, { method: "POST", headers, body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }), signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`Lens Studio returned HTTP ${response.status}.`);
  const body = await response.text();
  const dataLine = body.split("\n").find((line) => line.startsWith("data:"));
  const payload = JSON.parse(dataLine ? dataLine.slice(5).trim() : body);
  if (payload.error) throw new Error(String(payload.error.message ?? "Lens Studio returned an MCP error."));
  return { result: payload.result, sessionId: response.headers.get("mcp-session-id") ?? sessionId };
}

async function verifyCandidate(candidate) {
  const initialized = await rpc(candidate, "initialize", { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "effect-lab-sync", version: "0.4.0" } });
  await fetch(candidate.url, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", Authorization: candidate.authorization, ...(initialized.sessionId ? { "mcp-session-id": initialized.sessionId } : {}) }, body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized", params: {} }), signal: AbortSignal.timeout(12000) });
  const listed = await rpc(candidate, "tools/list", {}, initialized.sessionId);
  const tools = listed.result?.tools ?? [];
  if (!Array.isArray(tools) || !tools.length) throw new Error("Lens Studio returned no MCP capabilities.");
  const required = ["ExecuteEditorCode", "QueryRuntimeSceneTool", "asset-graphql"];
  if (!required.every((name) => tools.some((tool) => tool.name === name))) return { capabilityCount: tools.length, identity: null };
  const code = `const model = pluginSystem.findInterface(Editor.Model.IModel); const project = model.project; return { lensName: project.metaInfo ? project.metaInfo.lensName : null, projectFile: String(project.projectFile), projectDirectory: String(project.projectDirectory) };`;
  const called = await rpc(candidate, "tools/call", { name: "ExecuteEditorCode", arguments: { code, timeoutMs: 10000 } }, initialized.sessionId);
  const text = called.result?.content?.find((item) => item.type === "text")?.text;
  const execution = text ? JSON.parse(text) : {};
  if (execution.status !== "Execution Succeeded") throw new Error("The live project identity could not be read.");
  const runtime = await rpc(candidate, "tools/call", { name: "QueryRuntimeSceneTool", arguments: { query: "{ sceneRoots { summary descendantsTree(maxDepth: 5, enabledOnly: false) } }", timeoutMs: 10000 } }, initialized.sessionId);
  const assets = await rpc(candidate, "tools/call", { name: "asset-graphql", arguments: { query: "{ allAssets(limit: 500) { id name path type } }" } }, initialized.sessionId);
  const identity = execution.returnValue ?? null;
  if (!identity) return { capabilityCount: tools.length, identity: null };
  const evidence = `${toolText(runtime.result)}\n${toolText(assets.result)}`;
  identity.projectFolder = identity.projectDirectory ?? null;
  identity.excludedMarkersFound = EXCLUDED_MARKERS.filter((marker) => evidence.toLowerCase().includes(marker.toLowerCase()));
  identity.projectFingerprint = createHash("sha256").update(JSON.stringify({ lensName: identity.lensName, projectFile: identity.projectFile, projectFolder: identity.projectFolder, runtime: toolText(runtime.result), assets: toolText(assets.result) })).digest("hex");
  return { capabilityCount: tools.length, identity };
}

function toolText(result) {
  if (result?.isError) throw new Error("A required read-only Lens Studio query failed.");
  const text = result?.content?.find((item) => item.type === "text")?.text;
  if (!text) throw new Error("A required read-only Lens Studio query returned no evidence.");
  return text;
}

const destination = join(process.cwd(), ".env.local");
const existing = existsSync(destination) ? readFileSync(destination, "utf8") : "";
let candidates = [];
const expectedName = argumentValue(EXPECTED_FLAG) ?? process.env.LENS_STUDIO_EXPECTED_PROJECT_NAME ?? null;
const expectedPath = argumentValue(EXPECTED_PATH_FLAG) ?? process.env.LENS_STUDIO_EXPECTED_PROJECT_PATH ?? null;
const expectation = expectedName || expectedPath ? { lensName: expectedName, projectPath: expectedPath } : null;
try {
  if (expectation && (!expectedName || !expectedPath)) throw new Error("Sandbox verification requires both the expected Lens name and project path.");
  if (process.argv.includes(MANUAL_FLAG)) candidates = [parseCopiedMcpConfig(await readStdin(), "MANUAL_CONFIG")];
  else {
    const stored = parseStoredEnvironment(existing);
    candidates = [...(stored ? [stored] : []), ...discoverDiskConfigs()];
  }
  if (!candidates.length) throw new Error("No MCP config is available. Copy the MCP config from Lens Studio.");
  const result = await selectVerifiedCandidate(candidates, expectation, verifyCandidate);
  const selected = result.selected;
  const infoPlist = "/Applications/Lens Studio.app/Contents/Info.plist";
  let lensStudioVersion = "Unknown";
  if (existsSync(infoPlist)) lensStudioVersion = execFileSync("/usr/bin/plutil", ["-extract", "CFBundleShortVersionString", "raw", infoPlist], { encoding: "utf8" }).trim();
  const verifiedAt = new Date().toISOString();
  const preserved = existing.split("\n").filter((line) => !line.startsWith("LENS_STUDIO_MCP_") && !line.startsWith("LENS_STUDIO_VERSION=")).filter(Boolean);
  preserved.push(`LENS_STUDIO_MCP_URL=${JSON.stringify(selected.candidate.url)}`);
  preserved.push(`LENS_STUDIO_MCP_AUTHORIZATION=${JSON.stringify(selected.candidate.authorization)}`);
  preserved.push(`LENS_STUDIO_MCP_CONNECTION_SOURCE=${JSON.stringify(selected.candidate.source)}`);
  preserved.push(`LENS_STUDIO_MCP_LAST_VERIFIED=${JSON.stringify(verifiedAt)}`);
  preserved.push(`LENS_STUDIO_MCP_PROJECT_FINGERPRINT=${JSON.stringify(selected.verification.identity?.projectFingerprint ?? "")}`);
  preserved.push(`LENS_STUDIO_VERSION=${JSON.stringify(lensStudioVersion)}`);
  writeFileSync(destination, `${preserved.join("\n")}\n`, { mode: 0o600 });
  chmodSync(destination, 0o600);
  console.log("Lens Studio MCP connection verified.");
  console.log(`Project: ${selected.verification.identity?.lensName ?? "Unknown"}`);
  console.log(`Sandbox: ${expectation ? result.sandboxStatus : "UNKNOWN"}`);
  console.log(`Connection source: ${selected.candidate.source}`);
  console.log(`Capabilities: ${selected.verification.capabilityCount}`);
  console.log("The local server config was saved. No credential was printed.");
} catch (error) {
  if (expectation) console.error(`Sandbox: ${error?.code === "MISMATCH" || error?.code === "UNKNOWN" ? error.code : "UNKNOWN"}`);
  console.error(redactSecrets(error instanceof Error ? error.message : "Lens Studio sync failed.", candidates));
  process.exitCode = 1;
}
