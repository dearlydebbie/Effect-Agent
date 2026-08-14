import type { Idea, QACheck } from "../types/domain";
import type { BuildResult, ConnectionResult, PlatformAdapter } from "./platform-adapter";

export interface TikTokBuildPack {
  concept: string; effectHouseCreationPrompt: string; recommendedTemplate: string;
  interactionSpecification: string; assetList: string[]; generatedAssetPaths: string[];
  layerStructure: string[]; logicSpecification: string; aiEditorPrompt: string | null;
  createWithAIPrompt: string | null; publicText: string[]; effectName: string;
  description: string; testChecklist: string[]; submissionChecklist: string[];
  status: "Manual Effect House step required";
}

export class TikTokAdapter implements PlatformAdapter {
  readonly platform = "TikTok" as const;
  async testConnection(): Promise<ConnectionResult> { return { connected: false, message: "Direct Effect House control is not available in V1.", capabilities: ["Build pack export"] }; }
  createBuildPack(idea: Idea): TikTokBuildPack { return {
    concept: idea.description, effectHouseCreationPrompt: `Create “${idea.title}”. ${idea.hook} Keep the result clear and fast.`,
    recommendedTemplate: idea.interactionType.toLowerCase().includes("hand") ? "Hand interaction" : "Face or camera interaction",
    interactionSpecification: idea.hook, assetList: idea.requiredAssets, generatedAssetPaths: idea.requiredAssets.map((asset) => `assets/${asset.toLowerCase().replaceAll(" ", "-")}`),
    layerStructure: ["Instructions", "Interaction controller", "Effect visuals", "Safe area"], logicSpecification: idea.technicalApproach,
    aiEditorPrompt: null, createWithAIPrompt: `Build a clear ${idea.interactionType.toLowerCase()} effect. ${idea.hook}`,
    publicText: idea.publicFacingText, effectName: idea.title, description: idea.description,
    testChecklist: ["Test the first action.", "Test in low light.", "Test on two devices.", "Check all public text."],
    submissionChecklist: ["Run Effect House validation.", "Review asset permissions.", "Complete human review.", "Submit manually."],
    status: "Manual Effect House step required",
  }; }
  exportJSON(idea: Idea) { return JSON.stringify(this.createBuildPack(idea), null, 2); }
  exportMarkdown(idea: Idea) { const pack = this.createBuildPack(idea); return `# ${pack.effectName}\n\n${pack.description}\n\n## Status\n\n${pack.status}\n\n## Effect House prompt\n\n${pack.effectHouseCreationPrompt}\n`; }
  async prepareBuild(idea: Idea): Promise<BuildResult> { return { success: true, jobId: `tiktok-pack-${idea.id}`, notes: ["Build pack is ready.", "Manual Effect House step required."] }; }
  async runPlatformQA(): Promise<QACheck[]> { return [{ id: "effect-house", name: "Effect House project check", result: "WARNING", detail: "Complete this check in Effect House." }]; }
  canPublishAutomatically(): false { return false; }
}

