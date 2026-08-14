import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runtimePolicy } from "../config/runtime.ts";
import { demoIdeas } from "../data/demo-ideas.ts";
import { BrowserRepository } from "../services/persistence.ts";
import { selectVisionProvider } from "../services/vision-provider-selection.ts";
import { selectAIProviders } from "../services/ai-provider-selection.ts";

function storage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
}

test("production mode never enables demo data", () => {
  assert.deepEqual(runtimePolicy({ EFFECT_LAB_MODE: "production", ENABLE_DEMO_DATA: "true" }), { mode: "production", demoDataEnabled: false });
  assert.deepEqual(runtimePolicy({}), { mode: "production", demoDataEnabled: false });
});

test("development demo data requires explicit opt-in", () => {
  assert.equal(runtimePolicy({ EFFECT_LAB_MODE: "development" }).demoDataEnabled, false);
  assert.equal(runtimePolicy({ EFFECT_LAB_MODE: "development", ENABLE_DEMO_DATA: "true" }).demoDataEnabled, true);
});

test("production repository hides old demo records without deleting real records", async () => {
  const real = { ...demoIdeas[0], id: "real", title: "Real idea", demo: false };
  const local = storage({ "effect-lab-ideas-v1": JSON.stringify([demoIdeas[0], real]) });
  const repository = new BrowserRepository(local);
  assert.deepEqual((await repository.listIdeas()).map((item) => item.id), ["real"]);
});

test("production mock provider returns unavailable", () => {
  assert.equal(selectVisionProvider({ VISION_QA_ENABLED: "true", EFFECT_LAB_VISION_PROVIDER: "mock", EFFECT_LAB_MODE: "production" }).state, "UNAVAILABLE");
  assert.equal(selectVisionProvider({ VISION_QA_ENABLED: "true", EFFECT_LAB_VISION_PROVIDER: "mock", EFFECT_LAB_MODE: "development", ENABLE_DEMO_DATA: "true" }).state, "MOCK");
});

test("all general production providers return unavailable", async () => {
  const selection = selectAIProviders({ EFFECT_LAB_MODE: "production", ENABLE_DEMO_DATA: "true" });
  assert.equal(selection.state, "UNAVAILABLE");
  await assert.rejects(selection.providers.research.discover("beauty"), /unavailable/i);
  await assert.rejects(selection.providers.ideas.generate({ prompt: "idea" }), /unavailable/i);
});

test("production component has no seeded analytics, earnings, or demo job imports", async () => {
  const source = await readFile(new URL("../components/effect-lab-app.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /data\/demo-ideas|4\.82M|1\.24M|Photo Booth Four|Soft Window Light|Beat Blink|href="#"/);
  assert.match(source, /No earnings recorded yet/);
  assert.match(source, /No analytics yet/);
});
