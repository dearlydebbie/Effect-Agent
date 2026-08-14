import type { LearningCorpus, LearningRecord, PatternCard, TrainingExercise } from "../types/learning";
import type { KeyValueStorage } from "./persistence";

export interface LearningRepository {
  load(): Promise<LearningCorpus>;
  savePatternCard(card: PatternCard): Promise<void>;
  saveExercise(exercise: TrainingExercise): Promise<void>;
  saveRecord(record: LearningRecord): Promise<void>;
}

const emptyCorpus = (): LearningCorpus => ({ patternCards: [], exercises: [], records: [], knowledge: [] });

export class BrowserLearningRepository implements LearningRepository {
  constructor(private readonly storage: KeyValueStorage, private readonly key = "effect-lab-learning-v1") {}
  async load() {
    const value = this.storage.getItem(this.key);
    if (!value) return emptyCorpus();
    try {
      const parsed = JSON.parse(value) as Partial<LearningCorpus>;
      return { patternCards: Array.isArray(parsed.patternCards) ? parsed.patternCards : [], exercises: Array.isArray(parsed.exercises) ? parsed.exercises : [], records: Array.isArray(parsed.records) ? parsed.records : [], knowledge: Array.isArray(parsed.knowledge) ? parsed.knowledge : [] };
    } catch { return emptyCorpus(); }
  }
  async savePatternCard(card: PatternCard) { const corpus = await this.load(); upsert(corpus.patternCards, card); this.write(corpus); }
  async saveExercise(exercise: TrainingExercise) { const corpus = await this.load(); upsert(corpus.exercises, exercise); this.write(corpus); }
  async saveRecord(record: LearningRecord) { const corpus = await this.load(); upsert(corpus.records, record); this.write(corpus); }
  private write(corpus: LearningCorpus) { this.storage.setItem(this.key, JSON.stringify(corpus)); }
}

function upsert<T extends { id: string }>(items: T[], value: T) { const index = items.findIndex((item) => item.id === value.id); if (index >= 0) items.splice(index, 1, value); else items.push(value); }
