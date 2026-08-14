import test from "node:test";
import assert from "node:assert/strict";
import { DefaultCreativeDirectorAgent } from "../agents/creative-director.ts";
import { softFlashIdea } from "../data/soft-flash-quality.ts";
import { demoIdeas } from "../data/demo-ideas.ts";

test("Creative Director returns the complete direction schema", () => {
  const direction = new DefaultCreativeDirectorAgent().direct(softFlashIdea);
  for (const field of ["visualObjective","intendedFeeling","focalPoint","composition","colourTreatment","lightingTreatment","materialDirection","motionDirection","interactionBehaviour","timing","intensity","restraint","visualReferences","elementsToAvoid","successCriteria","categoryCriteria"] as const) assert.ok(direction[field]);
});

test("Creative Director uses category-specific quality criteria", () => {
  const director = new DefaultCreativeDirectorAgent();
  const beauty = director.direct(softFlashIdea);
  const game = director.direct(demoIdeas.find((idea) => idea.categories.includes("Games"))!);
  assert.match(beauty.categoryCriteria.join(" "), /skin texture/i);
  assert.match(game.categoryCriteria.join(" "), /score hierarchy/i);
  assert.doesNotMatch(game.categoryCriteria.join(" "), /skin texture/i);
});
