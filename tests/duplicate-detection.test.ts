import test from "node:test";
import assert from "node:assert/strict";
import { conceptSimilarity, findPotentialDuplicates } from "../services/duplicate-detection.ts";
import { demoIdeas } from "../data/demo-ideas.ts";

test("similar concepts receive a high similarity score",()=>{const base=demoIdeas[0];const copy={...base,id:"copy",title:"Soft Window Lighting"};assert.ok(conceptSimilarity(base,copy)>.6);assert.equal(findPotentialDuplicates(copy,demoIdeas).length,1);});
test("different concepts do not match",()=>assert.ok(conceptSimilarity(demoIdeas[0],demoIdeas[7])<.3));

