import { naturalBeautyReviewIdentity } from "../config/builds";
import { naturalBeautyAutomatedQualityAssessment } from "../data/natural-beauty-controlled-evidence-qa";
import { createBuildStateFingerprint } from "./build-state-fingerprint";
import { inspectLensProject } from "./lens-project-identity";
import { LensStudioConnectionService, type LensStudioToolResult } from "./lens-studio-connection";
import type { ControlledBuildState } from "../types/build-state";
import type { NaturalBeautyReadinessCheck, NaturalBeautyReviewReadiness } from "../types/natural-beauty-review-readiness";

const EXPECTED_PROJECT_FOLDER = "/Users/debbie/Documents/Effect Lab Training Sandbox";
const GRADE_OBJECT_ID = "95954e47-3175-4685-a1a6-93e78436c207";
const GRADE_COMPONENT_ID = "ea8d555f-5f9d-4e8a-bb65-1769008c0d9e";
const RETOUCH_OBJECT_ID = "3e2b87d4-94cf-41c1-88be-2a08ac2117e8";
const RETOUCH_COMPONENT_ID = "ac14ad83-f8b6-4187-a0cc-8ab272902e37";

const READ_CONTROLLED_STATE_CODE = `const model = pluginSystem.findInterface(Editor.Model.IModel);
const scene = model.project.scene;
const grade = scene.findComponents("PostEffectVisual").find((component) => String(component.id) === ${JSON.stringify(GRADE_COMPONENT_ID)} && String(component.sceneObject.id) === ${JSON.stringify(GRADE_OBJECT_ID)});
const retouch = scene.findComponents("RetouchVisual").find((component) => String(component.id) === ${JSON.stringify(RETOUCH_COMPONENT_ID)} && String(component.sceneObject.id) === ${JSON.stringify(RETOUCH_OBJECT_ID)});
const material = grade ? grade.mainMaterial : null;
const pass = material && material.passInfos && material.passInfos.length ? material.passInfos[0] : null;
const lut = pass && pass.baseTex ? pass.baseTex : null;
return {
  grade: grade ? { objectId:String(grade.sceneObject.id), objectName:grade.sceneObject.name, componentId:String(grade.id), componentType:"PostEffectVisual", enabled:grade.enabled, materialId:material ? String(material.id) : null, materialName:material ? material.name : null, materialPath:material && material.fileMeta ? String(material.fileMeta.sourcePath) : null, firstMaterialId:grade.materials && grade.materials.length ? String(grade.materials[0].id) : null, lutId:lut ? String(lut.id) : null, lutName:lut ? lut.name : null, lutPath:lut && lut.fileMeta ? String(lut.fileMeta.sourcePath) : null } : null,
  retouch: retouch ? { objectId:String(retouch.sceneObject.id), objectName:retouch.sceneObject.name, componentId:String(retouch.id), componentType:"RetouchVisual", enabled:retouch.enabled, faceIndex:retouch.faceIndex, softSkinIntensity:retouch.softSkinIntensity, teethWhiteningIntensity:retouch.teethWhiteningIntensity, sharpenEyeIntensity:retouch.sharpenEyeIntensity, eyeWhiteningIntensity:retouch.eyeWhiteningIntensity } : null
};`;

interface GradeReadback { objectId: string; objectName: string; componentId: string; componentType: string; enabled: boolean; materialId: string | null; materialName: string | null; materialPath: string | null; firstMaterialId: string | null; lutId: string | null; lutName: string | null; lutPath: string | null }
interface RetouchReadback { objectId: string; objectName: string; componentId: string; componentType: string; enabled: boolean; faceIndex: number; softSkinIntensity: number; teethWhiteningIntensity: number; sharpenEyeIntensity: number; eyeWhiteningIntensity: number }

