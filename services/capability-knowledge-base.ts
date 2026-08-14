import type { CapabilityKnowledgeEntry } from "../types/learning";

const verifiedEvidence = /Lens Studio MCP|official Snap|local official resource/i;

export class CapabilityKnowledgeBase {
  private entries = new Map<string, CapabilityKnowledgeEntry>();

  upsert(entry: CapabilityKnowledgeEntry) {
    if (entry.status === "VERIFIED" && (!entry.evidenceSource || !verifiedEvidence.test(entry.evidenceSource))) {
      throw new Error("Verified capability knowledge requires Lens Studio or official Snap evidence.");
    }
    this.entries.set(entry.id, structuredClone(entry));
  }

  list() { return [...this.entries.values()].map((entry) => structuredClone(entry)); }
  verified() { return this.list().filter((entry) => entry.status === "VERIFIED"); }
}
