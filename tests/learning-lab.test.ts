import test from "node:test";
import assert from "node:assert/strict";
import { LensStudioLearningAdapter } from "../adapters/lens-studio-learning-adapter.ts";
import { CapabilityKnowledgeBase } from "../services/capability-knowledge-base.ts";
import { createLearningCurriculum } from "../services/curriculum-service.ts";
import { LensStudioConnectionService, type McpTransport } from "../services/lens-studio-connection.ts";
import { evaluateLearningBuild } from "../services/learning-workflow.ts";
import { OriginalityGuard } from "../services/originality-guard.ts";
import { classifyLearningOutcome } from "../services/publish-candidate-service.ts";
import { TrainingExerciseService } from "../services/training-exercise-service.ts";
import type { PatternCard } from "../types/learning.ts";

function patternCard(): PatternCard {
  return { id: "pattern-one", name: "Face inset pattern", source: "LOCAL_OFFICIAL_RESOURCE", officialResourceName: "Face Inset", officialResourceType: "TEMPLATE", categories: ["UNKNOWN"], supportedPlatforms: ["Snapchat"], learningObjective: "Add a face inset.", sceneStructure: [{ name: "Face Inset", type: "SceneObject", id: null, path: null, evidenceSource: "Lens Studio MCP scene-graphql preset inspection" }], importantObjects: ["UNKNOWN"], importantComponents: ["UNKNOWN"], importantAssets: ["UNKNOWN"], importantMaterials: ["UNKNOWN"], importantScripts: ["UNKNOWN"], importantProperties: ["UNKNOWN"], interactions: ["UNKNOWN"], triggers: ["UNKNOWN"], technicalNotes: ["UNKNOWN"], knownConstraints: ["Metadata only."], qualityNotes: ["UNKNOWN"], reusablePrinciples: ["UNKNOWN"], unsafeAssumptions: ["Do not infer missing properties."], confidence: "LOW", inspectedAt: "2026-08-14T00:00:00.000Z" };
}

test("curriculum creates exactly 100 honest unassigned slots with beauty as the largest category", () => {
  const slots = createLearningCurriculum();
  assert.equal(slots.length, 100);
  assert.equal(slots.filter((slot) => slot.category === "Beauty").length, 20);
  assert.ok(slots.every((slot) => slot.exerciseId === null && slot.status === "UNASSIGNED"));
});

test("Lens learning discovery uses read-only preset queries and marks local presets eligible", async () => {
  const calls: Array<{ name: string; args: Record<string, unknown> }> = [];
  const transport: McpTransport = {
    async initialize() { return { serverName: "Lens Studio MCP", serverVersion: "1", protocolVersion: "2025-03-26" }; },
    async listTools() { return [{ name: "scene-graphql", inputSchema: { type: "object" } }]; },
    async callTool(name, args) { calls.push({ name, args }); const query = String(args.query); return { content: [{ type: "text", text: JSON.stringify(query.includes("presets") ? { data: { presets: [{ name: "Face Inset", description: "Add a face inset.", entityType: "SceneObject", section: "Face" }] } } : { data: { preset: { name: "Face Inset", description: "Add a face inset.", entityType: "SceneObject", section: "Face" } } }) }] }; },
  };
  const adapter = new LensStudioLearningAdapter(new LensStudioConnectionService(transport, "5.x"));
  const discovery = await adapter.discover();
  assert.equal(discovery.resources[0].source, "LOCAL_OFFICIAL_RESOURCE");
  assert.equal(discovery.resources[0].automaticLearningEligible, true);
  assert.equal(discovery.lensStudioModified, false);
  assert.deepEqual(calls.map((call) => call.name), ["scene-graphql"]);
  assert.match(String(calls[0].args.query), /presets/);
});

test("Pattern Card keeps unsupported technical details unknown", async () => {
  const transport: McpTransport = {
    async initialize() { return { serverName: "Lens Studio MCP", serverVersion: "1", protocolVersion: "2025-03-26" }; },
    async listTools() { return [{ name: "scene-graphql", inputSchema: { type: "object" } }]; },
    async callTool(_name, args) { const query = String(args.query); return { content: [{ type: "text", text: JSON.stringify(query.includes("presets") ? { data: { presets: [{ name: "Face Inset", description: "Add a face inset.", entityType: "SceneObject", section: "Face" }] } } : { data: { preset: { name: "Face Inset", description: "Add a face inset.", entityType: "SceneObject", section: "Face" } } }) }] }; },
  };
  const adapter = new LensStudioLearningAdapter(new LensStudioConnectionService(transport));
  const resource = (await adapter.discover()).resources[0];
  const card = await adapter.inspect(resource);
  assert.deepEqual(card.importantProperties, ["UNKNOWN"]);
  assert.deepEqual(card.importantScripts, ["UNKNOWN"]);
  assert.equal(card.confidence, "LOW");
});

test("originality and human confirmation block unsafe learning builds", () => {
  const card = patternCard();
  const exercise = new TrainingExerciseService().create(card, 1);
  const same = { ...exercise, id: "other" };
  const assessment = new OriginalityGuard().assess(exercise, { officialResources: [], exercises: [same], localIdeas: [] });
  assert.equal(assessment.status, "TOO_SIMILAR");
  const decision = evaluateLearningBuild({ ...exercise, originalityStatus: assessment.status }, [card]);
  assert.equal(decision.allowed, false);
  assert.match(decision.reasons.join(" "), /originality guard/);
  assert.match(decision.reasons.join(" "), /confirm/);
});

test("publish candidate gate requires all configured quality and human evidence", () => {
  const blocked = classifyLearningOutcome({ technicalQA: "PASS", specificationQA: "PASS", visualScore: null, humanDecision: "PENDING", criticalExperienceFailures: [] });
  assert.equal(blocked.outcome, "TRAINING_ONLY");
  const ready = classifyLearningOutcome({ technicalQA: "PASS", specificationQA: "PASS", visualScore: 8, humanDecision: "APPROVED", criticalExperienceFailures: [] });
  assert.equal(ready.outcome, "PUBLISH_CANDIDATE");
});

test("capability knowledge cannot be verified from an unsupported assumption", () => {
  const knowledge = new CapabilityKnowledgeBase();
  assert.throws(() => knowledge.upsert({ id: "one", capability: "Unknown tool", subjectType: "TOOL", componentName: null, propertyPath: null, supportedOperations: [], statement: "It can build everything.", status: "VERIFIED", evidenceSource: "LLM assumption", observedAt: null, lensStudioVersion: null, versionNotes: [], limits: [] }), /requires Lens Studio or official Snap evidence/);
  knowledge.upsert({ id: "two", capability: "scene-graphql", subjectType: "TOOL", componentName: null, propertyPath: null, supportedOperations: ["query"], statement: "The current MCP exposes this capability.", status: "VERIFIED", evidenceSource: "Lens Studio MCP tools/list", observedAt: "2026-08-14T00:00:00.000Z", lensStudioVersion: "5.x", versionNotes: [], limits: ["Read-only queries are used for learning discovery."] });
  assert.equal(knowledge.verified().length, 1);
});
