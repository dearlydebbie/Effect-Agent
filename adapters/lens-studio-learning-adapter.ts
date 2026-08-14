import type { LensStudioConnectionService, LensStudioToolResult } from "../services/lens-studio-connection";
import type { OfficialLearningResource, OfficialResourceType, PatternCard } from "../types/learning";

export interface LearningDiscoveryCoverage {
  kind: OfficialResourceType;
  capability: string | null;
  status: "AVAILABLE" | "INSPECTED" | "UNAVAILABLE" | "REQUIRES_QUERY";
  note: string;
}

export interface LearningDiscoveryResult {
  connection: { state: string; message: string; lensStudioVersion: string | null };
  resources: OfficialLearningResource[];
  coverage: LearningDiscoveryCoverage[];
  errors: string[];
  lensStudioModified: false;
}

interface PresetRecord { name?: unknown; description?: unknown; entityType?: unknown; section?: unknown }

const coverageDefinitions: Array<{ kind: OfficialResourceType; capability: string | null; queryRequired?: boolean }> = [
  { kind: "TEMPLATE", capability: "scene-graphql" },
  { kind: "SAMPLE_SCENE", capability: "scene-graphql" },
  { kind: "PACKAGE", capability: "ListInstalledPackagesTool" },
  { kind: "COMPONENT", capability: "scene-graphql" },
  { kind: "BLOCK", capability: "SearchLensStudioAssetLibrary", queryRequired: true },
  { kind: "MATERIAL", capability: "SearchLensStudioAssetLibrary", queryRequired: true },
  { kind: "SHADER", capability: "SearchLensStudioAssetLibrary", queryRequired: true },
  { kind: "SCRIPT", capability: "SearchLensStudioAssetLibrary", queryRequired: true },
  { kind: "VISUAL_SCRIPT", capability: "SearchLensStudioAssetLibrary", queryRequired: true },
  { kind: "GENAI", capability: "QueryLensStudioKnowledgeBase", queryRequired: true },
  { kind: "TRACKING", capability: "QueryLensStudioKnowledgeBase", queryRequired: true },
  { kind: "BUILT_IN_ASSET", capability: "asset-graphql" },
];

export class LensStudioLearningAdapter {
  constructor(private readonly connection: LensStudioConnectionService) {}

  async discover(): Promise<LearningDiscoveryResult> {
    const info = await this.connection.testConnection();
    if (info.state !== "CONNECTED") return { connection: { state: info.state, message: info.message, lensStudioVersion: info.lensStudioVersion }, resources: [], coverage: coverageDefinitions.map((item) => ({ kind: item.kind, capability: item.capability, status: "UNAVAILABLE", note: "Lens Studio MCP is not connected." })), errors: [info.message], lensStudioModified: false };
    const resources: OfficialLearningResource[] = [];
    const errors: string[] = [];
    if (this.connection.supports("scene-graphql")) {
      try {
        const payload = toolJson(await this.connection.callSupportedTool("scene-graphql", { query: "{ presets { name description entityType section } }" }));
        const presets = readPresets(payload);
        presets.forEach((preset, index) => {
          if (typeof preset.name !== "string") return;
          const type = classifyPreset(preset);
          resources.push({ id: `scene-preset-${slug(preset.name)}-${index}`, name: preset.name, description: typeof preset.description === "string" ? preset.description : null, source: "LOCAL_OFFICIAL_RESOURCE", resourceType: type, section: typeof preset.section === "string" ? preset.section : null, discoveredThrough: "scene-graphql", evidenceSource: "Lens Studio MCP scene-graphql preset index", automaticLearningEligible: true, inspectionStatus: "DISCOVERED", rawMetadata: sanitizePreset(preset) });
        });
      } catch (error) { errors.push(readError(error, "The scene preset index could not be read.")); }
    }
    if (this.connection.supports("ListInstalledPackagesTool")) {
      const capability = info.capabilities.find((item) => item.name === "ListInstalledPackagesTool");
      const required = Array.isArray(capability?.inputSchema?.required) ? capability.inputSchema.required : [];
      if (required.length === 0) {
        try {
          const payload = toolJson(await this.connection.callSupportedTool("ListInstalledPackagesTool", {}));
          readPackages(payload).forEach((item, index) => resources.push({ id: `package-${slug(item.name)}-${index}`, name: item.name, description: item.description, source: "UNKNOWN", resourceType: "PACKAGE", section: null, discoveredThrough: "ListInstalledPackagesTool", evidenceSource: "Lens Studio MCP installed package list; publisher authority was not verified", automaticLearningEligible: false, inspectionStatus: "UNKNOWN" }));
        } catch (error) { errors.push(readError(error, "Installed packages could not be listed.")); }
      }
    }
    const unique = [...new Map(resources.map((item) => [`${item.discoveredThrough}:${item.name}`, item])).values()];
    return { connection: { state: info.state, message: info.message, lensStudioVersion: info.lensStudioVersion }, resources: unique, coverage: coverageDefinitions.map((item) => ({ kind: item.kind, capability: item.capability, status: !item.capability || !this.connection.supports(item.capability) ? "UNAVAILABLE" : item.queryRequired ? "REQUIRES_QUERY" : item.capability === "scene-graphql" ? "INSPECTED" : "AVAILABLE", note: item.queryRequired ? "A focused query is required. Effect Lab does not run an unfocused search." : "Availability comes from the connected MCP capability list." })), errors, lensStudioModified: false };
  }

