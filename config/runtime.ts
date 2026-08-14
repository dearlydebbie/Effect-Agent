export type EffectLabMode = "production" | "development" | "test";

export interface RuntimePolicy {
  mode: EffectLabMode;
  demoDataEnabled: boolean;
}

export function runtimePolicy(environment: Record<string, string | undefined>): RuntimePolicy {
  const requested = environment.EFFECT_LAB_MODE;
  const mode: EffectLabMode = requested === "development" || requested === "test" || requested === "production" ? requested : "production";
  return { mode, demoDataEnabled: mode === "development" && environment.ENABLE_DEMO_DATA === "true" };
}

