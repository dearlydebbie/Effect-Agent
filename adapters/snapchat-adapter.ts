import type { Idea, QACheck } from "../types/domain";
import type { BuildResult, ConnectionResult, PlatformAdapter } from "./platform-adapter";
import { LensStudioConnectionService } from "../services/lens-studio-connection";

export class SnapchatAdapter implements PlatformAdapter {
  readonly platform = "Snapchat" as const;
  constructor(private readonly connection = new LensStudioConnectionService(null)) {}
  async testConnection(): Promise<ConnectionResult> {
    const info = await this.connection.testConnection();
    return { connected: info.state === "CONNECTED", message: info.message, capabilities: info.capabilities.map((capability) => capability.name) };
  }
  async prepareBuild(idea: Idea): Promise<BuildResult> {
    const connection = await this.testConnection();
    return connection.connected
      ? { success: true, jobId: `snap-${idea.id}`, notes: ["The connected server capabilities were discovered.", "Human review is required before submission."] }
      : { success: false, jobId: `snap-${idea.id}`, notes: [connection.message, "The idea is safe. No platform action was attempted."] };
  }
  async runPlatformQA(): Promise<QACheck[]> {
    const connection = await this.testConnection();
    return [{ id: "lens-compile", name: "Lens Studio compilation", result: "WARNING", detail: connection.connected ? "Run the controlled build to compile this Lens." : "Connect Lens Studio to run this check." }];
  }
  canPublishAutomatically(): false { return false; }
}
