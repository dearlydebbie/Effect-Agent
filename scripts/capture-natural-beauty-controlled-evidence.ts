import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { naturalBeautyBuildState, naturalBeautyIteration1BuildStateFingerprint } from "../data/natural-beauty-build-state";
import { createBuildStateFingerprint } from "../services/build-state-fingerprint";
import { LensStudioConnectionService, type LensStudioToolResult } from "../services/lens-studio-connection";
import type { ControlledPreviewEvidence } from "../types/controlled-preview-evidence";

const PROJECT_PATH = "/Users/debbie/Documents/Effect Lab Training Sandbox";
const SNAPSHOT_PATH = join(PROJECT_PATH, ".virtual-scene.json");
const OUTPUT_PATH = "/private/tmp/effect-lab-natural-beauty-controlled-preview-evidence.json";
const OPEN_EYES_SOURCE = "/Applications/Lens Studio.app/Contents/Resources/PreviewResources.bundle/Images/Idle/Person 1.jpg";
const SMILE_SOURCE = "/Applications/Lens Studio.app/Contents/Resources/PreviewResources.bundle/Images/Idle/Smile 2.jpg";
const OPEN_EYES_OUTPUT = "/Users/debbie/Documents/effect-agent/public/natural-beauty-evidence-open-eyes.png";
const SMILE_OUTPUT = "/Users/debbie/Documents/effect-agent/public/natural-beauty-evidence-visible-teeth.png";
const connection = LensStudioConnectionService.fromEnvironment();

const originalConfig = parse(await call("PreviewPanelTool", { action: "getConfig" })) as PreviewConfig;
const sources = parse(await call("PreviewPanelTool", { action: "listSources" })) as { images?: string[] };
const before = await readControlledState();
const beforeFingerprint = await createBuildStateFingerprint(before);
if (beforeFingerprint !== naturalBeautyIteration1BuildStateFingerprint) throw new Error("The live controlled build state does not match Natural Beauty Iteration 1.");

const evidence: ControlledPreviewEvidence[] = [];
try {
  evidence.push(await capture("OPEN_EYES", OPEN_EYES_SOURCE, OPEN_EYES_OUTPUT, sources.images ?? []));
  evidence.push(await capture("VISIBLE_TEETH", SMILE_SOURCE, SMILE_OUTPUT, sources.images ?? []));
  evidence.push({ condition: "CLOSE_SKIN_VIEW", state: "UNAVAILABLE", iteration: 1, imagePath: null, sourcePath: null, componentValuesPreserved: true, externalSubmission: "NOT_SENT", evidence: "PreviewPanelTool exposes source selection, camera direction, device simulation, and screenshots. It does not expose crop, zoom, or camera-distance controls.", manualAction: "Add a verified close facial source in the Preview panel or use a real camera close to the face. Then capture the preview." });
} finally {
  await call("PreviewPanelTool", { action: "setConfig", inputType: originalConfig.inputType, sourcePath: originalConfig.inputSourcePath, cameraView: originalConfig.cameraView, deviceCategory: "none" });
  await call("PreviewPanelTool", { action: "refresh" });
}

const after = await readControlledState();
const afterFingerprint = await createBuildStateFingerprint(after);
if (afterFingerprint !== beforeFingerprint) throw new Error("A Natural Beauty component value or controlled assignment changed during preview capture.");
const result = { buildId: "learning-build-001-natural-beauty", iteration: 1, projectPropertiesModified: false, externalImagesSent: false, beforeFingerprint, afterFingerprint, propertyValues: after.objects.find((entry) => entry.id === "3e2b87d4-94cf-41c1-88be-2a08ac2117e8")?.components[0].properties, evidence };
writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ ...result, outputPath: OUTPUT_PATH }, null, 2));
if (existsSync(SNAPSHOT_PATH)) unlinkSync(SNAPSHOT_PATH);

async function capture(condition: ControlledPreviewEvidence["condition"], sourcePath: string, outputPath: string, availableImages: string[]): Promise<ControlledPreviewEvidence> {
  if (!availableImages.includes(sourcePath)) return { condition, state: "UNAVAILABLE", iteration: 1, imagePath: null, sourcePath: null, componentValuesPreserved: true, externalSubmission: "NOT_SENT", evidence: "The required preview source was not returned by PreviewPanelTool.listSources.", manualAction: "Choose a verified local preview source that clearly shows this condition." };
  await call("PreviewPanelTool", { action: "setConfig", inputType: "Multimedia", sourcePath, cameraView: "Front", deviceCategory: "none" });
  await call("PreviewPanelTool", { action: "refresh" });
  await new Promise((resolve) => setTimeout(resolve, 700));
  await call("PreviewPanelTool", { action: "screenshot", detail: "high", includeChrome: false, outputPath });
  return { condition, state: existsSync(outputPath) ? "CAPTURED" : "AVAILABLE", iteration: 1, imagePath: existsSync(outputPath) ? outputPath.replace("/Users/debbie/Documents/effect-agent/public", "") : null, sourcePath, componentValuesPreserved: true, externalSubmission: "NOT_SENT", evidence: "Captured from a path returned by PreviewPanelTool.listSources. Visual condition must be confirmed from the saved image.", manualAction: null };
}

async function readControlledState() {
  await call("VirtualScene", { command: "read" });
  const scene = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8")) as { sceneObjects: SceneObject[] };
  const state = naturalBeautyBuildState(false);
  for (const object of state.objects) {
    const liveObject = scene.sceneObjects.find((entry) => entry.id === object.id);
    if (!liveObject) throw new Error(`Controlled object ${object.id} is missing.`);
    for (const component of object.components) {
      const liveComponent = liveObject.components.find((entry) => entry.id === component.id);
      if (!liveComponent) throw new Error(`Controlled component ${component.id} is missing.`);
      component.enabled = (liveComponent.enabled ?? liveComponent.properties.enabled) as boolean;
      for (const property of Object.keys(component.properties)) component.properties[property] = liveComponent.properties[property];
      if (component.type === "PostEffectVisual") {
        const mainMaterial = liveComponent.properties.mainMaterial;
        const firstMaterial = liveComponent.properties["materials.0"];
        if (mainMaterial !== "@asset:Natural Beauty Colour Material.mat" || firstMaterial !== "@asset:Natural Beauty Colour Material.mat") throw new Error("The controlled material assignment changed.");
      }
    }
  }
  return state;
}

async function call(name: string, args: Record<string, unknown>) { const result = await connection.callSupportedTool(name, args); if (result.isError) throw new Error(`${name} returned an error: ${text(result)}`); return result; }
function parse(result: LensStudioToolResult) { const value = text(result); try { return JSON.parse(value); } catch { return value; } }
function text(result: LensStudioToolResult) { return result.content?.filter((entry) => entry.type === "text").map((entry) => entry.text ?? "").join("\n") ?? ""; }

interface PreviewConfig { cameraView: "Front" | "Back"; inputSourcePath: string; inputType: "Interactive" | "Multimedia" }
interface SceneObject { id: string; components: Array<{ id: string; type: string; enabled?: boolean; properties: Record<string, unknown> }> }