export async function verifyNaturalBeautyHumanReview(connection = LensStudioConnectionService.fromEnvironment(), connectionSource = process.env.LENS_STUDIO_MCP_CONNECTION_SOURCE): Promise<NaturalBeautyReviewReadiness> {
  const capturedAt = new Date().toISOString();
  const checks: NaturalBeautyReadinessCheck[] = [];
  const info = await connection.testConnection();
  add(checks, "connection", "Lens Studio MCP", "CONNECTED", info.state, info.state === "CONNECTED");
  if (info.state !== "CONNECTED") return unavailable(capturedAt, info.state, checks, info.message);

  try {
    const identity = await inspectLensProject(connection);
    const payload = readToolJson(await connection.callSupportedTool("ExecuteEditorCode", { code: READ_CONTROLLED_STATE_CODE, timeoutMs: 10000 }));
    const value = payload.returnValue as { grade?: GradeReadback | null; retouch?: RetouchReadback | null } | undefined;
    const grade = value?.grade ?? null;
    const retouch = value?.retouch ?? null;
    const softFlashMarkers = [...identity.keySceneObjects, ...identity.assetNames].filter((name) => /BlownWhitePreset|Blown White|BlownWhite/i.test(name));
    const activeBuild = Boolean(grade && retouch && grade.objectName === "Natural Beauty Grade" && retouch.objectName === "Natural Beauty Retouch" && grade.componentType === "PostEffectVisual" && retouch.componentType === "RetouchVisual");
    const sandboxVerified = identity.lensName === "Effect Lab Sandbox" && identity.projectFolder === EXPECTED_PROJECT_FOLDER && softFlashMarkers.length === 0 && Boolean(identity.projectFingerprint);
    const state = grade && retouch ? controlledState(grade, retouch) : null;
    const buildStateFingerprint = state ? await createBuildStateFingerprint(state) : null;

    add(checks, "lens", "Active Lens", "Effect Lab Sandbox", identity.lensName ?? "UNKNOWN", identity.lensName === "Effect Lab Sandbox");
    add(checks, "folder", "Project folder", EXPECTED_PROJECT_FOLDER, identity.projectFolder ?? "UNKNOWN", identity.projectFolder === EXPECTED_PROJECT_FOLDER);
    add(checks, "connection-source", "Connection source", "MANUAL_CONFIG", connectionSource ?? "UNKNOWN", connectionSource === "MANUAL_CONFIG");
    add(checks, "soft-flash", "Soft Flash markers", "ABSENT", softFlashMarkers.length ? softFlashMarkers.join(", ") : "ABSENT", softFlashMarkers.length === 0);
    add(checks, "sandbox", "Sandbox status", "VERIFIED", sandboxVerified ? "VERIFIED" : "MISMATCH", sandboxVerified);
    add(checks, "active-build", "Active learning build", naturalBeautyReviewIdentity.buildId, activeBuild ? naturalBeautyReviewIdentity.buildId : "UNKNOWN", activeBuild);
    add(checks, "build-fingerprint", "Build State Fingerprint", naturalBeautyReviewIdentity.buildStateFingerprint, buildStateFingerprint ?? "UNKNOWN", buildStateFingerprint === naturalBeautyReviewIdentity.buildStateFingerprint);
    add(checks, "grade", "Colour-grade component", "DISABLED", grade ? String(!grade.enabled ? "DISABLED" : "ENABLED") : "UNKNOWN", grade?.enabled === false);
    addNumber(checks, "face-index", "faceIndex", 0, retouch?.faceIndex);
    addNumber(checks, "soft-skin", "softSkinIntensity", 0.25, retouch?.softSkinIntensity);
    addNumber(checks, "teeth", "teethWhiteningIntensity", 0.1, retouch?.teethWhiteningIntensity);
    addNumber(checks, "eye-sharpen", "sharpenEyeIntensity", 0.2, retouch?.sharpenEyeIntensity);
    addNumber(checks, "eye-whiten", "eyeWhiteningIntensity", 0.08, retouch?.eyeWhiteningIntensity);
    add(checks, "technical-qa", "Technical QA", "PASS", naturalBeautyAutomatedQualityAssessment.technicalQA, naturalBeautyAutomatedQualityAssessment.technicalQA === "PASS");
    add(checks, "specification-qa", "Specification QA", "PASS", naturalBeautyAutomatedQualityAssessment.specificationQA, naturalBeautyAutomatedQualityAssessment.specificationQA === "PASS");
    add(checks, "visual-qa", "Visual QA", "PASS", naturalBeautyAutomatedQualityAssessment.visualQA, naturalBeautyAutomatedQualityAssessment.visualQA === "PASS");
    add(checks, "experience-qa", "Experience QA", "WARNING", naturalBeautyAutomatedQualityAssessment.experienceQA, naturalBeautyAutomatedQualityAssessment.experienceQA === "WARNING");
    add(checks, "iteration", "Automated iteration", "STOP", naturalBeautyAutomatedQualityAssessment.automatedIterationRecommendation, naturalBeautyAutomatedQualityAssessment.automatedIterationRecommendation === "STOP");
    add(checks, "ready-operations", "READY Iteration 2 operations", "0", String(naturalBeautyAutomatedQualityAssessment.iteration2ReadyOperations.length), naturalBeautyAutomatedQualityAssessment.iteration2ReadyOperations.length === 0);
    add(checks, "human-review", "Human Review state", "AWAITING_HUMAN_REVIEW", naturalBeautyAutomatedQualityAssessment.workflowStatus, naturalBeautyAutomatedQualityAssessment.workflowStatus === "AWAITING_HUMAN_REVIEW");

    const mismatches = checks.filter((check) => !check.passed).map((check) => `${check.label}: expected ${check.expected}; received ${check.actual}.`);
    return {
      buildId: naturalBeautyReviewIdentity.buildId, capturedAt, ready: mismatches.length === 0, connectionState: info.state,
      lensName: identity.lensName, projectFolder: identity.projectFolder, sandboxStatus: sandboxVerified ? "VERIFIED" : "MISMATCH",
      projectIdentityFingerprint: identity.projectFingerprint, buildStateFingerprint,
      values: { colourGradeEnabled: grade?.enabled ?? null, faceIndex: retouch?.faceIndex ?? null, softSkinIntensity: retouch?.softSkinIntensity ?? null, teethWhiteningIntensity: retouch?.teethWhiteningIntensity ?? null, sharpenEyeIntensity: retouch?.sharpenEyeIntensity ?? null, eyeWhiteningIntensity: retouch?.eyeWhiteningIntensity ?? null },
      quality: { technicalQA: naturalBeautyAutomatedQualityAssessment.technicalQA, specificationQA: naturalBeautyAutomatedQualityAssessment.specificationQA, visualQA: naturalBeautyAutomatedQualityAssessment.visualQA, unresolvedCriticalFindings: naturalBeautyAutomatedQualityAssessment.unresolvedCriticalFindings, experienceQA: "WARNING", automatedIterationRecommendation: "STOP", readyIteration2Operations: 0, humanReviewState: "AWAITING_HUMAN_REVIEW" },
      checks, mismatches, lensStudioModifiedByVerification: false, openAICalled: false, published: false,
    };
  } catch (error) {
    return unavailable(capturedAt, info.state, checks, error instanceof Error ? error.message : "Natural Beauty verification failed.");
  }
}

