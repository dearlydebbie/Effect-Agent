import type { EarningRecord, Idea, PerformanceRecord } from "../types/domain";

export interface EffectLabRepository {
  listIdeas(): Promise<Idea[]>; saveIdea(idea: Idea): Promise<void>;
  listPerformance(): Promise<PerformanceRecord[]>; savePerformance(record: PerformanceRecord): Promise<void>;
  listEarnings(): Promise<EarningRecord[]>; saveEarning(record: EarningRecord): Promise<void>;
}

export class MemoryRepository implements EffectLabRepository {
  constructor(private ideas: Idea[], private performance: PerformanceRecord[] = [], private earnings: EarningRecord[] = []) {}
  async listIdeas() { return structuredClone(this.ideas); }
  async saveIdea(idea: Idea) {
    const index = this.ideas.findIndex((item) => item.id === idea.id);
    if (index >= 0) this.ideas.splice(index, 1, idea);
    else this.ideas.push(idea);
  }
  async listPerformance() { return structuredClone(this.performance); }
  async savePerformance(record: PerformanceRecord) { const index = this.performance.findIndex((item) => item.id === record.id); if (index >= 0) this.performance.splice(index, 1, record); else this.performance.push(record); }
  async listEarnings() { return structuredClone(this.earnings); }
  async saveEarning(record: EarningRecord) { const index = this.earnings.findIndex((item) => item.id === record.id); if (index >= 0) this.earnings.splice(index, 1, record); else this.earnings.push(record); }
}

export interface KeyValueStorage { getItem(key: string): string | null; setItem(key: string, value: string): void }

export class BrowserRepository implements EffectLabRepository {
  constructor(private storage: KeyValueStorage, private seedIdeas: Idea[] = [], private key = "effect-lab-ideas-v1", private includeDemo = false) {}
  async listIdeas() {
    const value = this.storage.getItem(this.key);
    if (!value) return structuredClone(this.seedIdeas);
    try { const ideas = JSON.parse(value) as Idea[]; return this.includeDemo ? ideas : ideas.filter((idea) => idea.demo !== true); }
    catch { return structuredClone(this.seedIdeas); }
  }
  async saveIdea(idea: Idea) {
    const ideas = await this.listIdeas();
    const index = ideas.findIndex((item) => item.id === idea.id);
    if (index >= 0) ideas.splice(index, 1, idea); else ideas.push(idea);
    this.storage.setItem(this.key, JSON.stringify(ideas));
  }
  async listPerformance() { return this.readRecords<PerformanceRecord>("effect-lab-performance-v1"); }
  async savePerformance(record: PerformanceRecord) { const records = await this.readRecords<PerformanceRecord>("effect-lab-performance-v1"); this.writeRecord("effect-lab-performance-v1", records, record); }
  async listEarnings() { return this.readRecords<EarningRecord>("effect-lab-earnings-v1"); }
  async saveEarning(record: EarningRecord) { const records = await this.listEarnings(); this.writeRecord("effect-lab-earnings-v1", records, record); }
  private async readRecords<T>(key: string): Promise<T[]> { const value = this.storage.getItem(key); if (!value) return []; try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed as T[] : []; } catch { return []; } }
  private writeRecord<T extends { id: string }>(key: string, records: T[], record: T) { const index = records.findIndex((item) => item.id === record.id); if (index >= 0) records.splice(index, 1, record); else records.push(record); this.storage.setItem(key, JSON.stringify(records)); }
}
