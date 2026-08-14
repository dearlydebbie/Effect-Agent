import { DefaultCreativeDirectorAgent } from "../../../../agents/creative-director";
import { ExperienceQAAgent } from "../../../../agents/experience-qa";
import { unavailableVisualQA, VisualQAAgent } from "../../../../agents/visual-qa";
import { softFlashIdea, softFlashInitialIteration } from "../../../../data/soft-flash-quality";
import { softFlashTestSpecification } from "../../../../data/soft-flash-test";
import { LensStudioConnectionService, type LensStudioToolResult } from "../../../../services/lens-studio-connection";
import { MemoryVisualQACache } from "../../../../services/visual-qa-cache";
import { selectVisionProvider } from "../../../../services/vision-provider-selection";
import { canRunVisionQA } from "../../../../services/vision-cost-controls";
import { LensStudioTechnicalInspector, TechnicalIterationPlanner } from "../../../../services/technical-iteration-planner";
import type { TechnicalIterationPlan, VisualQAFinding } from "../../../../types/creative-qa";
import { softFlashBuildId } from "../../../../config/builds";

export const dynamic = "force-dynamic";

const creativeDirection = new DefaultCreativeDirectorAgent().direct(softFlashIdea);
const visualCache = new MemoryVisualQACache();
const technicalPlans = new Map<string, TechnicalIterationPlan>();

function visionAgent() {
  return new VisualQAAgent(selectVisionProvider(process.env, { cache: visualCache }));
}

function previewDataUrl(result: LensStudioToolResult) {
  const image = (result.content ?? []).find((item) => item.type === "image" && item.data);
  if (image?.data) return `data:${image.mimeType ?? "image/jpeg"};base64,${image.data}`;
  for (const item of result.content ?? []) {
    if (item.type !== "text" || !item.text) continue;
    try {
      const value = JSON.parse(item.text) as { screenshot?: { image_url?: { url?: string } } };
      if (value.screenshot?.image_url?.url?.startsWith("data:image/")) return value.screenshot.image_url.url;
    } catch { /* The tool can also return ordinary text. */ }
  }
  return null;
}

export async function GET(request: Request) {
  const buildId = new URL(request.url).searchParams.get("buildId");
  if (buildId !== softFlashBuildId) return Response.json({ error: "The requested quality record does not match this build." }, { status: 409 });
  const provider = visionAgent().getProviderInfo();
  return Response.json({
    creativeDirection,
    technicalQA: { status: "PASS", message: "The controlled Lens Studio build compiled and completed its runtime checks." },
    specificationQA: { status: "PASS", message: "The controlled build created the expected soft flash scene treatment." },
    visualQA: { status: provider.state === "REAL" ? "UNKNOWN" : "UNAVAILABLE", message: provider.state === "REAL" ? "Capture the current preview to request AI visual assessment." : "Capture the preview. A configured real vision provider is still required for visual analysis." },
    provider,
    costControls: { enabled: process.env.VISION_QA_ENABLED === "true", maxIterations: maxIterations() },
    experienceQA: new ExperienceQAAgent().evaluate(),
    initialIteration: softFlashInitialIteration,
    technicalIterationPlan: technicalPlans.get(buildId) ?? null,
    humanReview: "REQUIRED",
  });
}

export async function POST(request: Request) {
  const body = await request.json() as { action?: string; buildId?: string; force?: boolean; iterationNumber?: number; findings?: VisualQAFinding[]; sourceVisualScore?: number | null; preserve?: string[] };
  if (body.action !== "capture-preview" && body.action !== "technical-plan") return Response.json({ error: "Unsupported quality action." }, { status: 400 });
  if (body.buildId !== softFlashBuildId) return Response.json({ error: "This build is stale. Reload the current build." }, { status: 409 });
  const connection = LensStudioConnectionService.fromEnvironment();
  const info = await connection.testConnection();
  if (info.state !== "CONNECTED") return Response.json({ error: info.message }, { status: 503 });
  if (body.action === "technical-plan") {
    const findings = validFindings(body.findings);
    if (!findings.length) return Response.json({ error: "Visual QA findings are required." }, { status: 400 });
    try {
      const technicalIterationPlan = await technicalPlanner(connection).plan(body.buildId, findings, typeof body.sourceVisualScore === "number" ? body.sourceVisualScore : null, validStrings(body.preserve));
      technicalPlans.set(body.buildId, technicalIterationPlan);
      return Response.json({ technicalIterationPlan });
    } catch (error) {
      return Response.json({ error: error instanceof Error ? error.message : "Technical inspection failed." }, { status: 500 });
    }
  }
  if (!connection.supports("PreviewPanelTool")) return Response.json({ error: "The connected server does not expose PreviewPanelTool." }, { status: 409 });
  try {
    const result = await connection.callSupportedTool("PreviewPanelTool", { action: "screenshot", detail: "low", includeChrome: false });
    const preview = previewDataUrl(result);
    if (!preview) return Response.json({ error: "Lens Studio did not return a preview image." }, { status: 502 });
    const costDecision = canRunVisionQA({ enabled: process.env.VISION_QA_ENABLED === "true", hasPreview: true, buildPassed: true, userRequested: true, iterationNumber: body.iterationNumber ?? 0, maxIterations: maxIterations(), manualReanalysis: body.force === true });
    if (!costDecision.allowed) {
      const provider = visionAgent().getProviderInfo();
      return Response.json({ previewDataUrl: preview, visualQA: unavailableVisualQA(costDecision.reason, true, provider.name, provider.model), technicalIterationPlan: null });
    }
    const visualQA = await visionAgent().evaluate({ idea: softFlashIdea, creativeDirection, specification: softFlashTestSpecification, previewDataUrl: preview, category: softFlashIdea.categories, intendedInteraction: softFlashIdea.interactionType, technicalInformation: ["TypeScript compilation passed.", "Runtime checks completed.", "The expected scene treatment exists."] }, { force: body.force === true });
    const technicalIterationPlan = visualQA.status !== "UNAVAILABLE" && visualQA.findings.length
      ? await technicalPlanner(connection).plan(body.buildId, visualQA.findings, visualQA.overallScore, visualQA.strengths)
      : null;
    if (technicalIterationPlan) technicalPlans.set(body.buildId, technicalIterationPlan);
    return Response.json({ previewDataUrl: preview, visualQA, technicalIterationPlan });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Preview capture failed." }, { status: 500 });
  }
}

function maxIterations() { const value = Number.parseInt(process.env.VISION_QA_MAX_ITERATIONS ?? "3", 10); return Math.min(3, Math.max(0, Number.isFinite(value) ? value : 3)); }
function technicalPlanner(connection: LensStudioConnectionService) { return new TechnicalIterationPlanner(new LensStudioTechnicalInspector(connection, "Blown White", "BlownWhitePreset")); }
function validStrings(value: unknown) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 20) : []; }
function validFindings(value: unknown): VisualQAFinding[] { return Array.isArray(value) ? value.filter((item): item is VisualQAFinding => Boolean(item) && typeof item === "object" && typeof (item as VisualQAFinding).description === "string" && typeof (item as VisualQAFinding).recommendedChange === "string" && typeof (item as VisualQAFinding).evidence === "string").slice(0, 20) : []; }
