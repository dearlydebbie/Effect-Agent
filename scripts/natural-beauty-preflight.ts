import { LensStudioConnectionService } from "../services/lens-studio-connection";
import { inspectLensProject, verifyLearningSandbox } from "../services/lens-project-identity";

const BASELINE = "7cbeeba095c103f4f0f3d48599ceeb69745cb8afe3eae7caced3efc6093753aa";
const EXPECTED_OBJECTS = ["Camera Object", "Envmap", "Light", "Lighting", "AiPreviewAgent Handler"];
const connection = LensStudioConnectionService.fromEnvironment();
const info = await connection.testConnection();
if (info.state !== "CONNECTED") throw new Error(info.message);
const identity = await inspectLensProject(connection);
const verification = verifyLearningSandbox(identity, true);
const unexpectedObjects = identity.keySceneObjects.filter((name) => !EXPECTED_OBJECTS.includes(name));
const requiredTools = ["ExecuteEditorCode", "QueryRuntimeSceneTool", "asset-graphql", "scene-graphql", "RecompileTypeScriptTool", "RunAndCollectLogsTool", "PreviewPanelTool"];
const missingTools = requiredTools.filter((name) => !info.capabilities.some((tool) => tool.name === name));
const allowed = verification.status === "VERIFIED" && identity.projectFingerprint === BASELINE && unexpectedObjects.length === 0 && missingTools.length === 0 && process.env.LENS_STUDIO_MCP_CONNECTION_SOURCE === "MANUAL_CONFIG";
const relevant = new Set([...requiredTools, "VirtualScene"]);
console.log(JSON.stringify({ allowed, connection: info.state, connectionSource: process.env.LENS_STUDIO_MCP_CONNECTION_SOURCE ?? "UNKNOWN", lensStudioVersion: info.lensStudioVersion, capabilityCount: info.capabilities.length, identity, verification, unexpectedObjects, missingTools, capabilities: info.capabilities.filter((tool) => relevant.has(tool.name)).map((tool) => ({ name: tool.name, title: tool.title, description: tool.description, inputSchema: tool.inputSchema })) }, null, 2));
if (!allowed) process.exitCode = 2;
