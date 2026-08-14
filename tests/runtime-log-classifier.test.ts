import test from "node:test";
import assert from "node:assert/strict";
import { classifyRuntimeLog } from "../services/runtime-log-classifier.ts";

test("deprecations are separate from runtime errors", () => {
  assert.equal(classifyRuntimeLog("Warning: This API is deprecated.").classification, "DEPRECATION");
  assert.equal(classifyRuntimeLog("Error: Cannot find asset.").classification, "ERROR");
  assert.equal(classifyRuntimeLog("Warning: frame took longer.").classification, "WARNING");
  assert.equal(classifyRuntimeLog("Preview started.").classification, "INFO");
});
