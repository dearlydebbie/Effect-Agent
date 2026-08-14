import type { CapabilityKnowledgeEntry, PatternCard } from "../types/learning";
import type { CurriculumReadiness, PatternEvidenceLevel } from "../types/preset-census";

const mappings: Record<CurriculumReadiness["category"], string[]> = {
  Beauty: ["Beauty", "Makeup", "Camera / Colour", "Skin and complexion", "Aesthetic camera effects", "Lighting"], Randomisers: ["Randomiser", "Randomisers"], Games: ["Game", "Quiz", "Games", "Quizzes"], "Face effects": ["Face Effects", "Face Tracking", "Face effects", "Face accessories"], "World AR": ["World AR", "Object Placement"], VFX: ["VFX", "Particles", "Aesthetic camera effects", "Photo effects", "Transformation"], Fashion: ["Fashion / Accessories", "Try-On", "Fashion", "Hair", "Jewellery"], Experimental: ["Experimental", "GenAI", "Machine Learning", "AI effects"],
};

export function assessCurriculumReadiness(cards: PatternCard[], knowledge: CapabilityKnowledgeEntry[]): CurriculumReadiness[] {
  return Object.entries(mappings).map(([category, sourceCategories]) => {
    const relevant = cards.filter((card) => [...card.categories.map(String), ...(card.categoryInferences ?? [])].some((item) => sourceCategories.includes(item)));
    const sceneVerified = relevant.filter((card) => Object.values(card.fieldEvidence ?? {}).some((level) => verifiedAtScene(level))).length;
    const capabilities = knowledge.filter((entry) => entry.status === "VERIFIED" && sourceCategories.some((source) => `${entry.capability} ${entry.statement}`.toLowerCase().includes(source.toLowerCase()))).length;
    const status = sceneVerified >= 3 && capabilities >= 2 ? "READY" : sceneVerified >= 1 ? "PARTIAL" : "NOT_READY";
    const reasons = status === "READY" ? ["Multiple scene-verified patterns and verified capabilities are available."] : status === "PARTIAL" ? ["Some scene evidence exists, but more scene or property verification is required."] : [relevant.length ? "Metadata Pattern Cards exist, but no scene-verified implementation evidence is available." : "There is not enough verified implementation evidence for exercise generation."];
    return { category: category as CurriculumReadiness["category"], status, patternCardCount: relevant.length, sceneVerifiedCount: sceneVerified, verifiedCapabilityCount: capabilities, reasons };
  });
}
function verifiedAtScene(level: PatternEvidenceLevel) { return ["SCENE_VERIFIED", "PROPERTY_VERIFIED", "BEHAVIOUR_VERIFIED"].includes(level); }
