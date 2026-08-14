import type { OfficialLearningResource } from "../types/learning";
import { presetCategories, type InferredValue, type PresetCategory, type PresetRecord } from "../types/preset-census";

const rules: Array<{ category: PresetCategory; terms: RegExp }> = [
  { category: "Beauty", terms: /\bbeauty|skin|complexion|smooth|retouch|face.?mask\b/i },
  { category: "Makeup", terms: /makeup|lipstick|lip color|lip colour|eyeshadow|eye shadow|lash|blush|liner/i },
  { category: "Camera / Colour", terms: /camera|post.?effect|lut|colour|color|sepia|black.?white|grayscale|exposure|contrast|tone|blown white/i },
  { category: "Face Tracking", terms: /face.?track|head.?binding|face.?landmark/i },
  { category: "Face Effects", terms: /face.?mesh|face.?inset|face.?stretch|face.?liquef|face.?effect/i },
  { category: "Hair", terms: /hair/i },
  { category: "Fashion / Accessories", terms: /fashion|accessor|jewel|jewell|earring|necklace|hat|glasses/i },
  { category: "Try-On", terms: /try.?on|garment|shoe/i },
  { category: "Randomiser", terms: /random|picker|roulette/i },
  { category: "Quiz", terms: /quiz|question|trivia/i },
  { category: "Game", terms: /game|score|tap.?game|runner/i },
  { category: "Interaction", terms: /interact|touch|tap|gesture|trigger/i },
  { category: "Hand Tracking", terms: /hand.?track|hand.?mesh|wrist/i },
  { category: "Body Tracking", terms: /body.?track|body.?mesh|pose.?track|full.?body/i },
  { category: "World AR", terms: /world|surface|plane.?track|location|landmarker/i },
  { category: "Object Placement", terms: /object.?placement|place.?object|surface.?placement/i },
  { category: "VFX", terms: /vfx|visual.?effect|post.?effect|distortion|glitch|trail/i },
  { category: "Particles", terms: /particle/i },
  { category: "Audio", terms: /audio|sound|music|microphone/i },
  { category: "Text", terms: /text|font|caption/i },
  { category: "Segmentation", terms: /segment|background.?remov/i },
  { category: "Machine Learning", terms: /machine.?learning|ml.?component|classification|object.?detect/i },
  { category: "GenAI", terms: /gen.?ai|generative|prompt/i },
  { category: "Transformation", terms: /transform|morph|swap/i },
  { category: "Utility", terms: /utility|helper|listener|camera|light|mesh|screen.?transform/i },
  { category: "Experimental", terms: /experimental|beta|prototype/i },
];

export function createPresetRecord(resource: OfficialLearningResource, lensStudioVersion: string | null, observedAt = new Date().toISOString()): PresetRecord {
  const rawMetadata = resource.rawMetadata ?? { name: resource.name, description: resource.description, section: resource.section };
  const searchable = Object.values(rawMetadata).filter((value): value is string => typeof value === "string").join(" ");
  const matches = rules.filter((rule) => rule.terms.test(searchable)).map((rule) => rule.category);
  const unique = [...new Set(matches)];
  const primary = unique[0] ?? "Unknown";
  const description = typeof rawMetadata.description === "string" && rawMetadata.description.trim() ? rawMetadata.description : null;
  return {
    id: resource.id,
    exactName: resource.name,
    source: resource.source,
    rawMetadata,
    inferredCategory: inferred(primary, primary === "Unknown" ? "UNKNOWN" : "INFERENCE", primary === "Unknown" ? "Metadata did not support a category." : "Matched terms in Lens Studio metadata."),
    secondaryCategories: unique.slice(1).map((category) => inferred(category, "INFERENCE", "Matched additional terms in Lens Studio metadata.")),
    likelyPurpose: description ? inferred(description, "EXPLICIT_METADATA", "Lens Studio returned this description.") : inferred("UNKNOWN", "UNKNOWN", "Lens Studio returned no description."),
    inspectionLevel: "DISCOVERED",
    confidence: description && typeof rawMetadata.entityType === "string" && typeof rawMetadata.section === "string" ? "HIGH" : description ? "MEDIUM" : "LOW",
    evidence: [{ source: resource.evidenceSource, kind: "DISCOVERY", detail: "The preset appears in the current Lens Studio MCP preset index.", lensStudioVersion, observedAt }],
    discoveredAt: observedAt,
    patternCardIds: [],
    inspectionHistory: [{ level: "DISCOVERED", occurredAt: observedAt, capability: resource.discoveredThrough, result: "PASS", note: "Stored only metadata returned by Lens Studio." }],
  };
}

export function mergeMetadataInspection(record: PresetRecord, rawMetadata: Record<string, unknown>, patternCardId: string, lensStudioVersion: string | null, observedAt = new Date().toISOString()): PresetRecord {
  const resource: OfficialLearningResource = { id: record.id, name: record.exactName, description: typeof rawMetadata.description === "string" ? rawMetadata.description : null, source: record.source, resourceType: "TEMPLATE", section: typeof rawMetadata.section === "string" ? rawMetadata.section : null, discoveredThrough: "scene-graphql", evidenceSource: "Lens Studio MCP scene-graphql preset inspection", automaticLearningEligible: true, inspectionStatus: "INSPECTED", rawMetadata };
  const classified = createPresetRecord(resource, lensStudioVersion, record.discoveredAt);
  return { ...classified, inspectionLevel: "METADATA_INSPECTED", discoveredAt: record.discoveredAt, patternCardIds: [...new Set([...record.patternCardIds, patternCardId])], evidence: [...record.evidence, { source: "Lens Studio MCP scene-graphql preset inspection", kind: "METADATA", detail: "The exact preset metadata was returned by Lens Studio.", lensStudioVersion, observedAt }], inspectionHistory: [...record.inspectionHistory, { level: "METADATA_INSPECTED", occurredAt: observedAt, capability: "scene-graphql", result: "PASS", note: "No scene instance was created." }] };
}

export function censusDistribution(records: PresetRecord[]) {
  return presetCategories.map((category) => ({ category, count: records.filter((record) => [record.inferredCategory.value, ...record.secondaryCategories.map((item) => item.value)].includes(category)).length })).filter((item) => item.count > 0);
}

function inferred<T>(value: T, authority: InferredValue<T>["authority"], rationale: string): InferredValue<T> { return { value, authority, rationale }; }