  async inspect(resource: OfficialLearningResource): Promise<PatternCard> {
    if (!resource.automaticLearningEligible || !["OFFICIAL_SNAP", "LOCAL_OFFICIAL_RESOURCE"].includes(resource.source)) throw new Error("This resource is not eligible for automatic learning.");
    const info = await this.connection.testConnection();
    if (info.state !== "CONNECTED") throw new Error(info.message);
    if (resource.discoveredThrough !== "scene-graphql" || !this.connection.supports("scene-graphql")) throw new Error("The connected MCP server does not expose a supported inspection path for this resource.");
    const payload = toolJson(await this.connection.callSupportedTool("scene-graphql", { query: `{ preset(presetName:${JSON.stringify(resource.name)}) { name description entityType section } }` }));
    const preset = readPreset(payload);
    if (!preset || typeof preset.name !== "string") throw new Error("Lens Studio did not return the selected preset.");
    const evidence = `Lens Studio MCP scene-graphql preset inspection: ${preset.name}`;
    const element = { name: preset.name, type: typeof preset.entityType === "string" ? preset.entityType : "UNKNOWN", id: null, path: null, evidenceSource: evidence };
    const isSceneObject = typeof preset.entityType === "string" && /scene.?object/i.test(preset.entityType);
    return {
      id: `pattern-${resource.id}`,
      name: `${preset.name} pattern`,
      source: resource.source,
      officialResourceName: preset.name,
      officialResourceType: classifyPreset(preset),
      categories: ["UNKNOWN"],
      supportedPlatforms: ["Snapchat"],
      learningObjective: typeof preset.description === "string" && preset.description.trim() ? preset.description : "UNKNOWN",
      sceneStructure: [element],
      importantObjects: isSceneObject ? [element] : ["UNKNOWN"],
      importantComponents: ["UNKNOWN"],
      importantAssets: ["UNKNOWN"],
      importantMaterials: ["UNKNOWN"],
      importantScripts: ["UNKNOWN"],
      importantProperties: ["UNKNOWN"],
      interactions: ["UNKNOWN"],
      triggers: ["UNKNOWN"],
      technicalNotes: typeof preset.section === "string" ? [`Lens Studio lists this resource in ${preset.section}.`] : ["UNKNOWN"],
      knownConstraints: ["Only metadata exposed by the supported preset query was inspected."],
      qualityNotes: ["UNKNOWN"],
      reusablePrinciples: ["UNKNOWN"],
      unsafeAssumptions: ["Do not infer components, properties, scripts, interactions, or visual quality from preset metadata."],
      confidence: "LOW",
      inspectedAt: new Date().toISOString(),
      sourcePresetId: resource.id,
      inspectionLevel: "METADATA_INSPECTED",
      fieldEvidence: {
        officialResourceName: "METADATA_ONLY", officialResourceType: "METADATA_ONLY", learningObjective: typeof preset.description === "string" ? "METADATA_ONLY" : "UNKNOWN",
        sceneStructure: "METADATA_ONLY", importantObjects: isSceneObject ? "METADATA_ONLY" : "UNKNOWN", importantComponents: "UNKNOWN", importantAssets: "UNKNOWN",
        importantMaterials: "UNKNOWN", importantScripts: "UNKNOWN", importantProperties: "UNKNOWN", interactions: "UNKNOWN", triggers: "UNKNOWN",
      },
    };
  }
}

function classifyPreset(preset: PresetRecord): OfficialResourceType {
  const entityType = String(preset.entityType ?? "").toLowerCase();
  const section = String(preset.section ?? "").toLowerCase();
  const value = `${entityType} ${section}`;
  if (value.includes("component")) return "COMPONENT";
  if (value.includes("material")) return "MATERIAL";
  if (section.includes("sample scene") || entityType === "scene") return "SAMPLE_SCENE";
  return "TEMPLATE";
}
function toolJson(result: LensStudioToolResult): Record<string, unknown> { const text = result.content?.find((item) => item.type === "text" && item.text)?.text; if (!text) return {}; try { return JSON.parse(text) as Record<string, unknown>; } catch { return {}; } }
function readPresets(payload: Record<string, unknown>): PresetRecord[] { const data = payload.data as { presets?: unknown } | undefined; return Array.isArray(data?.presets) ? data.presets.filter((item): item is PresetRecord => Boolean(item) && typeof item === "object") : []; }
function readPreset(payload: Record<string, unknown>): PresetRecord | null { const value = (payload.data as { preset?: unknown } | undefined)?.preset; return value && typeof value === "object" ? value as PresetRecord : null; }
function readPackages(payload: Record<string, unknown>): Array<{ name: string; description: string | null }> { const values = (payload.packages ?? (payload.data as { packages?: unknown } | undefined)?.packages); if (!Array.isArray(values)) return []; return values.flatMap((item) => { if (!item || typeof item !== "object") return []; const value = item as Record<string, unknown>; return typeof value.name === "string" ? [{ name: value.name, description: typeof value.description === "string" ? value.description : null }] : []; }); }
function slug(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64) || "resource"; }
function readError(error: unknown, fallback: string) { return error instanceof Error ? error.message : fallback; }
function sanitizePreset(preset: PresetRecord): Record<string, unknown> { return Object.fromEntries(Object.entries(preset).filter(([, value]) => typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null)); }
