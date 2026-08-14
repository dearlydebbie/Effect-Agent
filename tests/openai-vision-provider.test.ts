import test from "node:test";
import assert from "node:assert/strict";
import { DefaultCreativeDirectorAgent } from "../agents/creative-director.ts";
import { OpenAIVisionProvider, openAIVisualQAResponseSchema, type OpenAIVisionClient } from "../agents/openai-vision-provider.ts";
import { VisualQAAgent } from "../agents/visual-qa.ts";
import { softFlashIdea } from "../data/soft-flash-quality.ts";
import { softFlashTestSpecification } from "../data/soft-flash-test.ts";
import { MemoryVisualQACache } from "../services/visual-qa-cache.ts";
import { selectVisionProvider } from "../services/vision-provider-selection.ts";
import { canRunVisionQA } from "../services/vision-cost-controls.ts";

const validOutput = {
  status: "WARNING", scores: { specificationMatch: 8, visualCoherence: 7, composition: 8, colour: 6, lighting: 6, readability: null, polish: 7, categorySpecificQuality: 6 },
  applicability: { specificationMatch: "APPLICABLE", visualCoherence: "APPLICABLE", composition: "APPLICABLE", colour: "APPLICABLE", lighting: "APPLICABLE", readability: "NOT_APPLICABLE", polish: "APPLICABLE", categorySpecificQuality: "APPLICABLE" },
  overallScore: 6.8, confidence: .82,
  findings: [{ type: "COLOUR", severity: "MEDIUM", description: "The complexion has a visible pink cast.", evidence: "Pink tones are visible across the cheeks and forehead.", recommendedChange: "Reduce the pink colour cast while preserving warmth." }],
  strengths: ["The portrait remains clearly framed."], limitations: ["A static image cannot prove interaction timing."], iterationRecommended: true, iterationPriority: "MEDIUM",
} as const;

function input(previewDataUrl = "data:image/jpeg;base64,AAA") { return { idea: softFlashIdea, creativeDirection: new DefaultCreativeDirectorAgent().direct(softFlashIdea), specification: softFlashTestSpecification, previewDataUrl, category: softFlashIdea.categories, intendedInteraction: softFlashIdea.interactionType, technicalInformation: ["Compilation passed."] }; }
class FakeClient implements OpenAIVisionClient { calls = 0; constructor(private readonly handler: () => unknown | Promise<unknown>) {} async analyse(){ this.calls++; return this.handler(); } }

test("provider selection returns unavailable without an API key", () => {
  const provider = selectVisionProvider({ VISION_QA_ENABLED: "true", OPENAI_VISION_MODEL: "gpt-5.6-terra" });
  assert.equal(provider.state, "UNAVAILABLE"); assert.equal(provider.model, "gpt-5.6-terra");
});

test("provider selection supports explicit mock and disabled states", () => {
  assert.equal(selectVisionProvider({ VISION_QA_ENABLED: "true", EFFECT_LAB_VISION_PROVIDER: "mock", EFFECT_LAB_MODE: "test" }).state, "MOCK");
  assert.equal(selectVisionProvider({ VISION_QA_ENABLED: "false", OPENAI_API_KEY: "test" }).state, "UNAVAILABLE");
});

test("provider selection and label identify the real configured provider", () => {
  const client = new FakeClient(() => validOutput);
  const provider = selectVisionProvider({ VISION_QA_ENABLED: "true", OPENAI_API_KEY: "test", OPENAI_VISION_MODEL: "gpt-5.6-terra" }, { client });
  assert.deepEqual(new VisualQAAgent(provider).getProviderInfo(), { state: "REAL", name: "OpenAI", model: "gpt-5.6-terra", label: "OpenAI · gpt-5.6-terra" });
});

test("real provider accepts schema-valid structured output", async () => {
  const provider = new OpenAIVisionProvider({ apiKey: "test", client: new FakeClient(() => validOutput) });
  const report = await provider.evaluate(input()); assert.equal(report.status, "WARNING"); assert.equal(report.providerState, "REAL"); assert.equal(report.overallScore, 6.8); assert.equal(report.findings[0].evidence, validOutput.findings[0].evidence);
});

