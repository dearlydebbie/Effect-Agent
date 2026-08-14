import { naturalBeautyBuildState } from "../data/natural-beauty-build-state";
import { createBuildStateFingerprint } from "../services/build-state-fingerprint";

console.log(JSON.stringify({
  iteration0: await createBuildStateFingerprint(naturalBeautyBuildState(true)),
  iteration1: await createBuildStateFingerprint(naturalBeautyBuildState(false)),
}, null, 2));
