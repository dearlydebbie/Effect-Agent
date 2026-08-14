import type { KeyValueStorage } from "./persistence";
import type { CensusSnapshot, PresetRecord, RepresentativeSelection } from "../types/preset-census";

export interface PresetCensusRepository { load(): Promise<CensusSnapshot>; saveCensus(records: PresetRecord[]): Promise<void>; saveSelection(selection: RepresentativeSelection): Promise<void>; savePreset(record: PresetRecord): Promise<void> }

export class BrowserPresetCensusRepository implements PresetCensusRepository {
  constructor(private readonly storage: KeyValueStorage, private readonly key = "effect-lab-preset-census-v1") {}
  async load(): Promise<CensusSnapshot> { const value = this.storage.getItem(this.key); if (!value) return empty(); try { const parsed = JSON.parse(value) as CensusSnapshot; return { presets: Array.isArray(parsed.presets) ? parsed.presets : [], representativeSelection: parsed.representativeSelection ?? null, updatedAt: parsed.updatedAt ?? new Date(0).toISOString() }; } catch { return empty(); } }
  async saveCensus(records: PresetRecord[]) { const current = await this.load(); const previous = new Map(current.presets.map((item) => [item.id, item])); const merged = records.map((record) => previous.has(record.id) ? preserveInspection(record, previous.get(record.id)!) : record); this.write({ ...current, presets: merged, updatedAt: new Date().toISOString() }); }
  async saveSelection(selection: RepresentativeSelection) { const current = await this.load(); this.write({ ...current, representativeSelection: selection, updatedAt: new Date().toISOString() }); }
  async savePreset(record: PresetRecord) { const current = await this.load(); const index = current.presets.findIndex((item) => item.id === record.id); if (index >= 0) current.presets.splice(index, 1, record); else current.presets.push(record); this.write({ ...current, updatedAt: new Date().toISOString() }); }
  private write(value: CensusSnapshot) { this.storage.setItem(this.key, JSON.stringify(value)); }
}
function empty(): CensusSnapshot { return { presets: [], representativeSelection: null, updatedAt: new Date(0).toISOString() }; }
function preserveInspection(discovered: PresetRecord, previous: PresetRecord) { return previous.inspectionLevel === "DISCOVERED" ? discovered : { ...discovered, inspectionLevel: previous.inspectionLevel, patternCardIds: previous.patternCardIds, inspectionHistory: previous.inspectionHistory, evidence: previous.evidence }; }
