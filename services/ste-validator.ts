export interface STEIssue { rule: string; message: string; severity: "warning" | "error"; segment: string }
export interface STEReport { valid: boolean; score: number; issues: STEIssue[] }

const complexWords: Record<string, string> = {
  commence: "start", utilise: "use", utilize: "use", approximately: "about",
  subsequently: "then", prior: "before", numerous: "many", facilitate: "help",
  functionality: "function", terminate: "stop", illumination: "light",
};

export function validateSTE(text: string): STEReport {
  const issues: STEIssue[] = [];
  const sentences = text.split(/[.!?]+/).map((part) => part.trim()).filter(Boolean);

  for (const sentence of sentences) {
    const words = sentence.match(/[A-Za-z'-]+/g) ?? [];
    if (words.length > 20) issues.push({ rule: "sentence-length", message: "Use 20 words or fewer in one sentence.", severity: "warning", segment: sentence });
    const lower = sentence.toLowerCase();
    for (const [word, replacement] of Object.entries(complexWords)) {
      if (new RegExp(`\\b${word}\\b`, "i").test(sentence)) issues.push({ rule: "simple-word", message: `Use “${replacement}” instead of “${word}”.`, severity: "warning", segment: sentence });
    }
    if (/\b(is|are|was|were|be|been)\s+\w+(ed|en)\b/i.test(sentence)) issues.push({ rule: "active-voice", message: "Use active voice when you can.", severity: "warning", segment: sentence });
    if (/\b(it|this|that|they)\b/i.test(lower) && words.length > 12) issues.push({ rule: "clear-reference", message: "Name the item. Avoid an unclear pronoun.", severity: "warning", segment: sentence });
  }
  if (!text.trim()) issues.push({ rule: "required", message: "Add public text.", severity: "error", segment: "" });
  const score = Math.max(0, 100 - issues.filter((issue) => issue.severity === "warning").length * 12 - issues.filter((issue) => issue.severity === "error").length * 30);
  return { valid: !issues.some((issue) => issue.severity === "error") && score >= 70, score, issues };
}

export class STEValidationService {
  validate(text: string) { return validateSTE(text); }
  validateMany(values: string[]) { return values.map((text) => ({ text, report: validateSTE(text) })); }
}

