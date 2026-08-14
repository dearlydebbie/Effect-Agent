import test from "node:test";
import assert from "node:assert/strict";
import { VisualIterationService } from "../services/iteration-service.ts";
import type { IterationRecord } from "../types/creative-qa.ts";

function record(number: number, score: number): IterationRecord { return { id: String(number), buildId: "build", number, previewDataUrl: null, visualScore: score, changesMade: [], technicalQA: "PASS", visualQA: "WARNING", timestamp: new Date(number).toISOString() }; }

test("visual iteration count never exceeds the configured limit", () => {
  const service = new VisualIterationService({ strongCandidate: 8, needsImprovement: 6.5, maxVisualIterations: 3, minimumMeaningfulImprovement: .25 });
  assert.equal(service.canIterate([record(1,6),record(2,7),record(3,8)]).allowed, false);
});

test("visual iteration stops after two non-improving attempts", () => {
  const service = new VisualIterationService({ strongCandidate: 8, needsImprovement: 6.5, maxVisualIterations: 5, minimumMeaningfulImprovement: .25 });
  const result = service.canIterate([record(0,7),record(1,7.1),record(2,7.2)]);
  assert.equal(result.allowed, false); assert.match(result.reason, /two attempts/i);
});
