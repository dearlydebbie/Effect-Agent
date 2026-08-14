import test from "node:test";
import assert from "node:assert/strict";
import { createPresetRecord, mergeMetadataInspection } from "../services/preset-census.ts";
import { BrowserPresetCensusRepository } from "../services/preset-census-persistence.ts";
import { findDuplicatePresetPatterns, RepresentativePresetSelectionService } from "../services/representative-preset-selection.ts";
import { emptySandboxConfirmation, evaluateSandboxInstantiation, TRAINING_SANDBOX_LENS_NAME } from "../services/training-sandbox-safety.ts";
import { assessCurriculumReadiness } from "../services/curriculum-readiness.ts";
import type { OfficialLearningResource, PatternCard } from "../types/learning.ts";

function resource(id: string, name: string, description: string | null): OfficialLearningResource { return { id, name, description, source: "LOCAL_OFFICIAL_RESOURCE", resourceType: "TEMPLATE", section: "Built-in presets", discoveredThrough: "scene-graphql", evidenceSource: "Lens Studio MCP scene-graphql preset index", automaticLearningEligible: true, inspectionStatus: "DISCOVERED", rawMetadata: { name, description, entityType: "SceneObject", section: "Built-in presets" } }; }
function memoryStorage() { let value: string | null = null; return { getItem: () => value, setItem: (_key: string, next: string) => { value = next; } }; }

test("preset census persists records and preserves inspection progress across rediscovery", async () => {
  const repository = new BrowserPresetCensusRepository(memoryStorage());
  const discovered = createPresetRecord(resource("one", "BeautyPreset", "PostEffectVisual with Beauty LUT"), "5.23.1");
  await repository.saveCensus([discovered]);
  await repository.savePreset(mergeMetadataInspection(discovered, discovered.rawMetadata, "pattern-one", "5.23.1"));
  await repository.saveCensus([createPresetRecord(resource("one", "BeautyPreset", "PostEffectVisual with Beauty LUT"), "5.23.1")]);
  const stored = await repository.load();
  assert.equal(stored.presets[0].inspectionLevel, "METADATA_INSPECTED");
  assert.deepEqual(stored.presets[0].patternCardIds, ["pattern-one"]);
});

test("category and purpose distinguish inference from explicit Lens Studio metadata", () => {
  const record = createPresetRecord(resource("one", "BeautyPreset", "PostEffectVisual with Beauty LUT"), "5.23.1");
  assert.equal(record.inferredCategory.authority, "INFERENCE");
  assert.equal(record.likelyPurpose.authority, "EXPLICIT_METADATA");
  assert.equal(record.evidence[0].lensStudioVersion, "5.23.1");
});

test("unknown metadata remains unknown and does not become verified knowledge", () => {
  const record = createPresetRecord(resource("one", "OpaquePreset", null), "5.23.1");
  assert.equal(record.inferredCategory.value, "Unknown");
  assert.equal(record.inferredCategory.authority, "UNKNOWN");
  assert.equal(record.likelyPurpose.value, "UNKNOWN");
});

test("inspection levels advance only when matching evidence is stored", () => {
  const discovered = createPresetRecord(resource("one", "AudioPreset", "Creates an audio component."), "5.23.1");
  assert.equal(discovered.inspectionLevel, "DISCOVERED");
  const inspected = mergeMetadataInspection(discovered, discovered.rawMetadata, "pattern-one", "5.23.1");
  assert.equal(inspected.inspectionLevel, "METADATA_INSPECTED");
  assert.ok(inspected.inspectionHistory.every((event) => !["SCENE_INSPECTED", "DEEPLY_INSPECTED"].includes(event.level)));
});

test("representative selection covers distinct categories and prioritises five beauty-related presets", () => {
  const definitions = [
    ["BeautyOne", "Beauty skin treatment"], ["MakeupOne", "Makeup blush component"], ["ColourOne", "Camera colour grading"], ["LipOne", "Lipstick makeup texture"], ["LightOne", "Beauty photographic lighting"],
    ["FaceTrack", "Face tracking landmarks"], ["BodyTrack", "Full body tracking"], ["HandTrack", "Hand tracking mesh"], ["World", "World surface placement"], ["Object", "Object placement on surface"], ["Vfx", "VFX distortion trail"], ["Particles", "Particle system"], ["Audio", "Audio microphone input"], ["Text", "Text font component"], ["Segment", "Background segmentation"], ["Machine", "Machine learning classification"], ["Gen", "GenAI prompt"], ["Transform", "Transformation morph"], ["Utility", "Utility screen transform"], ["Experimental", "Experimental prototype"], ["Game", "Game score interaction"], ["Quiz", "Quiz question"], ["Random", "Random picker"],
  ];
  const records = definitions.map(([name, description], index) => createPresetRecord(resource(String(index), name, description), "5.23.1"));
  const selection = new RepresentativePresetSelectionService().select(records, 20);
  assert.equal(selection.selected.length, 20);
  assert.ok(selection.beautyRelatedCount >= 5);
  assert.ok(new Set(selection.selected.map((item) => item.presetId)).size === selection.selected.length);
});

test("near-duplicate technical patterns are detected", () => {
  const first = createPresetRecord(resource("one", "RedPreset", "PostEffectVisual with Red LUT"), "5.23.1");
  const second = createPresetRecord(resource("two", "BluePreset", "PostEffectVisual with Blue LUT"), "5.23.1");
  assert.equal(findDuplicatePresetPatterns([first, second]).length, 1);
});

test("training sandbox safety blocks normal projects and unverified resets", () => {
  const preset = createPresetRecord(resource("one", "BeautyPreset", "Beauty LUT"), "5.23.1");
  const blocked = evaluateSandboxInstantiation(preset, emptySandboxConfirmation(), false);
  assert.equal(blocked.allowed, false);
  assert.match(blocked.actionRequired ?? "", /disposable Lens named Effect Lab Sandbox/);
  const confirmed = { expectedName: TRAINING_SANDBOX_LENS_NAME, currentProjectName: TRAINING_SANDBOX_LENS_NAME, currentProjectPath: "/Users/debbie/Documents/Effect Lab Training Sandbox", projectMarkedAsSandbox: true, liveMcpResponded: true, softFlashMarkersAbsent: true, projectFingerprint: "abc", humanConfirmed: true, confirmedPresetId: preset.id, confirmedAt: new Date().toISOString() } as const;
  assert.equal(evaluateSandboxInstantiation(preset, confirmed, false).allowed, false);
});

test("Pattern Card evidence levels preserve metadata-only and unknown fields", () => {
  const card = { categories: ["Beauty"], fieldEvidence: { officialResourceName: "METADATA_ONLY", importantProperties: "UNKNOWN" } } as unknown as PatternCard;
  assert.equal(card.fieldEvidence?.officialResourceName, "METADATA_ONLY");
  assert.equal(card.fieldEvidence?.importantProperties, "UNKNOWN");
});

test("curriculum readiness is category-specific and requires scene evidence for READY", () => {
  const card = { id: "one", categories: ["Beauty"], fieldEvidence: { importantComponents: "SCENE_VERIFIED" } } as unknown as PatternCard;
  const readiness = assessCurriculumReadiness([card], []);
  assert.equal(readiness.find((item) => item.category === "Beauty")?.status, "PARTIAL");
  assert.equal(readiness.find((item) => item.category === "Games")?.status, "NOT_READY");
});
