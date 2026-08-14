import test from "node:test";
import assert from "node:assert/strict";
import { parseCopiedMcpConfig, redactSecrets, selectVerifiedCandidate } from "../scripts/lens-mcp-config-lib.mjs";

const token = "Bearer secret-token-value";
const copied = JSON.stringify({ mcpServers: { "lens-studio": { type: "http", url: "http://localhost:50040/mcp", headers: { Authorization: token } } } });
const expectation = { lensName: "Effect Lab Sandbox", projectPath: "/Users/debbie/Documents/Effect Lab Training Sandbox" };
const sandboxIdentity = { lensName: "Effect Lab Sandbox", projectFolder: expectation.projectPath, projectFingerprint: "abc", excludedMarkersFound: [] };

test("valid copied Snap MCP config is parsed without changing the token", () => {
  const parsed = parseCopiedMcpConfig(copied);
  assert.equal(parsed.url, "http://localhost:50040/mcp");
  assert.equal(parsed.authorization, token);
  assert.equal(parsed.source, "MANUAL_CONFIG");
});

test("copied config validation rejects missing and malformed values", () => {
  assert.throws(() => parseCopiedMcpConfig("{"), /not valid JSON/);
  assert.throws(() => parseCopiedMcpConfig(JSON.stringify({ mcpServers: {} })), /no lens-studio entry/);
  assert.throws(() => parseCopiedMcpConfig(JSON.stringify({ mcpServers: { "lens-studio": { headers: { Authorization: token } } } })), /URL is missing/);
  assert.throws(() => parseCopiedMcpConfig(JSON.stringify({ mcpServers: { "lens-studio": { url: "http://localhost:50040/mcp", headers: {} } } })), /Authorization header is missing/);
});

test("secret redaction removes exact and bearer token values", () => {
  const candidate = parseCopiedMcpConfig(copied);
  const output = redactSecrets(`Failed with ${token}`, [candidate]);
  assert.doesNotMatch(output, /secret-token-value/);
  assert.match(output, /REDACTED/);
});

test("manual config must pass live connection verification", async () => {
  const candidate = parseCopiedMcpConfig(copied);
  let calls = 0;
  const result = await selectVerifiedCandidate([candidate], null, async () => { calls += 1; return { capabilityCount: 38, identity: sandboxIdentity }; });
  assert.equal(calls, 1);
  assert.equal(result.selected.candidate.source, "MANUAL_CONFIG");
  assert.equal(result.selected.verification.capabilityCount, 38);
});

test("stale auto-discovered configs are rejected", async () => {
  const stale = { ...parseCopiedMcpConfig(copied, "AUTO_DISCOVERY"), url: "http://localhost:50041/mcp" };
  await assert.rejects(selectVerifiedCandidate([stale], null, async () => { throw new Error("Connection refused"); }), /No live Lens Studio MCP server was verified/);
});

test("multiple live configs are never selected by recency", async () => {
  const first = parseCopiedMcpConfig(copied, "AUTO_DISCOVERY");
  const second = { ...first, url: "http://localhost:50041/mcp", authorization: "Bearer second" };
  await assert.rejects(selectVerifiedCandidate([first, second], null, async (candidate) => ({ capabilityCount: 38, identity: { lensName: candidate.url } })), /More than one live/);
});

test("sandbox verification returns VERIFIED for the exact live Lens", async () => {
  const candidate = parseCopiedMcpConfig(copied);
  const result = await selectVerifiedCandidate([candidate], expectation, async () => ({ capabilityCount: 38, identity: sandboxIdentity }));
  assert.equal(result.sandboxStatus, "VERIFIED");
});

test("sandbox verification rejects a mismatched live Lens", async () => {
  const candidate = parseCopiedMcpConfig(copied);
  await assert.rejects(selectVerifiedCandidate([candidate], expectation, async () => ({ capabilityCount: 38, identity: { ...sandboxIdentity, lensName: "Untitled" } })), (error: Error & { code?: string }) => error.code === "MISMATCH" && !error.message.includes(token));
});

test("sandbox verification keeps the exact project-path and marker checks", async () => {
  const candidate = parseCopiedMcpConfig(copied);
  await assert.rejects(selectVerifiedCandidate([candidate], expectation, async () => ({ capabilityCount: 38, identity: { ...sandboxIdentity, projectFolder: "/tmp/Effect Lab Training Sandbox" } })), (error: Error & { code?: string }) => error.code === "MISMATCH");
  await assert.rejects(selectVerifiedCandidate([candidate], expectation, async () => ({ capabilityCount: 38, identity: { ...sandboxIdentity, excludedMarkersFound: ["Blown White"] } })), (error: Error & { code?: string }) => error.code === "MISMATCH");
});

test("sandbox verification is UNKNOWN when live identity cannot be read", async () => {
  const candidate = parseCopiedMcpConfig(copied);
  await assert.rejects(selectVerifiedCandidate([candidate], expectation, async () => ({ capabilityCount: 10, identity: null })), (error: Error & { code?: string }) => error.code === "UNKNOWN");
});
