import type { LensStudioCapability, LensStudioConnectionInfo, LensStudioConnectionState } from "../types/lens-build";

interface JsonRpcResponse<T> { result?: T; error?: { code: number; message: string; data?: unknown } }
interface InitializeResult { protocolVersion: string; capabilities: Record<string, unknown>; serverInfo?: { name?: string; version?: string } }
interface ToolsListResult { tools: LensStudioCapability[] }
export interface LensStudioToolResult { content?: Array<{ type: string; text?: string; data?: string; mimeType?: string }>; isError?: boolean; structuredContent?: unknown }

export interface McpTransport {
  initialize(): Promise<{ serverName: string | null; serverVersion: string | null; protocolVersion: string }>;
  listTools(): Promise<LensStudioCapability[]>;
  callTool(name: string, args: Record<string, unknown>): Promise<LensStudioToolResult>;
}

type FetchLike = typeof fetch;

export class HttpMcpTransport implements McpTransport {
  private sessionId: string | null = null;
  private initialized = false;
  private nextId = 1;

  constructor(
    private readonly url: string,
    private readonly authorization: string,
    private readonly fetcher: FetchLike = fetch,
  ) {
    const endpoint = new URL(url);
    if (!(["localhost", "127.0.0.1", "::1"].includes(endpoint.hostname))) {
      throw new Error("Lens Studio MCP must use a local endpoint.");
    }
  }

  async initialize() {
    const response = await this.request<InitializeResult>("initialize", {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "effect-lab", version: "0.2.0" },
    }, false);
    await this.notify("notifications/initialized", {});
    this.initialized = true;
    return {
      serverName: response.serverInfo?.name ?? null,
      serverVersion: response.serverInfo?.version ?? null,
      protocolVersion: response.protocolVersion,
    };
  }

  async listTools() {
    if (!this.initialized) await this.initialize();
    return (await this.request<ToolsListResult>("tools/list", {})).tools ?? [];
  }

  async callTool(name: string, args: Record<string, unknown>) {
    if (!this.initialized) await this.initialize();
    return this.request<LensStudioToolResult>("tools/call", { name, arguments: args });
  }

  private headers() {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      Authorization: this.authorization,
    };
    if (this.sessionId) headers["mcp-session-id"] = this.sessionId;
    return headers;
  }

  private async request<T>(method: string, params: Record<string, unknown>, includeSession = true): Promise<T> {
    const response = await this.fetcher(this.url, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ jsonrpc: "2.0", id: this.nextId++, method, params }),
    });
    if (!response.ok) throw new Error(`Lens Studio MCP returned HTTP ${response.status}.`);
    if (!includeSession || !this.sessionId) this.sessionId = response.headers.get("mcp-session-id") ?? this.sessionId;
    const payload = await parseMcpResponse<T>(response);
    if (payload.error) throw new Error(payload.error.message);
    if (payload.result === undefined) throw new Error(`Lens Studio MCP returned no result for ${method}.`);
    return payload.result;
  }

  private async notify(method: string, params: Record<string, unknown>) {
    const response = await this.fetcher(this.url, {
      method: "POST", headers: this.headers(),
      body: JSON.stringify({ jsonrpc: "2.0", method, params }),
    });
    if (!response.ok && response.status !== 202) throw new Error(`Lens Studio MCP notification failed with HTTP ${response.status}.`);
  }
}

async function parseMcpResponse<T>(response: Response): Promise<JsonRpcResponse<T>> {
  const body = await response.text();
  const dataLine = body.split("\n").find((line) => line.startsWith("data:"));
  const value = dataLine ? dataLine.slice(5).trim() : body;
  return JSON.parse(value) as JsonRpcResponse<T>;
}

export class LensStudioConnectionService {
  private state: LensStudioConnectionState = "DISCONNECTED";
  private capabilities: LensStudioCapability[] = [];
  private serverName: string | null = null;
  private serverVersion: string | null = null;
  private protocolVersion: string | null = null;

  constructor(private readonly transport: McpTransport | null, private readonly lensStudioVersion: string | null = null) {}

  static fromEnvironment() {
    const url = process.env.LENS_STUDIO_MCP_URL ?? process.env.LENS_STUDIO_MCP_ENDPOINT;
    const authorization = process.env.LENS_STUDIO_MCP_AUTHORIZATION;
    const version = process.env.LENS_STUDIO_VERSION ?? null;
    if (!url || !authorization) return new LensStudioConnectionService(null, version);
    return new LensStudioConnectionService(new HttpMcpTransport(url, authorization), version);
  }

  async testConnection(): Promise<LensStudioConnectionInfo> {
    if (!this.transport) return this.info("DISCONNECTED", "Connect a Lens Studio project to Effect Lab. Then sync its local MCP configuration.");
    this.state = "CONNECTING";
    try {
      const server = await this.transport.initialize();
      this.capabilities = await this.transport.listTools();
      this.serverName = server.serverName;
      this.serverVersion = server.serverVersion;
      this.protocolVersion = server.protocolVersion;
      return this.info("CONNECTED", `Lens Studio MCP is connected. ${this.capabilities.length} capabilities are available.`);
    } catch (error) {
      return this.info("ERROR", error instanceof Error ? error.message : "Lens Studio connection failed.");
    }
  }

  async reconnect() { return this.testConnection(); }
  getState() { return this.state; }
  getCapabilities() { return [...this.capabilities]; }
  supports(toolName: string) { return this.capabilities.some((capability) => capability.name === toolName); }

  async callSupportedTool(name: string, args: Record<string, unknown>) {
    if (!this.transport) throw new Error("Lens Studio MCP is not configured.");
    if (this.state !== "CONNECTED") await this.testConnection();
    if (this.state !== "CONNECTED") throw new Error("Lens Studio MCP is not connected.");
    if (!this.supports(name)) throw new Error(`The connected Lens Studio MCP server does not expose ${name}.`);
    return this.transport.callTool(name, args);
  }

  private info(state: LensStudioConnectionState, message: string): LensStudioConnectionInfo {
    this.state = state;
    return {
      state, message, serverName: this.serverName, serverVersion: this.serverVersion,
      protocolVersion: this.protocolVersion, lensStudioVersion: this.lensStudioVersion,
      capabilities: [...this.capabilities],
    };
  }
}

