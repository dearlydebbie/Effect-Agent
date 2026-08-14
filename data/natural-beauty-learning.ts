import { beautyFaceBatchKnowledge, beautyFaceBatchPatternCards } from "./beauty-face-batch";
import { beautyPresetInspection } from "./beauty-preset-inspection";
import { createNaturalBeautyLearningPlan } from "../services/natural-beauty-learning";

export const naturalBeautyLearningPlan = createNaturalBeautyLearningPlan(
  [beautyPresetInspection.patternCard, ...beautyFaceBatchPatternCards],
  [...beautyPresetInspection.knowledge, ...beautyFaceBatchKnowledge],
);
