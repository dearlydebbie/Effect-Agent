import type { DeepPresetInspection, VerifiedInspectionItem } from "../types/deep-preset-inspection";
import type { CapabilityKnowledgeEntry, ObservedTechnicalElement, PatternCard } from "../types/learning";

const observedAt = "2026-08-14T13:04:19.141Z";
const evidence = "Lens Studio MCP BeautyPreset deep inspection on Lens Studio 5.23.1.26080420";
const item = (name: string, type: string, id: string, path: string | null, properties?: VerifiedInspectionItem["properties"]): VerifiedInspectionItem => ({ name, type, id, path, evidenceSource: evidence, evidenceLevel: properties ? "PROPERTY_VERIFIED" : "SCENE_VERIFIED", ...(properties ? { properties } : {}) });
const observed = (value: VerifiedInspectionItem): ObservedTechnicalElement => ({ name: value.name, type: value.type, id: value.id, path: value.path, evidenceSource: value.evidenceSource });

const objects = [
  item("Effects", "SceneObject", "ff43caaa-89f5-4e8a-8c37-3420c2ff1991", "Camera Object/Effects"),
  item("Beauty", "SceneObject", "eadf2468-0d54-4a0e-815e-42817ebad6e9", "Camera Object/Effects/Beauty"),
];
const component = item("BeautyPreset Inspection", "PostEffectVisual", "98e29b08-a697-4da4-9023-c3d254b65540", "Camera Object/Effects/Beauty", [
  { name: "materials.0", value: "@asset:Color Correction.mat", evidenceLevel: "PROPERTY_VERIFIED" },
  { name: "mainMaterial", value: "@asset:Color Correction.mat", evidenceLevel: "PROPERTY_VERIFIED" },
  { name: "stretchMode", value: "Stretch", evidenceLevel: "PROPERTY_VERIFIED" },
  { name: "verticalAlignment", value: "Center", evidenceLevel: "PROPERTY_VERIFIED" },
  { name: "horizontalAlignment", value: "Center", evidenceLevel: "PROPERTY_VERIFIED" },
  { name: "meshShadowMode", value: "None", evidenceLevel: "PROPERTY_VERIFIED" },
  { name: "shadowColor", value: { x: 1, y: 1, z: 1, w: 1 }, evidenceLevel: "PROPERTY_VERIFIED" },
  { name: "shadowDensity", value: 1, evidenceLevel: "PROPERTY_VERIFIED" },
  { name: "renderOrder", value: 0, evidenceLevel: "PROPERTY_VERIFIED" },
  { name: "enabled", value: true, evidenceLevel: "PROPERTY_VERIFIED" },
]);
const material = item("Color Correction", "Material", "2d9e23c3-8f6d-47db-84b5-4fde0fa9c9e1", "Color Correction.mat", [
  { name: "passInfos.0.baseColor.value", value: { x: 1, y: 1, z: 1, w: 1 }, evidenceLevel: "PROPERTY_VERIFIED" },
  { name: "passInfos.0.baseTex.value", value: "@asset:Beauty.png", evidenceLevel: "PROPERTY_VERIFIED" },
  { name: "passInfos.0.screenTexture.value", value: "@asset:ScreenTexture.screenTexture", evidenceLevel: "PROPERTY_VERIFIED" },
  { name: "passInfos.0.Port_Input2_N011", value: 1, evidenceLevel: "PROPERTY_VERIFIED" },
  { name: "passInfos.0.PreviewEnabled", value: 0, evidenceLevel: "PROPERTY_VERIFIED" },
  { name: "passInfos.0.ENABLE_OPACITY_TEX", value: false, evidenceLevel: "PROPERTY_VERIFIED" },
  { name: "passInfos.0.USE_LEGACY_512_TEXTURE", value: false, evidenceLevel: "PROPERTY_VERIFIED" },
  { name: "passInfos.0.depthWrite", value: false, evidenceLevel: "PROPERTY_VERIFIED" },
  { name: "passInfos.0.depthTest", value: false, evidenceLevel: "PROPERTY_VERIFIED" },
  { name: "passInfos.0.blendMode", value: "Disabled", evidenceLevel: "PROPERTY_VERIFIED" },
]);
const shader = item("color_correction", "ShaderGraphPass", "5c72ee49-8981-43eb-8703-0c4ca48dc125", "color_correction.graphShader", [
  { name: "verified nodes", value: ["LUT 3D", "Screen UV Coord", "Texture 2D Sample", "Mix", "Legacy 512 Texture Mapping", "Shader: Post Effect"], evidenceLevel: "PROPERTY_VERIFIED" },
]);
const beautyTexture = item("Beauty", "FileTexture", "84b30194-69be-414d-9d2d-7490226d296c", "Beauty.png", [
  { name: "width", value: 256, evidenceLevel: "PROPERTY_VERIFIED" },
  { name: "height", value: 16, evidenceLevel: "PROPERTY_VERIFIED" },
]);
const screenTexture = item("ScreenTexture", "ScreenTexture", "f880dfe1-d2be-4d13-9ef4-145f6aff0d0f", "ScreenTexture.screenTexture");

