import type { PresetCategory, PresetRecord, RepresentativePreset, RepresentativeSelection } from "../types/preset-census";

const priority: PresetCategory[] = ["Beauty", "Makeup", "Camera / Colour", "Face Tracking", "Face Effects", "Hair", "Fashion / Accessories", "Try-On", "Interaction", "Hand Tracking", "Body Tracking", "World AR", "Object Placement", "VFX", "Particles", "Audio", "Text", "Segmentation", "Machine Learning", "GenAI", "Transformation", "Utility", "Experimental", "Randomiser", "Quiz", "Game", "Unknown"];
const reusable = /component|tracking|mesh|material|camera|light|audio|particle|segment|text|post.?effect|screen|object|transform/i;

export class RepresentativePresetSelectionService {
  select(records: PresetRecord[], target = 20): RepresentativeSelection {
    const eligible = records.filter((record) => ["OFFICIAL_SNAP", "LOCAL_OFFICIAL_RESOURCE"].includes(record.source));
    const selected: RepresentativePreset[] = [];
    const excludedNearDuplicates: RepresentativeSelection["excludedNearDuplicates"] = [];
    const signatures = new Map<string, string>();
    const choose = (record: PresetRecord, reasons: string[], score: number) => {
      if (selected.some((item) => item.presetId === record.id)) return false;
      const signature = technicalSignature(record);
      const duplicateOf = signatures.get(signature);
      if (duplicateOf) { excludedNearDuplicates.push({ presetId: record.id, duplicateOf, reason: "The available metadata describes the same broad technical pattern." }); return false; }
      signatures.set(signature, record.id);
      selected.push({ presetId: record.id, exactName: record.exactName, categories: categories(record), reasons, selectionScore: score, possibleDuplicateOf: null });
      return true;
    };
    const beauty = eligible.filter((record) => categories(record).some((category) => ["Beauty", "Makeup", "Camera / Colour"].includes(category))).sort(sortRecords);
    for (const record of beauty) { if (selected.filter((item) => item.categories.some((category) => ["Beauty", "Makeup", "Camera / Colour"].includes(category))).length >= 5) break; choose(record, ["Supports the required beauty, makeup, or camera learning coverage.", "Adds a distinct metadata-described technical pattern."], score(record) + 6); }
    for (const category of priority) {
      if (selected.length >= target) break;
      const candidates = eligible.filter((record) => categories(record).includes(category)).sort(sortRecords);
      const record = candidates.find((candidate) => !selected.some((item) => item.presetId === candidate.id));
      if (record) choose(record, [`Adds ${category} category coverage.`, reusable.test(purpose(record)) ? "Metadata suggests a reusable technical concept." : "Adds a different preset family."], score(record) + 4);
    }
    for (const record of [...eligible].sort(sortRecords)) {
      if (selected.length >= target) break;
      choose(record, ["Adds a distinct technical signature to the representative set."], score(record));
    }
    const coverage = new Map<PresetCategory, number>();
    selected.flatMap((item) => item.categories).forEach((category) => coverage.set(category, (coverage.get(category) ?? 0) + 1));
    return { target, selected, excludedNearDuplicates, categoryCoverage: [...coverage.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count), beautyRelatedCount: selected.filter((item) => item.categories.some((category) => ["Beauty", "Makeup", "Camera / Colour"].includes(category))).length, createdAt: new Date().toISOString() };
  }
}

export function findDuplicatePresetPatterns(records: PresetRecord[]) {
  const groups = new Map<string, PresetRecord[]>();
  records.forEach((record) => { const signature = technicalSignature(record); groups.set(signature, [...(groups.get(signature) ?? []), record]); });
  return [...groups.values()].filter((items) => items.length > 1).map((items) => ({ signature: technicalSignature(items[0]), presetIds: items.map((item) => item.id), exactNames: items.map((item) => item.exactName) }));
}

function categories(record: PresetRecord) { return [record.inferredCategory.value, ...record.secondaryCategories.map((item) => item.value)]; }
function purpose(record: PresetRecord) { return record.likelyPurpose.value; }
function technicalSignature(record: PresetRecord) { const normalized = purpose(record).toLowerCase().replace(record.exactName.toLowerCase(), "").replace(/\b(red|blue|green|yellow|orange|purple|pink|black|white|warm|cool|beauty|sepia|bw)\b/g, "colour").replace(/[^a-z0-9]+/g, " ").trim(); return `${record.inferredCategory.value}:${normalized || "unknown"}`; }
function score(record: PresetRecord) { return (record.confidence === "HIGH" ? 5 : record.confidence === "MEDIUM" ? 3 : 1) + (reusable.test(purpose(record)) ? 3 : 0) + Math.min(3, categories(record).length); }
function sortRecords(left: PresetRecord, right: PresetRecord) { return score(right) - score(left) || left.exactName.localeCompare(right.exactName); }
