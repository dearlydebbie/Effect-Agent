import type { Idea } from "../types/domain";

const tokens = (value: string) => new Set(value.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter((word) => word.length > 2));
export function conceptSimilarity(a: Pick<Idea, "title" | "hook" | "categories">, b: Pick<Idea, "title" | "hook" | "categories">) {
  const left = tokens(`${a.title} ${a.hook} ${a.categories.join(" ")}`);
  const right = tokens(`${b.title} ${b.hook} ${b.categories.join(" ")}`);
  const intersection = [...left].filter((item) => right.has(item)).length;
  const union = new Set([...left, ...right]).size;
  return union ? intersection / union : 0;
}
export function findPotentialDuplicates(candidate: Idea, ideas: Idea[], threshold = 0.48) {
  return ideas.filter((idea) => idea.id !== candidate.id).map((idea) => ({ idea, similarity: conceptSimilarity(candidate, idea) })).filter((match) => match.similarity >= threshold).sort((a, b) => b.similarity - a.similarity);
}