export const beautyPresetPatternCard: PatternCard = {
  id: "pattern-scene-preset-beautypreset-deep",
  name: "BeautyPreset pattern",
  source: "LOCAL_OFFICIAL_RESOURCE",
  officialResourceName: "BeautyPreset",
  officialResourceType: "TEMPLATE",
  categories: ["Beauty"],
  supportedPlatforms: ["Snapchat"],
  learningObjective: "PostEffectVisual with Beauty LUT",
  sceneStructure: objects.map(observed),
  importantObjects: objects.map(observed),
  importantComponents: [observed(component)],
  importantAssets: [observed(beautyTexture), observed(screenTexture), observed(shader)],
  importantMaterials: [observed(material)],
  importantScripts: [],
  importantProperties: [...(component.properties ?? []).map((property) => ({ target: component.name, property: property.name, currentValue: property.value, evidenceSource: evidence })), ...(material.properties ?? []).map((property) => ({ target: material.name, property: property.name, currentValue: property.value, evidenceSource: evidence }))],
  interactions: ["UNKNOWN"],
  triggers: ["UNKNOWN"],
  technicalNotes: ["BeautyPreset created an Effects object and a Beauty child object.", "The Beauty child has one PostEffectVisual component in the editor scene.", "The material references Beauty.png and ScreenTexture.screenTexture."],
  knownConstraints: ["The runtime query exposed the Beauty object but did not expose its editor PostEffectVisual component."],
  qualityNotes: ["A preview was captured. Visual QA was not run."],
  reusablePrinciples: ["A post-effect can reference a material that samples the screen texture and a 256 by 16 LUT texture."],
  unsafeAssumptions: ["Do not infer the visual meaning of undocumented parameter Port_Input2_N011.", "Do not infer behavior from editor object names."],
  confidence: "MEDIUM",
  inspectedAt: observedAt,
  inspectionLevel: "DEEPLY_INSPECTED",
  categoryInferences: ["Beauty", "Camera / Colour"],
  fieldEvidence: { officialResourceName: "METADATA_ONLY", officialResourceType: "METADATA_ONLY", learningObjective: "METADATA_ONLY", sceneStructure: "SCENE_VERIFIED", importantObjects: "SCENE_VERIFIED", importantComponents: "PROPERTY_VERIFIED", importantAssets: "PROPERTY_VERIFIED", importantMaterials: "PROPERTY_VERIFIED", importantScripts: "SCENE_VERIFIED", importantProperties: "PROPERTY_VERIFIED", interactions: "UNKNOWN", triggers: "UNKNOWN", categories: "METADATA_ONLY" },
};

const knowledge = (id: string, capability: string, subjectType: CapabilityKnowledgeEntry["subjectType"], statement: string, operations: string[], componentName: string | null = null, propertyPath: string | null = null): CapabilityKnowledgeEntry => ({ id, capability, subjectType, componentName, propertyPath, supportedOperations: operations, statement, status: "VERIFIED", evidenceSource: evidence, observedAt, lensStudioVersion: "5.23.1.26080420", versionNotes: [], limits: ["Verified only for the inspected Lens Studio version and BeautyPreset instance."] });

