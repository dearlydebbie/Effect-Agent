import test from "node:test";
import assert from "node:assert/strict";
import { runQA } from "../services/qa-service.ts";
import { demoIdeas } from "../data/demo-ideas.ts";

test("QA returns every required rule",()=>{const checks=runQA(demoIdeas[0],{existingIdeas:demoIdeas,existingAssetPaths:["a","b","c"],hasCopyrightPermission:true,buildPassed:null});assert.equal(checks.length,10);assert.equal(checks.find(check=>check.id==="build")?.result,"WARNING");});
test("QA fails missing asset and permission checks",()=>{const checks=runQA(demoIdeas[0],{existingIdeas:[],existingAssetPaths:[],hasCopyrightPermission:false,buildPassed:false});assert.equal(checks.find(check=>check.id==="assets")?.result,"FAIL");assert.equal(checks.find(check=>check.id==="copyright")?.result,"FAIL");});

