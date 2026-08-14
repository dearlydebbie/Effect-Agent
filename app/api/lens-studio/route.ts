import { LensStudioConnectionService } from "../../../services/lens-studio-connection";
import { SnapchatLensBuildOrchestrator } from "../../../services/snapchat-build-orchestrator";
import { DefaultSnapchatLensBuilderAgent } from "../../../agents/snapchat-lens-builder";
import { softFlashTestSpecification } from "../../../data/soft-flash-test";

export const dynamic = "force-dynamic";

function createAgent() {
  const connection = LensStudioConnectionService.fromEnvironment();
  return { connection, agent: new DefaultSnapchatLensBuilderAgent(new SnapchatLensBuildOrchestrator(connection)) };
}

export async function GET(request: Request) {
  const action = new URL(request.url).searchParams.get("action") ?? "status";
  const { connection, agent } = createAgent();
  try {
    if (action === "specification") return Response.json({ specification: softFlashTestSpecification });
    if (action === "plan") return Response.json({ plan: await agent.createBuildPlan(softFlashTestSpecification) });
    const info = await connection.testConnection();
    return Response.json({ connection: action === "capabilities" ? info : { ...info, capabilities: info.capabilities.map(({ name, title, description }) => ({ name, title, description })) } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Lens Studio request failed." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json() as { action?: string; confirmed?: boolean };
  const { connection, agent } = createAgent();
  try {
    if (body.action === "reconnect" || body.action === "test") return Response.json({ connection: await connection.reconnect() });
    if (body.action === "build") {
      if (body.confirmed !== true) return Response.json({ error: "Confirm the Lens Build Specification before building." }, { status: 409 });
      return Response.json({ report: await agent.build(softFlashTestSpecification, true) });
    }
    return Response.json({ error: "Unsupported Lens Studio action." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Lens Studio request failed." }, { status: 500 });
  }
}

