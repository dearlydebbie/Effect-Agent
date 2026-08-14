import { validateSTE } from "./ste-validator";
import { LensStudioConnectionService, type LensStudioToolResult } from "./lens-studio-connection";
import type { LensBuildLog, LensBuildOperation, LensBuildPlan, LensBuildReport, LensBuildSpecification } from "../types/lens-build";
import { classifyRuntimeLogs } from "./runtime-log-classifier";

const SOFT_FLASH_PRESET = "BlownWhitePreset";
const SOFT_FLASH_OBJECT = "Soft Flash Treatment";

export interface OrchestratorOptions { maxRepairAttempts?: number; now?: () => Date }

export class SnapchatLensBuildOrchestrator {
  private readonly maxRepairAttempts: number;
  private readonly now: () => Date;

  constructor(private readonly connection: LensStudioConnectionService, options: OrchestratorOptions = {}) {
    this.maxRepairAttempts = Math.min(2, Math.max(0, options.maxRepairAttempts ?? 2));
    this.now = options.now ?? (() => new Date());
  }

  validateSpecification(specification: LensBuildSpecification) {
    const errors: string[] = [];
    if (!specification.id.trim()) errors.push("The specification needs an ID.");
    if (!specification.title.trim()) errors.push("The specification needs a title.");
    if (specification.targetPlatform !== "Snapchat") errors.push("The Snapchat orchestrator only accepts Snapchat specifications.");
    for (const requirement of specification.textRequirements) {
      const report = validateSTE(requirement.text);
      if (!report.valid) errors.push(`Public text failed STE validation: ${requirement.text}`);
    }
    if (!specification.qaRequirements.length) errors.push("The specification needs QA requirements.");
    return { valid: errors.length === 0, errors };
  }

  async createPlan(specification: LensBuildSpecification): Promise<LensBuildPlan> {
    const validation = this.validateSpecification(specification);
    const connection = await this.connection.testConnection();
    const operationDefinitions: Array<Omit<LensBuildOperation, "supported">> = [
      { id: "inspect-runtime", label: "Inspect current Lens Studio state", toolName: "QueryRuntimeSceneTool", purpose: "Read the current runtime scene before changing it.", required: true, arguments: { query: "{ sceneRoots { summary descendantsTree(maxDepth: 3) } }", timeoutMs: 10000 } },
      { id: "inspect-preset", label: "Confirm the soft flash preset", toolName: "scene-graphql", purpose: "Confirm the discovered built-in preset before use.", required: true, arguments: { query: `{ preset(presetName:"${SOFT_FLASH_PRESET}") { name description entityType section } }` } },
      { id: "create-treatment", label: "Create the soft flash treatment", toolName: "scene-graphql", purpose: "Create one post-effect object from the confirmed Lens Studio preset.", required: true, arguments: { query: `mutation { createSceneObjectFromPreset(presetName:"${SOFT_FLASH_PRESET}", name:"${SOFT_FLASH_OBJECT}") { success message id } }` } },
      { id: "compile", label: "Compile TypeScript", toolName: "RecompileTypeScriptTool", purpose: "Verify that project TypeScript compiles.", required: true, arguments: {} },
      { id: "runtime-logs", label: "Inspect runtime logs", toolName: "RunAndCollectLogsTool", purpose: "Refresh the preview and collect runtime errors.", required: true, arguments: { mode: "refresh", timeoutMs: 10000, settleMinMs: 600, settleQuietMs: 200, settleMaxMs: 1500 } },
      { id: "runtime-qa", label: "Inspect the resulting scene", toolName: "QueryRuntimeSceneTool", purpose: "Verify the post-effect object exists in the running scene.", required: true, arguments: { query: "{ sceneRoots { summary descendantsTree(maxDepth: 3) } }", timeoutMs: 10000 } },
      { id: "preview-qa", label: "Capture the Lens preview", toolName: "PreviewPanelTool", purpose: "Verify that the Lens preview renders.", required: true, arguments: { action: "screenshot", detail: "low", includeChrome: false } },
    ];
    const operations = operationDefinitions.map((operation) => ({ ...operation, supported: connection.state === "CONNECTED" && this.connection.supports(operation.toolName) }));
    const limitations = [...validation.errors];
    if (connection.state !== "CONNECTED") limitations.push(connection.message);
    for (const operation of operations.filter((item) => item.required && !item.supported)) limitations.push(`Required capability is unavailable: ${operation.toolName}.`);
    return {
      buildId: `build-${specification.id}`,
      lensTitle: specification.title,
      summary: "Create one built-in colour-correction post effect. Compile the project. Inspect runtime logs. Verify the preview.",
      operations, limitations, humanConfirmationRequired: true,
    };
  }

