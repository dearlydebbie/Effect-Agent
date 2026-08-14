import test from "node:test";
import assert from "node:assert/strict";
import { softFlashTestSpecification } from "../data/soft-flash-test.ts";
import { SnapchatLensBuildOrchestrator } from "../services/snapchat-build-orchestrator.ts";
import { LensStudioConnectionService } from "../services/lens-studio-connection.ts";

test("Soft Flash Test has a complete, safe Lens build specification", () => {
  const orchestrator = new SnapchatLensBuildOrchestrator(new LensStudioConnectionService(null));
  assert.equal(orchestrator.validateSpecification(softFlashTestSpecification).valid, true);
  assert.deepEqual(softFlashTestSpecification.categories, ["Beauty", "Aesthetic camera effects"]);
  assert.match(softFlashTestSpecification.technicalConstraints.join(" "), /Do not publish/);
  assert.match(softFlashTestSpecification.behaviourRequirements.join(" "), /Do not alter face shape/);
});

test("Lens public text must pass STE validation", () => {
  const invalid = { ...softFlashTestSpecification, textRequirements: [{ purpose: "instruction" as const, publicFacing: true as const, text: "Subsequently, utilise the control to facilitate the modification of the illumination because it was designed to be adjusted by every user in the room." }] };
  const orchestrator = new SnapchatLensBuildOrchestrator(new LensStudioConnectionService(null));
  assert.equal(orchestrator.validateSpecification(invalid).valid, false);
});

test("creative direction does not weaken STE validation for public text", () => {
  const invalid = { ...softFlashTestSpecification, textRequirements: [{ purpose: "hint" as const, publicFacing: true as const, text: "Subsequently, utilise the illumination control to facilitate the modification of your appearance." }] };
  assert.equal(new SnapchatLensBuildOrchestrator(new LensStudioConnectionService(null)).validateSpecification(invalid).valid, false);
});
