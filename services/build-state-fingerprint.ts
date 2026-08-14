import type { ControlledBuildState } from "../types/build-state";

export function canonicalSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalSerialize).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entry]) => entry !== undefined)
    .sort(([left], [right]) => left.localeCompare(right));
  return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${canonicalSerialize(entry)}`).join(",")}}`;
}

export function normalizeControlledBuildState(state: ControlledBuildState): ControlledBuildState {
  return {
    ...state,
    objects: state.objects
      .map((object) => ({ ...object, components: object.components.map((component) => ({ ...component, properties: sortRecord(component.properties), assetAssignments: sortRecord(component.assetAssignments) })).sort((left, right) => left.id.localeCompare(right.id)) }))
      .sort((left, right) => left.id.localeCompare(right.id)),
    assets: [...state.assets].sort((left, right) => left.id.localeCompare(right.id)),
  };
}

export async function createBuildStateFingerprint(state: ControlledBuildState): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalSerialize(normalizeControlledBuildState(state)));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((item) => item.toString(16).padStart(2, "0")).join("");
}

function sortRecord<T>(record: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(record).sort(([left], [right]) => left.localeCompare(right)));
}
