import test from "node:test";
import assert from "node:assert/strict";
import { scoreIdea } from "../services/idea-scoring.ts";

const input = { originality:8, immediateComprehension:8, visualAppeal:8, shareability:8, replayValue:8, interactionQuality:8, platformFit:8, technicalFeasibility:8, buildCost:8, monetisationPotential:8 };
test("critic recommends build above the configured threshold", () => { const result=scoreIdea(input); assert.equal(result.overallScore,8); assert.equal(result.recommendation,"BUILD"); });
test("critic thresholds can be replaced", () => { const result=scoreIdea(input,{rejectBelow:8.5,buildAtOrAbove:9}); assert.equal(result.recommendation,"REJECT"); });

