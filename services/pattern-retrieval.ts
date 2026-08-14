import type { Category } from "../types/domain";
import type { PatternCard } from "../types/learning";

export interface PatternQuery { categories?: Category[]; terms?: string[]; minimumConfidence?: PatternCard["confidence"] }

export class PatternRetrievalService {
  retrieve(cards: PatternCard[], query: PatternQuery, limit = 5) {
    const rank = { LOW: 1, MEDIUM: 2, HIGH: 3 } as const;
    const minimum = query.minimumConfidence ? rank[query.minimumConfidence] : 1;
    return cards.map((card) => {
      const text = `${card.name} ${card.learningObjective} ${card.technicalNotes.join(" ")} ${card.reusablePrinciples.join(" ")}`.toLowerCase();
      const termScore = (query.terms ?? []).filter((term) => text.includes(term.toLowerCase())).length;
      const categoryScore = (query.categories ?? []).filter((category) => card.categories.includes(category)).length;
      return { card, score: termScore * 2 + categoryScore };
    }).filter((item) => rank[item.card.confidence] >= minimum && item.score > 0).sort((a, b) => b.score - a.score || b.card.inspectedAt.localeCompare(a.card.inspectedAt)).slice(0, limit).map((item) => item.card);
  }
}
