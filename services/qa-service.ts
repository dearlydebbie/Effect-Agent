import type { Idea, QACheck } from "../types/domain";
import { validateSTE } from "./ste-validator";
import { findPotentialDuplicates } from "./duplicate-detection";

export interface QAContext { existingIdeas: Idea[]; existingAssetPaths: string[]; hasCopyrightPermission: boolean; buildPassed: boolean | null }

export function runQA(idea: Idea, context: QAContext): QACheck[] {
  const allTextPasses = idea.publicFacingText.every((text) => validateSTE(text).valid);
  const duplicates = findPotentialDuplicates(idea, context.existingIdeas);
  const hasPlaceholder = idea.publicFacingText.some((text) => /todo|placeholder|lorem/i.test(text));
  const unsafeTermsFound = /(?:self[- ]harm|hate speech|sexual content involving minors|make a weapon)/i.test(`${idea.title} ${idea.description} ${idea.publicFacingText.join(" ")}`);
  return [
    check("assets", "Required assets exist", idea.requiredAssets.length > 0 && context.existingAssetPaths.length >= idea.requiredAssets.length, "Add every required asset."),
    check("ste", "Public text uses simple language", allTextPasses, "Simplify the public text."),
    check("placeholder", "No placeholder content remains", !hasPlaceholder, "Remove placeholder content."),
    { id: "duplicate", name: "No obvious duplicate exists", result: duplicates.length ? "WARNING" : "PASS", detail: duplicates.length ? `Review ${duplicates[0].idea.title}.` : "No close local match found." },
    { id: "build", name: "Project builds", result: context.buildPassed === null ? "WARNING" : context.buildPassed ? "PASS" : "FAIL", detail: context.buildPassed === null ? "Platform build tool is not connected." : context.buildPassed ? "Build passed." : "Build failed." },
    check("interaction", "Required interactions are defined", Boolean(idea.interactionType), "Define the interaction."),
    check("first-action", "Effect has a clear first action", /^(tap|move|turn|raise|open|swipe|pinch|point|answer|show|scan|hold|walk|blink)/i.test(idea.hook), "Start with one clear action."),
    check("short", "User instructions are short", idea.publicFacingText.every((text) => text.split(/\s+/).length <= 20), "Shorten the instruction."),
    check("copyright", "Asset permission is recorded", context.hasCopyrightPermission, "Record the asset source or permission."),
    { id: "safety", name: "No deliberate unsafe content", result: unsafeTermsFound ? "FAIL" : "PASS", detail: unsafeTermsFound ? "Remove unsafe content." : "The local rule check found no prohibited terms." },
  ];
}

function check(id: string, name: string, pass: boolean, failDetail: string): QACheck { return { id, name, result: pass ? "PASS" : "FAIL", detail: pass ? "Check passed." : failDetail }; }
