import type { ControlledBuildState } from "../types/build-state";

export const naturalBeautyProjectIdentityFingerprint = "9f71141d7e38d9d4e5ff605d2a6f5ac5c19b918683fb2d881eb60b7dc5135af3";

export function naturalBeautyBuildState(gradeEnabled: boolean): ControlledBuildState {
  return {
    buildId: "learning-build-001-natural-beauty",
    objects: [
      {
        id: "95954e47-3175-4685-a1a6-93e78436c207",
        components: [{
          id: "ea8d555f-5f9d-4e8a-bb65-1769008c0d9e",
          type: "PostEffectVisual",
          enabled: gradeEnabled,
          properties: {},
          assetAssignments: {
            mainMaterial: "9984c94e-8f7a-4198-a59b-e4f8d061ed7c",
            materials0: "9984c94e-8f7a-4198-a59b-e4f8d061ed7c",
            lutTexture: "8da2358c-e0d0-4b1c-a475-07948c97f36d",
          },
        }],
      },
      {
        id: "3e2b87d4-94cf-41c1-88be-2a08ac2117e8",
        components: [{
          id: "ac14ad83-f8b6-4187-a0cc-8ab272902e37",
          type: "RetouchVisual",
          enabled: true,
          properties: { faceIndex: 0, softSkinIntensity: 0.25, teethWhiteningIntensity: 0.1, sharpenEyeIntensity: 0.2, eyeWhiteningIntensity: 0.08 },
          assetAssignments: {},
        }],
      },
    ],
    assets: [
      { id: "9984c94e-8f7a-4198-a59b-e4f8d061ed7c", type: "Material", assignment: "Natural Beauty Colour Material.mat" },
      { id: "8da2358c-e0d0-4b1c-a475-07948c97f36d", type: "FileTexture", assignment: "Natural Beauty LUT.png" },
    ],
  };
}

export const naturalBeautyIteration0BuildStateFingerprint = "e2eeda752dbc9a353d0adb56719314007a94660d1aca21fa536d3d4b4d0e6848";
export const naturalBeautyIteration1BuildStateFingerprint = "9ca89d283226bc9a448e16df80c0cc7d33792aad5fce7b0c53b450f1682829dd";
