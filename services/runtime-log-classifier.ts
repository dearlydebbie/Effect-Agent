export type RuntimeLogClassification = "ERROR" | "WARNING" | "DEPRECATION" | "INFO";
export interface ClassifiedRuntimeLog { classification: RuntimeLogClassification; message: string }

export function classifyRuntimeLog(message: string): ClassifiedRuntimeLog {
  if (/deprecat(ed|ion)|obsolete/i.test(message)) return { classification: "DEPRECATION", message };
  if (/^\s*W\b|\bW\//i.test(message)) return { classification: "WARNING", message };
  if (/\b(error|exception|fatal|cannot find asset)\b|\bE\//i.test(message)) return { classification: "ERROR", message };
  if (/\bwarn(ing)?\b/i.test(message)) return { classification: "WARNING", message };
  return { classification: "INFO", message };
}

export function classifyRuntimeLogs(messages: string[]) { return messages.map(classifyRuntimeLog); }
