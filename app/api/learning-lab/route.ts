import { LensStudioLearningAdapter } from "../../../adapters/lens-studio-learning-adapter";
import { learningConfig } from "../../../config/learning";
import { createLearningCurriculum } from "../../../services/curriculum-service";
import { LensStudioConnectionService } from "../../../services/lens-studio-connection";
import type { OfficialLearningResource } from "../../../types/learning";
import { createPresetRecord, mergeMetadataInspection } from "../../../services/preset-census";
import { RepresentativePresetSelectionService } from "../../../services/representative-preset-selection";

export const dynamic = "force-dynamic";

export async function GET() {
  const connection = LensStudioConnectionService.fromEnvironment();
  const info = await connection.testConnection();
  return Response.json({
    connection: { state: info.state, message: info.message, lensStudioVersion: info.lensStudioVersion },
    curriculum: createLearningCurriculum(),
    config: learningConfig,
    boundaries: { automaticSources: ["OFFICIAL_SNAP", "LOCAL_OFFICIAL_RESOURCE"], publishingEnabled: false, lensStudioMutationUsed: false },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { action?: string; resource?: Partial<OfficialLearningResource> };
    const adapter = new LensStudioLearningAdapter(LensStudioConnectionService.fromEnvironment());
    if (body.action === "discover") {
      const discovery = await adapter.discover();
      const presets = discovery.resources.filter((item) => item.discoveredThrough === "scene-graphql").map((item) => createPresetRecord(item, discovery.connection.lensStudioVersion));
      const representativeSelection = new RepresentativePresetSelectionService().select(presets, 20);
      return Response.json({ ...discovery, presets, representativeSelection });
    }
    if (body.action === "inspect") {
      if (!body.resource || typeof body.resource.name !== "string" || typeof body.resource.id !== "string") return Response.json({ error: "Select a discovered resource." }, { status: 400 });
      const discovery = await adapter.discover();
      if (discovery.connection.state !== "CONNECTED") return Response.json({ error: discovery.connection.message }, { status: 503 });
      const verified = discovery.resources.find((item) => item.id === body.resource?.id && item.name === body.resource?.name);
      if (!verified) return Response.json({ error: "The resource was not found in the current Lens Studio discovery result." }, { status: 409 });
      const discoveredRecord = createPresetRecord(verified, discovery.connection.lensStudioVersion);
      const patternCard = addCategoryInferences(await adapter.inspect(verified), discoveredRecord);
      return Response.json({ patternCard, presetRecord: mergeMetadataInspection(discoveredRecord, verified.rawMetadata ?? {}, patternCard.id, discovery.connection.lensStudioVersion), lensStudioModified: false });
    }
    if (body.action === "inspect-wave") {
      const requestedIds = Array.isArray((body as { presetIds?: unknown }).presetIds) ? (body as { presetIds: unknown[] }).presetIds.filter((item): item is string => typeof item === "string").slice(0, 20) : [];
      if (!requestedIds.length) return Response.json({ error: "Select the proposed first-wave presets." }, { status: 400 });
      const discovery = await adapter.discover();
      if (discovery.connection.state !== "CONNECTED") return Response.json({ error: discovery.connection.message }, { status: 503 });
      const census = discovery.resources.filter((item) => item.discoveredThrough === "scene-graphql").map((item) => createPresetRecord(item, discovery.connection.lensStudioVersion));
      const selection = new RepresentativePresetSelectionService().select(census, 20);
      const allowed = new Set(selection.selected.map((item) => item.presetId));
      if (requestedIds.some((id) => !allowed.has(id))) return Response.json({ error: "The request does not match the current proposed inspection set." }, { status: 409 });
      const patternCards = []; const presetRecords = []; const errors: Array<{ presetId: string; error: string }> = [];
      for (const id of requestedIds) {
        const resource = discovery.resources.find((item) => item.id === id);
        const record = census.find((item) => item.id === id);
        if (!resource || !record) continue;
        try { const card = addCategoryInferences(await adapter.inspect(resource), record); patternCards.push(card); presetRecords.push(mergeMetadataInspection(record, resource.rawMetadata ?? {}, card.id, discovery.connection.lensStudioVersion)); }
        catch (error) { errors.push({ presetId: id, error: error instanceof Error ? error.message : "Metadata inspection failed." }); }
      }
      return Response.json({ patternCards, presetRecords, errors, representativeSelection: selection, inspectionBoundary: "METADATA_ONLY", lensStudioModified: false });
    }
    return Response.json({ error: "Unsupported Learning Lab action." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Learning Lab request failed." }, { status: 500 });
  }
}

function addCategoryInferences<T extends { fieldEvidence?: Record<string, "METADATA_ONLY" | "SCENE_VERIFIED" | "PROPERTY_VERIFIED" | "BEHAVIOUR_VERIFIED" | "UNKNOWN"> }>(card: T, record: ReturnType<typeof createPresetRecord>) {
  return { ...card, categoryInferences: [record.inferredCategory.value, ...record.secondaryCategories.map((item) => item.value)], fieldEvidence: { ...(card.fieldEvidence ?? {}), categories: "UNKNOWN" as const } };
}