function controlledState(grade: GradeReadback, retouch: RetouchReadback): ControlledBuildState {
  return {
    buildId: naturalBeautyReviewIdentity.buildId,
    objects: [
      { id: grade.objectId, components: [{ id: grade.componentId, type: grade.componentType, enabled: grade.enabled, properties: {}, assetAssignments: { mainMaterial: grade.materialId, materials0: grade.firstMaterialId, lutTexture: grade.lutId } }] },
      { id: retouch.objectId, components: [{ id: retouch.componentId, type: retouch.componentType, enabled: retouch.enabled, properties: { faceIndex: retouch.faceIndex, softSkinIntensity: retouch.softSkinIntensity, teethWhiteningIntensity: retouch.teethWhiteningIntensity, sharpenEyeIntensity: retouch.sharpenEyeIntensity, eyeWhiteningIntensity: retouch.eyeWhiteningIntensity }, assetAssignments: {} }] },
    ],
    assets: [
      { id: grade.materialId ?? "MISSING", type: "Material", assignment: fileName(grade.materialPath) ?? grade.materialName },
      { id: grade.lutId ?? "MISSING", type: "FileTexture", assignment: fileName(grade.lutPath) ?? grade.lutName },
    ],
  };
}

function unavailable(capturedAt: string, state: string, checks: NaturalBeautyReadinessCheck[], reason: string): NaturalBeautyReviewReadiness {
  const mismatches = [...checks.filter((check) => !check.passed).map((check) => `${check.label}: expected ${check.expected}; received ${check.actual}.`), reason];
  return { buildId: naturalBeautyReviewIdentity.buildId, capturedAt, ready: false, connectionState: state, lensName: null, projectFolder: null, sandboxStatus: "UNKNOWN", projectIdentityFingerprint: null, buildStateFingerprint: null, values: { colourGradeEnabled: null, faceIndex: null, softSkinIntensity: null, teethWhiteningIntensity: null, sharpenEyeIntensity: null, eyeWhiteningIntensity: null }, quality: { technicalQA: naturalBeautyAutomatedQualityAssessment.technicalQA, specificationQA: naturalBeautyAutomatedQualityAssessment.specificationQA, visualQA: naturalBeautyAutomatedQualityAssessment.visualQA, unresolvedCriticalFindings: naturalBeautyAutomatedQualityAssessment.unresolvedCriticalFindings, experienceQA: "WARNING", automatedIterationRecommendation: "STOP", readyIteration2Operations: 0, humanReviewState: "AWAITING_HUMAN_REVIEW" }, checks, mismatches, lensStudioModifiedByVerification: false, openAICalled: false, published: false };
}
function add(checks: NaturalBeautyReadinessCheck[], id: string, label: string, expected: string, actual: string, passed: boolean) { checks.push({ id, label, expected, actual, passed }); }
function addNumber(checks: NaturalBeautyReadinessCheck[], id: string, label: string, expected: number, actual: number | undefined) { add(checks, id, label, String(expected), actual === undefined ? "UNKNOWN" : String(actual), typeof actual === "number" && Math.abs(actual - expected) < 0.00001); }
function readToolJson(result: LensStudioToolResult): Record<string, unknown> { const text = result.content?.find((item) => item.type === "text" && item.text)?.text; if (!text) return {}; try { return JSON.parse(text) as Record<string, unknown>; } catch { return {}; } }
function fileName(value: string | null) { return value?.split(/[\\/]/).filter(Boolean).at(-1) ?? null; }
