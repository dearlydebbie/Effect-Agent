import type { Idea, Platform, QACheck } from "../types/domain";

export interface ConnectionResult { connected: boolean; message: string; capabilities: string[] }
export interface BuildResult { success: boolean; jobId: string; notes: string[] }
export interface PlatformAdapter {
  readonly platform: Platform;
  testConnection(): Promise<ConnectionResult>;
  prepareBuild(idea: Idea): Promise<BuildResult>;
  runPlatformQA(idea: Idea): Promise<QACheck[]>;
  canPublishAutomatically(): false;
}

