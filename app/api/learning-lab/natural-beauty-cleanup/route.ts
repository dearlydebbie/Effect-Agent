import { executeSoftFlashCleanup, inspectSoftFlashCleanup, verifyNaturalBeautyFinalization } from "../../../../services/soft-flash-cleanup";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await inspectSoftFlashCleanup(), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { action?: string; planFingerprint?: string };
    if (body.action !== "CONFIRM_CLEANUP" || typeof body.planFingerprint !== "string") return Response.json({ error: "A confirmed cleanup-plan fingerprint is required." }, { status: 400 });
    return Response.json(await executeSoftFlashCleanup(body.planFingerprint), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Soft Flash cleanup failed." }, { status: 409 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json() as { action?: string };
    if (body.action !== "VERIFY_FINALIZATION") return Response.json({ error: "The finalisation action is required." }, { status: 400 });
    return Response.json(await verifyNaturalBeautyFinalization(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Natural Beauty finalisation failed." }, { status: 409 });
  }
}
