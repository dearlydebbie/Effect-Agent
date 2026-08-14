import { LensStudioConnectionService } from "../services/lens-studio-connection";

const connection = LensStudioConnectionService.fromEnvironment();
const info = await connection.testConnection();
if (info.state !== "CONNECTED") throw new Error(info.message);
const capability = info.capabilities.find((entry) => entry.name === "PreviewPanelTool");
if (!capability) throw new Error("Lens Studio does not expose PreviewPanelTool.");
const config = await connection.callSupportedTool("PreviewPanelTool", { action: "getConfig" });
const sources = await connection.callSupportedTool("PreviewPanelTool", { action: "listSources" });
console.log(JSON.stringify({ capability, config, sources }, null, 2));
