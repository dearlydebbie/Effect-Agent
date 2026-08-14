import { verifyNaturalBeautyHumanReview } from "../../../../services/natural-beauty-review-readiness";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await verifyNaturalBeautyHumanReview(), { headers: { "Cache-Control": "no-store" } });
}
