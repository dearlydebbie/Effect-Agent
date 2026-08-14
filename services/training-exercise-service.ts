import type { PatternCard, TrainingExercise } from "../types/learning";

export class TrainingExerciseService {
  create(card: PatternCard, sequence: number): TrainingExercise {
    if (!["OFFICIAL_SNAP", "LOCAL_OFFICIAL_RESOURCE"].includes(card.source)) throw new Error("Training exercises require an eligible official source.");
    const objective = card.learningObjective === "UNKNOWN" ? `Study the verified structure of ${card.officialResourceName}.` : `Study this official objective: ${card.learningObjective}`;
    return {
      id: `exercise-${String(sequence).padStart(3, "0")}-${card.id}`,
      objective,
      skill: `Inspect and apply one verified principle from ${card.officialResourceName}.`,
      sourcePatternCardIds: [card.id],
      creativeBrief: `Create an original Lens exercise. Use ${card.officialResourceName} only as technical evidence. Do not copy its concept, look, text, or assets. Define a new user goal before the build.`,
      buildSpecification: {
        id: `learning-spec-${sequence}-${card.id}`,
        title: `Original ${card.officialResourceName} exercise`,
        concept: "A new concept is required before build confirmation.",
        categories: [],
        targetPlatform: "Snapchat",
        interactionType: "UNKNOWN",
        userExperience: [],
        sceneRequirements: [],
        assetRequirements: [],
        textRequirements: [],
        behaviourRequirements: [],
        scriptRequirements: [],
        audioRequirements: [],
        visualDirection: [],
        technicalConstraints: ["Use only properties and operations verified through Lens Studio MCP.", "Do not copy the source resource concept or visual design."],
        qaRequirements: ["Technical QA must pass.", "Specification QA must pass.", "Visual and Experience QA require real evidence.", "Human review is required."],
      },
      qaRequirements: [
        { gate: "TECHNICAL", requirement: "Compile with the connected platform tooling." },
        { gate: "SPECIFICATION", requirement: "Match the confirmed original build specification." },
        { gate: "VISUAL", requirement: "Review a real preview." },
        { gate: "EXPERIENCE", requirement: "Test the intended interaction." },
        { gate: "HUMAN", requirement: "A person must review the result." },
      ],
      difficulty: "FOUNDATION",
      originalityRequirement: "The exercise must differ from the official resource, other exercises, and the local effect library.",
      originalityStatus: "UNKNOWN",
      workflowStatus: "DRAFT",
      humanConfirmed: false,
    };
  }
}