test("local schema rejects malformed provider output", () => {
  assert.equal(openAIVisualQAResponseSchema.safeParse({ ...validOutput, overallScore: 12 }).success, false);
  assert.equal(openAIVisualQAResponseSchema.safeParse({ ...validOutput, scores: { ...validOutput.scores, readability: 7 } }).success, false);
});

test("malformed provider responses become unavailable after bounded retry", async () => {
  const client = new FakeClient(() => ({ status: "PASS" }));
  const report = await new OpenAIVisionProvider({ apiKey: "test", client, maxRetries: 2 }).evaluate(input());
  assert.equal(client.calls, 3); assert.equal(report.status, "UNAVAILABLE"); assert.match(report.message, /invalid/i);
});

test("API errors are handled without unbounded retry", async () => {
  const client = new FakeClient(() => { throw Object.assign(new Error("server"), { status: 500 }); });
  const report = await new OpenAIVisionProvider({ apiKey: "test", client, maxRetries: 2, sleep: async () => {} }).evaluate(input());
  assert.equal(client.calls, 3); assert.equal(report.status, "UNAVAILABLE"); assert.match(report.message, /request failed/i);
});

test("timeout returns unavailable", async () => {
  const client = new FakeClient(() => { throw Object.assign(new Error("timeout"), { name: "AbortError" }); });
  const report = await new OpenAIVisionProvider({ apiKey: "test", client, maxRetries: 0 }).evaluate(input());
  assert.equal(report.status, "UNAVAILABLE"); assert.match(report.message, /timed out/i);
});

test("identical preview and intent use the cached result", async () => {
  const client = new FakeClient(() => validOutput); const provider = new OpenAIVisionProvider({ apiKey: "test", client, cache: new MemoryVisualQACache() });
  await provider.evaluate(input()); const second = await provider.evaluate(input()); assert.equal(client.calls, 1); assert.equal(second.cached, true);
});

test("manual re-analysis bypasses an unchanged cache entry", async () => {
  const client = new FakeClient(() => validOutput); const provider = new OpenAIVisionProvider({ apiKey: "test", client, cache: new MemoryVisualQACache() });
  await provider.evaluate(input()); const second = await provider.evaluate(input(), { force: true }); assert.equal(client.calls, 2); assert.equal(second.cached, false);
});

test("changed preview invalidates the cache", async () => {
  const client = new FakeClient(() => validOutput); const provider = new OpenAIVisionProvider({ apiKey: "test", client, cache: new MemoryVisualQACache() });
  await provider.evaluate(input("data:image/jpeg;base64,AAA")); await provider.evaluate(input("data:image/jpeg;base64,BBB")); assert.equal(client.calls, 2);
});

test("changed creative brief invalidates the cache", async () => {
  const client = new FakeClient(() => validOutput); const provider = new OpenAIVisionProvider({ apiKey: "test", client, cache: new MemoryVisualQACache() });
  const first = input(); const second = input(); second.creativeDirection = { ...second.creativeDirection, visualObjective: "A different approved objective." };
  await provider.evaluate(first); await provider.evaluate(second); assert.equal(client.calls, 2);
});

test("provider makes no API call when the actual preview is absent", async () => {
  const client = new FakeClient(() => validOutput); const report = await new OpenAIVisionProvider({ apiKey: "test", client }).evaluate(input(""));
  assert.equal(client.calls, 0); assert.equal(report.status, "UNAVAILABLE");
});

test("cost controls block disabled, failed, automatic, and excessive requests", () => {
  const base = { enabled: true, hasPreview: true, buildPassed: true, userRequested: true, iterationNumber: 0, maxIterations: 3 };
  assert.equal(canRunVisionQA({ ...base, enabled: false }).allowed, false);
  assert.equal(canRunVisionQA({ ...base, hasPreview: false }).allowed, false);
  assert.equal(canRunVisionQA({ ...base, buildPassed: false }).allowed, false);
  assert.equal(canRunVisionQA({ ...base, userRequested: false }).allowed, false);
  assert.equal(canRunVisionQA({ ...base, iterationNumber: 3 }).allowed, false);
  assert.equal(canRunVisionQA({ ...base, iterationNumber: 3, manualReanalysis: true }).allowed, true);
});
