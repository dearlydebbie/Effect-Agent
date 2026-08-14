export const CONNECTION_SOURCES = ["MANUAL_CONFIG", "AUTO_DISCOVERY", "UNKNOWN"];

export function parseCopiedMcpConfig(input, source = "MANUAL_CONFIG") {
  let value;
  try { value = JSON.parse(input); }
  catch { throw new Error("The MCP config is not valid JSON."); }
  const server = value?.mcpServers?.["lens-studio"];
  if (!server || typeof server !== "object") throw new Error("The MCP config has no lens-studio entry.");
  if (typeof server.url !== "string" || !server.url.trim()) throw new Error("The Lens Studio MCP URL is missing.");
  const authorization = server.headers?.Authorization;
  if (typeof authorization !== "string" || !authorization.trim()) throw new Error("The Lens Studio Authorization header is missing.");
  let endpoint;
  try { endpoint = new URL(server.url); }
  catch { throw new Error("The Lens Studio MCP URL is not valid."); }
  if (!["localhost", "127.0.0.1", "::1"].includes(endpoint.hostname)) throw new Error("The Lens Studio MCP URL must be local.");
  if (endpoint.protocol !== "http:" && endpoint.protocol !== "https:") throw new Error("The Lens Studio MCP URL must use HTTP.");
  return { url: endpoint.toString(), authorization, source, configPath: null };
}

export function parseStoredEnvironment(input) {
  const values = Object.fromEntries(input.split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) return [];
    try { return [[match[1], JSON.parse(match[2])]]; } catch { return [[match[1], match[2]]]; }
  }));
  const url = values.LENS_STUDIO_MCP_URL;
  const authorization = values.LENS_STUDIO_MCP_AUTHORIZATION;
  if (typeof url !== "string" || typeof authorization !== "string") return null;
  try {
    return parseCopiedMcpConfig(JSON.stringify({ mcpServers: { "lens-studio": { url, headers: { Authorization: authorization } } } }), CONNECTION_SOURCES.includes(values.LENS_STUDIO_MCP_CONNECTION_SOURCE) ? values.LENS_STUDIO_MCP_CONNECTION_SOURCE : "UNKNOWN");
  } catch { return null; }
}

export function redactSecrets(value, candidates = []) {
  let output = String(value);
  for (const candidate of candidates) if (candidate?.authorization) output = output.split(candidate.authorization).join("[REDACTED]");
  return output.replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]");
}

export function evaluateSandboxIdentity(identity, expectation) {
  if (!identity || !identity.projectFingerprint) return { status: "UNKNOWN", reasons: [!identity ? "The live project identity is unknown." : "The project fingerprint was not captured."] };
  const reasons = [];
  if (identity.lensName !== expectation.lensName) reasons.push(`The Lens name is ${identity.lensName ?? "unknown"}. Expected ${expectation.lensName}.`);
  const actualPath = normalizePath(identity.projectFolder ?? identity.projectDirectory);
  if (actualPath !== normalizePath(expectation.projectPath)) reasons.push(`The project path is ${actualPath ?? "unknown"}. Expected ${expectation.projectPath}.`);
  if (identity.excludedMarkersFound?.length) reasons.push(`Soft Flash markers were found: ${identity.excludedMarkersFound.join(", ")}.`);
  return { status: reasons.length ? "MISMATCH" : "VERIFIED", reasons };
}

export async function selectVerifiedCandidate(candidates, expectation, verifier) {
  const unique = [...new Map(candidates.map((candidate) => [`${candidate.url}\u0000${candidate.authorization}`, candidate])).values()];
  const live = [];
  const rejected = [];
  for (const candidate of unique) {
    try { live.push({ candidate, verification: await verifier(candidate) }); }
    catch (error) { rejected.push({ candidate, reason: error instanceof Error ? error.message : "Connection verification failed." }); }
  }
  if (expectation) {
    const assessed = live.map((item) => ({ ...item, sandbox: evaluateSandboxIdentity(item.verification.identity, expectation) }));
    const matches = assessed.filter((item) => item.sandbox.status === "VERIFIED");
    if (matches.length === 1) return { selected: matches[0], live, rejected, sandboxStatus: "VERIFIED" };
    if (matches.length > 1) throw new Error("More than one live MCP server matches the training project.");
    const known = assessed.filter((item) => item.sandbox.status === "MISMATCH");
    const reasons = assessed.flatMap((item) => item.sandbox.reasons);
    const error = new Error(`The training project is not verified. ${reasons.join(" ")}`.trim());
    error.code = known.length ? "MISMATCH" : "UNKNOWN";
    throw error;
  }
  if (live.length === 1) return { selected: live[0], live, rejected, sandboxStatus: "UNKNOWN" };
  if (!live.length) throw new Error("No live Lens Studio MCP server was verified.");
  throw new Error("More than one live Lens Studio MCP server was found. Use the manual sync command.");
}

function normalizePath(value) { return typeof value === "string" ? value.replace(/[\\/]+$/, "") : null; }
