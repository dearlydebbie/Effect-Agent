# Effect Lab architecture

## Shape

The UI uses the Next.js App Router, React, TypeScript, and Tailwind CSS. Product logic stays outside React:

- `app/`: routes and metadata
- `components/`: product UI
- `agents/`: replaceable AI provider contracts and demo providers
- `adapters/`: platform boundaries for Snapchat and TikTok
- `services/`: scoring, STE, QA, duplicate detection, status transitions, persistence contracts
- `types/`: domain types and taxonomy
- `config/`: changeable product name and thresholds
- `database/`: portable SQLite schema

## Data and providers

`EffectLabRepository` is the persistence boundary. V1 uses device-local browser storage for real idea, performance, and earning records. A memory adapter supports tests. `database/schema.sql` defines the intended local SQLite shape. A later SQLite or Postgres implementation must conform to the same interface.

`EFFECT_LAB_MODE` defaults to `production`. Production never uses demo records or mock providers. Development data requires `ENABLE_DEMO_DATA=true`. Test fixtures remain isolated. The current browser profile and origin are the runtime source of truth; the SQL schema is not yet active storage.

Every AI capability has its own provider interface. This avoids one global model dependency. Keys belong in server-only environment variables.

Creative quality uses separate roles and records: the Creative Director converts an approved idea into category-aware direction; the Lens Builder executes a confirmed specification; technical, specification, visual, and experience QA return independent states; and human review remains a separate final gate. `VisionProvider` receives the real captured preview on the server. Without a configured provider, Visual QA returns `UNAVAILABLE` with null scores. The development mock is explicitly labelled and is never presented as real image analysis.

`OpenAIVisionProvider` is a server-only `VisionProvider` implementation. It uses the official OpenAI SDK, Responses API image input, and Zod-backed structured outputs. Provider selection is environment-driven and reports `REAL`, `MOCK`, or `UNAVAILABLE`. The Visual QA agent contains no OpenAI-specific business logic.

The provider hashes the actual preview, Creative Director brief, build specification, and configured model. An unchanged combination reuses the in-memory result. Manual re-analysis bypasses the cache. Calls occur only after the user requests preview analysis. Disabled analysis, missing previews, missing keys, timeouts, API failures, and invalid responses return `UNAVAILABLE`. Retries are capped at two.

`VisualIterationService` retains the bounded iteration-count and improvement rules. The default limit is three visual iterations, and the service stops after two consecutive attempts without meaningful improvement. Iteration previews, scores, changes, QA states, and human feedback have portable SQLite tables; V1 UI records use local browser storage.

`TechnicalIterationPlanner` is the required bridge between a visual recommendation and a Lens Studio operation. `LensStudioTechnicalInspector` uses discovered MCP capabilities to read the live scene, resolve the editor component and asset chain, and store readable baseline values. A proposal becomes `READY` only when a real target, property, current value, and supported operation are known. Unlabelled parameters and incomplete links remain `UNKNOWN`, `UNSUPPORTED`, or `NEEDS_HUMAN_INPUT`. The confirmation view records intent only in this milestone; it does not execute MCP mutations.

Human agreement or disagreement with an AI visual assessment is stored as review evidence. It does not change prompts, train a model, or trigger a Lens modification.

## Platform separation

`LensStudioConnectionService` owns the authenticated, server-only Streamable HTTP MCP transport. It implements the standard initialize, initialized notification, tool discovery, and tool-call flow. It accepts loopback endpoints only. The authorization value never crosses the API route into client code.

`SnapchatAdapter` reports the runtime-discovered capability names. `SnapchatLensBuildOrchestrator` validates a strongly typed specification and builds a plan only from capabilities reported by the connected server. `DefaultSnapchatLensBuilderAgent` is the replaceable agent boundary. The first recipe, `Soft Flash Test`, uses the exact capabilities discovered from Lens Studio 5.23.1 during this milestone. A missing capability blocks the build safely.

The orchestrator is intentionally bounded. It inspects the scene, confirms a built-in preset, creates one treatment, compiles, reads runtime logs, checks the runtime scene, and captures a preview. Repair is limited to two compile retries. It produces structured logs and stops at `NEEDS_REVIEW`.

Runtime messages are classified as `ERROR`, `WARNING`, `DEPRECATION`, or `INFO`. Deprecations are recorded in the report and do not turn a successful compile into a failure. Replacements must come from capabilities or documentation exposed by Lens Studio; never guess them.

`TikTokAdapter` produces Markdown and JSON build packs. It does not assume a public Effect House API or MCP server. It cannot publish.

## Learning Lab

`LensStudioLearningAdapter` is a read-only platform boundary. It discovers exact MCP capabilities at runtime and uses supported resource queries only. The initial path reads the local built-in preset index through `scene-graphql`. It classifies those records as `LOCAL_OFFICIAL_RESOURCE`. Packages or resources without explicit authority remain `UNKNOWN` and cannot enter automatic learning.

Pattern Cards preserve the inspection evidence and use `UNKNOWN` for components, assets, scripts, properties, interactions, or constraints that the MCP response does not expose. A resource list is not enough to claim a detailed pattern. `TrainingExerciseService` creates a constrained original exercise draft from an eligible card. `OriginalityGuard` compares the draft with official resources, prior exercises, and local ideas. `evaluateLearningBuild` blocks unconfirmed, incomplete, unverified, or non-original work before the Lens Builder boundary.

`CapabilityKnowledgeBase` requires Lens Studio or official Snap evidence for `VERIFIED` entries. `PatternRetrievalService` can retrieve relevant verified observations for future Lens Builder planning, but retrieved patterns are evidence, not creative source material to copy.

Learning data uses `BrowserLearningRepository` in V1. Portable SQLite tables are defined for resources, Pattern Cards, exercises, records, and capability knowledge. Publish-candidate thresholds are configuration, and classification never submits an effect.

The preset census has a separate `BrowserPresetCensusRepository`. It preserves raw MCP metadata, inspection levels, evidence, version association, representative selections, Pattern Card links, and history across rediscovery. Taxonomy classification is explicitly inferential. `RepresentativePresetSelectionService` uses greedy category and technical-signature coverage with near-duplicate exclusion. `training-sandbox-safety.ts` is the hard mutation boundary: no preset instantiation is allowed unless the disposable project, selected preset, human confirmation, and reset path are all verified.

`lens-project-identity.ts` reads the exact Lens name, project paths, scene markers, assets, and a deterministic fingerprint through supported read-only MCP calls. Learning Lab modifications require an exact sandbox identity and an unchanged confirmed fingerprint. A mismatch returns `MISMATCH`; missing evidence returns `UNKNOWN`.

## Approval boundary

Both platform adapters return `false` from `canPublishAutomatically`. A Snapchat specification must be confirmed before any mutation. A job can only move from `READY` to `PUBLISHED` after a recorded human action outside the V1 automation layer.
