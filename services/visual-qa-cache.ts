import type { VisualQAReport } from "../types/creative-qa";

export interface VisualQACache { get(key: string): VisualQAReport | undefined; set(key: string, report: VisualQAReport): void }

export class MemoryVisualQACache implements VisualQACache {
  private readonly values = new Map<string, VisualQAReport>();
  get(key: string) { const value = this.values.get(key); return value ? structuredClone(value) : undefined; }
  set(key: string, report: VisualQAReport) { this.values.set(key, structuredClone(report)); }
}

export async function visualQACacheKey(parts: { previewDataUrl: string; creativeDirection: unknown; specification: unknown; model: string }) {
  const value = JSON.stringify(parts);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