  async build(specification: LensBuildSpecification, confirmed: boolean): Promise<LensBuildReport> {
    const plan = await this.createPlan(specification);
    const logs: LensBuildLog[] = [];
    const warnings: string[] = [...plan.limitations];
    const errors: string[] = [];
    const deprecations: string[] = [];
    const completed: string[] = [];
    const log = (level: LensBuildLog["level"], step: string, message: string, toolName?: string) => logs.push({ timestamp: this.now().toISOString(), level, step, message, toolName });
    log("AGENT", "plan", plan.summary);

    if (!confirmed) {
      log("WARNING", "confirmation", "The build is waiting for specification confirmation.");
      return this.report(specification, "WAITING", completed, warnings, errors, deprecations, "NOT_RUN", "NOT_RUN", null, logs);
    }
    if (plan.limitations.length || plan.operations.some((operation) => operation.required && !operation.supported)) {
      log("WARNING", "connection", "The build is waiting for Lens Studio.");
      return this.report(specification, "WAITING", completed, warnings, errors, deprecations, "NOT_RUN", "NOT_RUN", null, logs);
    }

    log("INFO", "build", "The confirmed build started.");
    let compileResult: LensBuildReport["compileResult"] = "NOT_RUN";
    let qaResult: LensBuildReport["qaResult"] = "NOT_RUN";
    let previewDataUrl: string | null = null;
    let runtimeSnapshot = "";

    for (const operation of plan.operations) {
      if (operation.id === "create-treatment" && runtimeSnapshot.includes(SOFT_FLASH_OBJECT)) {
        const message = "The soft flash treatment already exists. Creation was skipped.";
        warnings.push(message); log("WARNING", operation.label, message, operation.toolName); continue;
      }
      log("INFO", operation.label, `Calling ${operation.toolName}.`, operation.toolName);
      try {
        const result = await this.connection.callSupportedTool(operation.toolName, operation.arguments ?? {});
        const text = toolText(result);
        if (result.isError) throw new Error(text || `${operation.toolName} returned an error.`);
        if (operation.id === "inspect-runtime") runtimeSnapshot = text;
        if (operation.id === "compile") {
          compileResult = /failed/i.test(text) ? "FAILED" : "PASSED";
          if (compileResult === "FAILED") {
            let repaired = false;
            for (let attempt = 1; attempt <= this.maxRepairAttempts; attempt++) {
              log("AGENT", "safe-repair", `Retrying compilation. Attempt ${attempt} of ${this.maxRepairAttempts}.`, operation.toolName);
              const retry = await this.connection.callSupportedTool(operation.toolName, {});
              if (!retry.isError && !/failed/i.test(toolText(retry))) { repaired = true; compileResult = "PASSED"; break; }
            }
            if (!repaired) throw new Error("TypeScript compilation failed after the allowed retries.");
          }
        }
        if (operation.id === "runtime-logs") {
          const runtime = parseNestedJson(text);
          const runtimeEntries = findArray(runtime, "errors").map(toLogMessage);
          const classified = classifyRuntimeLogs(runtimeEntries);
          deprecations.push(...classified.filter((item) => item.classification === "DEPRECATION").map((item) => item.message));
          warnings.push(...classified.filter((item) => item.classification === "WARNING").map((item) => item.message));
          const runtimeErrors = classified.filter((item) => item.classification === "ERROR");
          if (runtimeErrors.length) throw new Error(`Runtime logs contain ${runtimeErrors.length} error entries.`);
        }
        if (operation.id === "runtime-qa") qaResult = text.includes(SOFT_FLASH_OBJECT) ? "PASS" : "FAIL";
        if (operation.id === "preview-qa") previewDataUrl = toolImageDataUrl(result);
        completed.push(operation.label);
        log("SUCCESS", operation.label, `${operation.label} completed.`, operation.toolName);
      } catch (error) {
        const message = error instanceof Error ? error.message : "The Lens Studio operation failed.";
        errors.push(message); log("ERROR", operation.label, message, operation.toolName);
        return this.report(specification, "FAILED", completed, warnings, errors, deprecations, compileResult, qaResult, previewDataUrl, logs);
      }
    }

    return this.report(specification, "NEEDS_REVIEW", completed, warnings, errors, deprecations, compileResult, qaResult, previewDataUrl, logs);
  }

  private report(specification: LensBuildSpecification, status: LensBuildReport["status"], operationsCompleted: string[], warnings: string[], errors: string[], deprecations: string[], compileResult: LensBuildReport["compileResult"], qaResult: LensBuildReport["qaResult"], previewDataUrl: string | null, logs: LensBuildLog[]): LensBuildReport {
    const technicalQA = compileResult === "PASSED" && !errors.length ? "PASS" : compileResult === "FAILED" || errors.length ? "FAIL" : "UNKNOWN";
    const specificationQA = qaResult === "PASS" ? "PASS" : qaResult === "FAIL" ? "FAIL" : "UNKNOWN";
    return {
      buildId: `build-${specification.id}`, lensTitle: specification.title, status,
      operationsCompleted, assetsUsed: specification.assetRequirements.map((asset) => asset.name),
      scriptsCreated: specification.scriptRequirements.map((script) => script.name), compileResult,
      warnings, errors, qaResult, technicalQA, specificationQA, visualQA: "UNAVAILABLE", experienceQA: "UNKNOWN",
      deprecations, previewDataUrl, humanReviewRequired: true, timestamp: this.now().toISOString(), logs,
    };
  }
}

function toolText(result: LensStudioToolResult) { return (result.content ?? []).filter((item) => item.type === "text").map((item) => item.text ?? "").join("\n"); }
function parseNestedJson(text: string): unknown { try { const outer = JSON.parse(text) as { data?: unknown }; return outer.data ?? outer; } catch { return null; } }
function findArray(value: unknown, key: string): unknown[] { if (!value || typeof value !== "object") return []; const record = value as Record<string, unknown>; if (Array.isArray(record[key])) return record[key] as unknown[]; for (const child of Object.values(record)) { const found = findArray(child, key); if (found.length) return found; } return []; }
function toLogMessage(value: unknown) { if (typeof value === "string") return value; if (value && typeof value === "object" && "message" in value) return String((value as { message: unknown }).message); return JSON.stringify(value); }
function toolImageDataUrl(result: LensStudioToolResult) { const image = (result.content ?? []).find((item) => item.type === "image" && item.data); if (image?.data) return `data:${image.mimeType ?? "image/jpeg"};base64,${image.data}`; for (const item of result.content ?? []) { if (item.type !== "text" || !item.text) continue; try { const value = JSON.parse(item.text) as { screenshot?: { image_url?: { url?: string } } }; if (value.screenshot?.image_url?.url?.startsWith("data:image/")) return value.screenshot.image_url.url; } catch { /* The tool can return plain text. */ } } return null; }
