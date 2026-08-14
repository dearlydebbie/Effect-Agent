export interface ControlledBuildState {
  buildId: string;
  objects: Array<{
    id: string;
    components: Array<{
      id: string;
      type: string;
      enabled: boolean | null;
      properties: Record<string, unknown>;
      assetAssignments: Record<string, string | null>;
    }>;
  }>;
  assets: Array<{ id: string; type: string; assignment: string | null }>;
}
