import test from "node:test";
import assert from "node:assert/strict";
import { canTransition } from "../services/status-transitions.ts";

test("valid workflow transitions are accepted",()=>assert.equal(canTransition("BUILDING","TESTING"),true));
test("publishing cannot skip human review",()=>assert.equal(canTransition("BUILDING","PUBLISHED"),false));
test("ready work may move to published after human action",()=>assert.equal(canTransition("READY","PUBLISHED"),true));
test("approved work can wait for a platform connection",()=>assert.equal(canTransition("APPROVED","WAITING"),true));