export const beautyPresetInspection: DeepPresetInspection = {
  id: "beauty-preset-2026-08-14",
  presetName: "BeautyPreset",
  inspectionLevel: "DEEPLY_INSPECTED",
  capturedAt: observedAt,
  sandbox: { status: "VERIFIED", lensName: "Effect Lab Sandbox", projectFolder: "/Users/debbie/Documents/Effect Lab Training Sandbox", connectionSource: "MANUAL_CONFIG", capabilities: 38, softFlashMarkersAbsentBeforeInstantiation: true, baselineFingerprint: "7cbeeba095c103f4f0f3d48599ceeb69745cb8afe3eae7caced3efc6093753aa", resultFingerprint: "ae35d30e8677ca6ae2993e88d87798f90503634a69256df51c313c195e96eec4" },
  confirmation: { confirmed: true, action: "Instantiate official BeautyPreset for deep inspection.", risk: "The disposable sandbox scene will be modified." },
  instantiation: { success: true, operation: "scene-graphql createSceneObjectFromPreset", returnedId: component.id },
  sceneObjects: objects,
  components: [component],
  assets: [material, shader, beautyTexture, screenTexture],
  materials: [material],
  shaders: [shader],
  textures: [beautyTexture, screenTexture],
  scripts: [],
  dependencies: [
    { from: "Camera Object", to: "Effects", evidenceLevel: "SCENE_VERIFIED" },
    { from: "Effects", to: "Beauty", evidenceLevel: "SCENE_VERIFIED" },
    { from: "Beauty", to: "BeautyPreset Inspection (PostEffectVisual)", evidenceLevel: "PROPERTY_VERIFIED" },
    { from: "BeautyPreset Inspection", to: "Color Correction.mat", evidenceLevel: "PROPERTY_VERIFIED" },
    { from: "BeautyPreset instance", to: "color_correction.graphShader", evidenceLevel: "SCENE_VERIFIED" },
    { from: "Color Correction.mat", to: "Beauty.png", evidenceLevel: "PROPERTY_VERIFIED" },
    { from: "Color Correction.mat", to: "ScreenTexture.screenTexture", evidenceLevel: "PROPERTY_VERIFIED" },
  ],
  runtime: { compile: "PASSED", errors: [], warnings: [], deprecations: [], findings: ["The Lens reset and produced runtime activity.", "The runtime Beauty object was enabled.", "The runtime bridge returned no components for the Beauty object."], behaviorEvidence: "UNKNOWN" },
  previewPath: "/beauty-preset-preview.png",
  patternCardBeforeConfidence: "LOW",
  patternCard: beautyPresetPatternCard,
  knowledge: [
    knowledge("beauty-preset-create", "BeautyPreset instantiation", "OPERATION", "scene-graphql created one BeautyPreset instance in the verified sandbox.", ["createSceneObjectFromPreset"]),
    knowledge("beauty-preset-component", "BeautyPreset scene structure", "COMPONENT", "BeautyPreset created a PostEffectVisual component under Camera Object, Effects, and Beauty.", ["read"], "PostEffectVisual"),
    knowledge("beauty-preset-material", "BeautyPreset material dependency", "PROPERTY", "The PostEffectVisual mainMaterial property references Color Correction.mat.", ["read", "setProperty"], "PostEffectVisual", "mainMaterial"),
    knowledge("beauty-preset-lut", "BeautyPreset LUT dependency", "PROPERTY", "Color Correction.mat baseTex references the 256 by 16 Beauty.png texture.", ["read", "setProperty"], "Material", "passInfos.0.baseTex.value"),
  ],
  remainingUnknown: ["Runtime behavior of the PostEffectVisual component.", "Interactions and triggers.", "The meaning of Port_Input2_N011.", "The visual intent of each shader graph branch."],
  resetStatus: "SAFE_AUTOMATIC_RESET",
  resetReason: "The isolated scene object and four preset-created assets were deleted. The live project fingerprint matches the captured baseline.",
  resetEvidence: { confirmedAt: "2026-08-14T13:13:58.165Z", deletedSceneObjectIds: ["ff43caaa-89f5-4e8a-8c37-3420c2ff1991"], deletedAssetIds: ["2d9e23c3-8f6d-47db-84b5-4fde0fa9c9e1", "5c72ee49-8981-43eb-8703-0c4ca48dc125", "84b30194-69be-414d-9d2d-7490226d296c", "f880dfe1-d2be-4d13-9ef4-145f6aff0d0f"], baselineRestored: true },
  lensStudioModified: false,
};
