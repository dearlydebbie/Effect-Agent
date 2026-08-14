import type { LensBuildPlan, LensBuildReport, LensBuildSpecification } from "../types/lens-build";
import { SnapchatLensBuildOrchestrator } from "../services/snapchat-build-orchestrator";

export interface SnapchatLensBuilderAgent {
  createBuildPlan(specification: LensBuildSpecification): Promise<LensBuildPlan>;
  build(specification: LensBuildSpecification, confirmed: boolean): Promise<LensBuildReport>;
}

export class DefaultSnapchatLensBuilderAgent implements SnapchatLensBuilderAgent {
  constructor(private readonly orchestrator: SnapchatLensBuildOrchestrator) {}
  createBuildPlan(specification: LensBuildSpecification) { return this.orchestrator.createPlan(specification); }
  build(specification: LensBuildSpecification, confirmed: boolean) { return this.orchestrator.build(specification, confirmed); }
}

