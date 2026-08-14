import test from "node:test";
import assert from "node:assert/strict";
import { validateSTE } from "../services/ste-validator.ts";

test("STE validator accepts short active instructions", () => {
  const report = validateSTE("Tap the screen. Pick a lip colour.");
  assert.equal(report.valid, true);
  assert.equal(report.issues.length, 0);
});

test("STE validator flags long and complex text", () => {
  const report = validateSTE("Subsequently, utilise the control to facilitate the modification of the illumination because it was designed to be adjusted by every user in the room.");
  assert.equal(report.valid, false);
  assert.ok(report.issues.some((issue) => issue.rule === "sentence-length"));
  assert.ok(report.issues.some((issue) => issue.rule === "simple-word"));
});

