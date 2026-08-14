import test from "node:test";
import assert from "node:assert/strict";
import { DefaultCreativeDirectorAgent } from "../agents/creative-director.ts";
import { ExperienceQAAgent } from "../agents/experience-qa.ts";
import { MockVisionProvider, UnavailableVisionProvider, VisualQAAgent } from "../agents/visual-qa.ts";
import { softFlashIdea } from "../data/soft-flash-quality.ts";
import { softFlashTestSpecification } from "../data/soft-flash-test.ts";

const input = { idea: softFlashIdea, creativeDirection: new DefaultCreativeDirectorAgent().direct(softFlashIdea), specification: softFlashTestSpecification, previewDataUrl: "data:image/png;base64,AA==", category: softFlashIdea.categories, intendedInteraction: softFlashIdea.interactionType, technicalInformation: ["Compilation passed."] };

test("unavailable vision provider does not fake visual analysis", async () => {
  const report = await new VisualQAAgent(new UnavailableVisionProvider()).evaluate(input);
  assert.equal(report.status, "UNAVAILABLE"); assert.equal(report.overallScore, null); assert.equal(report.scores.lighting, null); assert.equal(report.mock, false);
});

test("mock visual report is explicitly labelled and matches the schema", async () => {
  const report = await new VisualQAAgent(new MockVisionProvider()).evaluate(input);
  assert.equal(report.mock, true); assert.equal(typeof report.scores.composition, "number"); assert.equal(typeof report.findings[0].severity, "string");
});

test("technical, visual, and experience QA remain separate", () => {
  const experience = new ExperienceQAAgent().evaluate({ interactionWorks: "A recorded test completed." });
  assert.equal(experience.status, "WARNING");
  assert.equal(experience.criteria.find((item) => item.id === "interactionWorks")?.status, "PASS");
  assert.equal(experience.criteria.find((item) => item.id === "resetWorks")?.status, "UNKNOWN");
});
