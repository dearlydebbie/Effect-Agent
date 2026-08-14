import type { Category, Idea } from "../types/domain";
import type { CreativeDirection } from "../types/creative-qa";

const categoryCriteria: Partial<Record<Category, string[]>> = {
  Beauty: ["Preserve facial identity.", "Preserve natural skin texture.", "Keep complexion and makeup balanced.", "Maintain believable light and photographic quality."],
  Makeup: ["Keep makeup placement intentional.", "Keep edges clean and colour balanced."],
  Games: ["Keep the goal and score hierarchy clear.", "Check response, feedback, scoring visibility, and replay flow."],
  Randomisers: ["Build anticipation before the result.", "Keep the result readable and useful in a screenshot."],
  Humour: ["Make the setup easy to understand.", "Use timing, surprise, and visual delivery to support the joke."],
  "World AR": ["Check placement, scale, and depth.", "Match scene light and preserve environmental believability."],
  Fantasy: ["Keep the transformation, atmosphere, and composite visually coherent."],
};

export interface CreativeDirectorAgent { direct(idea: Idea): CreativeDirection }

export class DefaultCreativeDirectorAgent implements CreativeDirectorAgent {
  direct(idea: Idea): CreativeDirection {
    const specific = [...new Set(idea.categories.flatMap((category) => categoryCriteria[category] ?? []))];
    const beauty = idea.categories.some((category) => ["Beauty", "Makeup", "Skin and complexion", "Hair"].includes(category));
    return {
      id: `direction-${idea.id}`, ideaId: idea.id, categories: idea.categories,
      visualObjective: idea.description,
      intendedFeeling: beauty ? "Clean, considered, and believable." : "Clear, intentional, and engaging.",
      focalPoint: beauty ? "The face and the photographic light treatment." : "The main result of the interaction.",
      composition: ["Keep the main result clear in portrait framing.", "Keep secondary elements away from the focal point."],
      colourTreatment: beauty ? ["Use a neutral-to-gently-warm skin balance.", "Avoid a strong pink cast."] : ["Use a controlled palette that supports the concept."],
      lightingTreatment: beauty ? ["Create a soft flash impression.", "Control highlights and preserve skin detail."] : ["Keep the focal point separate from the background."],
      materialDirection: ["Use materials that support the intended finish.", "Avoid surfaces that look accidental or unfinished."],
      motionDirection: ["Use motion only when it explains state or improves feedback."],
      interactionBehaviour: [idea.interactionType, idea.targetUserBehaviour],
      timing: ["Show the first useful result quickly.", "Allow enough time to understand and capture the result."],
      intensity: [beauty ? "Keep the treatment restrained." : "Use the lowest intensity that communicates the idea."],
      restraint: ["Remove elements that do not support the focal point.", "Do not add visual detail only to fill space."],
      visualReferences: beauty ? ["A clean editorial portrait made with a soft direct flash.", "A restrained beauty test with natural texture."] : ["A polished short-form AR effect with a single clear visual idea."],
      elementsToAvoid: beauty ? ["Face reshaping.", "Heavy skin smoothing.", "Excessive whitening.", "Blown facial highlights.", "Unnatural eye enlargement.", "Plastic-looking skin."] : ["Unclear hierarchy.", "Decorative elements that obscure the result."],
      successCriteria: beauty ? ["The result looks photographic rather than obviously filtered.", "Facial identity and skin texture remain intact.", "Highlights stay controlled.", "The colour treatment remains restrained."] : ["The result is clear, coherent, polished, and easy to capture."],
      categoryCriteria: specific.length ? specific : ["Judge the effect against its approved concept and interaction."],
    };
  }
}
