import { runtimePolicy } from "../../../config/runtime";
import { demoIdeas } from "../../../data/demo-ideas";
import { LensStudioConnectionService } from "../../../services/lens-studio-connection";
import { inspectLensProject, verifyLearningSandbox } from "../../../services/lens-project-identity";
import { selectVisionProvider } from "../../../services/vision-provider-selection";
import type { ServiceHealth, WorkspaceStatus } from "../../../types/system-health";

export const dynamic = "force-dynamic";

export async function GET() {
  const policy = runtimePolicy(process.env);
  const now = new Date().toISOString();
  const connection = LensStudioConnectionService.fromEnvironment();
  const info = await connection.testConnection();
  let lensProject = null;
  let lensError: string | null = info.state === "CONNECTED" ? null : info.message;
  if (info.state === "CONNECTED") {
    try { lensProject = await inspectLensProject(connection); }
    catch (error) { lensError = error instanceof Error ? error.message : "Effect Lab could not read the Lens project."; }
  }
  const sandbox = verifyLearningSandbox(lensProject, info.state === "CONNECTED");
  const vision = selectVisionProvider(process.env);
  const services: ServiceHealth[] = [
    health("lens-studio", "Lens Studio", info.state === "CONNECTED" && lensProject ? "CONNECTED" : info.state === "ERROR" ? "ERROR" : "DISCONNECTED", lensProject?.checkedAt ?? null, lensError, "Open the required Lens project. Then sync the MCP connection."),
    health("openai-vision", "OpenAI Vision", vision.state === "REAL" ? "CONNECTED" : "UNAVAILABLE", vision.state === "REAL" ? now : null, vision.state === "REAL" ? null : "A real visual QA provider is not active.", "Set the server key. Enable Visual QA."),
    health("database", "Database", "CONNECTED", now, null, "No action is required. Data is stored in this browser."),
    health("learning-sandbox", "Learning Sandbox", sandbox.status === "VERIFIED" ? "CONNECTED" : sandbox.status === "MISMATCH" ? "ERROR" : "UNAVAILABLE", sandbox.status === "VERIFIED" ? now : null, sandbox.reasons.join(" ") || null, "Open Effect Lab Sandbox. Keep the saved project in the Effect Lab Training Sandbox folder."),
    health("research", "Research", "UNAVAILABLE", null, "No live trend provider is configured.", "Connect a supported research provider."),
    health("ideas", "Idea provider", "UNAVAILABLE", null, "No real idea provider is configured.", "Connect a supported idea provider."),
    health("critic", "Critic provider", "UNAVAILABLE", null, "No real critic provider is configured.", "Connect a supported critic provider."),
    health("tiktok", "TikTok", "UNAVAILABLE", null, "Direct Effect House automation is not available.", "Use a manual Effect House build pack."),
  ];
  const source = process.env.LENS_STUDIO_MCP_CONNECTION_SOURCE;
  const lensConnectionSource = source === "MANUAL_CONFIG" || source === "AUTO_DISCOVERY" ? source : "UNKNOWN";
  const lensLastVerified = validTimestamp(process.env.LENS_STUDIO_MCP_LAST_VERIFIED);
  const payload: WorkspaceStatus = { mode: policy.mode, demoDataEnabled: policy.demoDataEnabled, demoIdeas: policy.demoDataEnabled ? demoIdeas : [], lensProject, sandbox, services, lensConnectionSource, lensLastVerified };
  return Response.json(payload);
}

function health(id: ServiceHealth["id"], label: string, state: ServiceHealth["state"], lastSuccessfulCheck: string | null, error: string | null, nextAction: string): ServiceHealth { return { id, label, state, lastSuccessfulCheck, error, nextAction }; }
function validTimestamp(value: string | undefined) { if (!value) return null; return Number.isNaN(Date.parse(value)) ? null : value; }
