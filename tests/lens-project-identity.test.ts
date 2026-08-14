import test from "node:test";
import assert from "node:assert/strict";
import { sandboxAllowsModification, verifyLearningSandbox } from "../services/lens-project-identity.ts";
import type { LensProjectIdentity } from "../types/system-health.ts";

const verified: LensProjectIdentity = { lensName: "Effect Lab Sandbox", projectFile: "/Users/debbie/Documents/Effect Lab Training Sandbox/Project.esproj", projectFolder: "/Users/debbie/Documents/Effect Lab Training Sandbox", projectFingerprint: "abc", keySceneObjects: ["Camera"], assetNames: ["Scene.scene"], checkedAt: "2026-08-14T00:00:00.000Z" };

test("sandbox identity requires exact name and folder", () => {
  assert.equal(verifyLearningSandbox(verified, true).status, "VERIFIED");
  assert.equal(verifyLearningSandbox({ ...verified, lensName: "Untitled" }, true).status, "MISMATCH");
  assert.equal(verifyLearningSandbox({ ...verified, projectFolder: "/tmp/Effect Lab Training Sandbox" }, true).status, "MISMATCH");
});

test("sandbox identity requires a live endpoint and captured fingerprint", () => {
  assert.equal(verifyLearningSandbox(verified, false).status, "UNKNOWN");
  assert.equal(verifyLearningSandbox({ ...verified, projectFingerprint: null }, true).status, "UNKNOWN");
});

test("Soft Flash markers block learning modification", () => {
  const result = verifyLearningSandbox({ ...verified, keySceneObjects: ["Blown White"] }, true);
  assert.equal(result.status, "MISMATCH");
  assert.deepEqual(result.excludedMarkersFound, ["Blown White"]);
});

test("modification requires a verified unchanged fingerprint", () => {
  const result = verifyLearningSandbox(verified, true);
  assert.equal(sandboxAllowsModification(result, "abc", "abc"), true);
  assert.equal(sandboxAllowsModification(result, "abc", "changed"), false);
  assert.equal(sandboxAllowsModification({ ...result, status: "UNKNOWN" }, "abc", "abc"), false);
});
