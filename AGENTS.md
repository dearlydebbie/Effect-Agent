# Instructions for future Codex sessions

## Product rules

Effect Lab is an AI-assisted AR effect creation system. It is not a social media management or spam tool. Keep the workflow focused on research, ideas, approval, build, test, review, publishing preparation, performance, and learning.

## Architecture

Keep UI routes in `app`, UI components in `components`, domain logic in `services`, AI contracts in `agents`, and platform-specific behavior in `adapters`. Depend on interfaces at external boundaries. Keep the product name in `config/product.ts`.

Use TypeScript. Prefer small modules, explicit types, accessible controls, and tests for domain rules. Do not move platform or AI logic into React components.

## Public language

All text shown inside an effect or Lens must follow Simplified Technical English principles. Use short sentences, simple words, active voice, and one instruction per sentence. Validate public text through `STEValidationService`. Do not apply STE limits to source code, logs, database fields, or internal developer documents.

## Platform integrity

Keep Snapchat and TikTok separate. Do not invent MCP tool names, APIs, analytics, or platform capabilities. Discover Lens Studio MCP capabilities at runtime and map only capabilities that the connected server exposes. If Lens Studio is closed or unavailable, fail safely.

Prefer `pbpaste | npm run lens:sync:manual:sandbox` to import the copied Lens Studio MCP config through stdin. Disk discovery is optional and every endpoint must pass live MCP and project-identity checks. Never copy the authorization value into source, logs, tests, documentation, command arguments, or client responses. `.env.local` must stay ignored. The endpoint and token can change when Lens Studio restarts.

Keep Lens recipes in the orchestrator layer. Before a mutation, validate the specification, test the connection, discover the tools again, and require explicit human confirmation. Use only exact names returned by `tools/list`. Keep retries bounded. Store structured logs. Stop at human review. Never add a publish or submit operation.

TikTok V1 only creates Effect House build packs. Do not claim direct Effect House control. Never use browser automation, scraping, or simulated clicks to bypass a platform rule.

## Data integrity and approval

Unknown metrics must stay `null`. Label seeded and generated metrics as demo data. Do not claim a score predicts virality. Use “Potential score.” Do not infer autonomous optimisation from small or missing datasets.

Never present fake data as live. Production mode must not use demo data or mock providers. A missing integration returns `UNAVAILABLE`. Preserve genuine historical records. Keep demo and test fixtures isolated. STE applies to public-facing UI language.

A person must approve every effect before submission. Never publish automatically in V1. Never bypass moderation or account actions that require human approval.

## Creative and quality separation

Keep Research, Idea, Critic, Creative Director, Lens Builder, Technical QA, Visual QA, Experience QA, and Performance Analyst responsibilities separate. A successful compile is not a visual-quality decision. Do not infer visual quality from scene structure or code. Visual QA must receive an actual preview image through a `VisionProvider`. If no real vision provider is configured, return `UNAVAILABLE` and keep all visual scores null. Label mock visual results as mock.

Apply category-specific criteria. Beauty defaults preserve identity, face shape, natural skin texture, believable light, and controlled highlights. Do not apply beauty rules to games, randomisers, humour, world AR, or fantasy unless their approved concept requires them.

Select vision providers from server-only configuration. Use `OPENAI_API_KEY`, `OPENAI_VISION_MODEL`, `VISION_QA_ENABLED`, and `VISION_QA_MAX_ITERATIONS`. Never expose, print, return, or commit the API key. A real provider must analyse the actual Lens Studio preview and validate structured output locally. It must not substitute a thumbnail, scene graph, or specification when the preview is missing.

Cache Visual QA by preview image, creative brief, build specification, and model. Manual re-analysis may bypass this cache. Never call a paid vision provider unless Visual QA is enabled and the user requests the analysis. Keep API retries at two or fewer. API, timeout, or validation failure returns `UNAVAILABLE`; it does not become a passing assessment.

Before proposing any visual iteration operation, run the Technical Iteration Planner against the current Lens Studio project. Identify the real scene object, component or asset, property path, and readable current value. Never infer the meaning of an unlabelled shader or material parameter. Use `READY` only for fully grounded supported operations. Use `NEEDS_HUMAN_INPUT`, `UNSUPPORTED`, or `UNKNOWN` when evidence is incomplete. Store a baseline for comparison, but do not claim rollback unless an implemented rollback path has been verified.

Visual findings must cite visible evidence and must not guess implementation causes. Keep static-preview limitations explicit. Human judgement remains authoritative, and disagreement feedback does not automatically retrain or change prompts.

Automatic visual iteration is limited to three attempts and requires the existing human confirmation gate before a Lens Studio mutation. Stop after two consecutive attempts without meaningful improvement. Record proposed changes before applying them. Limit changes to the identified problem. Never delete user content without explicit permission.

## Template Learning Mode

Learning Lab may learn automatically only from resources classified as `OFFICIAL_SNAP` or `LOCAL_OFFICIAL_RESOURCE`. Do not scrape public Lenses. Do not copy a public or official creative concept. Do not treat a user project or an unknown package as automatic training material.

Discover resource capabilities at runtime. Use only supported read-only MCP calls for discovery and inspection. Do not infer scene structure, components, assets, materials, scripts, graphs, properties, interactions, or quality from a title or description. Store missing facts as `UNKNOWN`. Keep the exact evidence source on every Pattern Card and capability claim.

A curriculum slot is not a completed exercise. Create an exercise only from an inspected eligible Pattern Card. Run the originality guard against official resources, earlier exercises, and the local library. `TOO_SIMILAR` cannot build. Require a complete Lens Build Specification and human confirmation before any mutation. Keep compile, Visual QA, Experience QA, and human review as separate evidence. Never publish from Learning Lab.

Every completed exercise defaults to `TRAINING_ONLY`. Apply the configurable publish-candidate gate without claiming programme eligibility, reward status, performance, or earnings. Without real evidence, reward suitability stays `UNKNOWN`.

Preset census records must preserve the exact Lens Studio name and raw metadata. Category and purpose classifications must retain `EXPLICIT_METADATA`, `INFERENCE`, or `UNKNOWN`; never promote inferred taxonomy to verified implementation knowledge. Advance inspection levels only when the corresponding metadata, scene, property, or behaviour evidence exists.

Review the representative first-wave set before any mutation. Read-only metadata inspection may run against the connected project. Preset instantiation may run only when the live Lens name is `Effect Lab Sandbox` and the exact saved project path is `/Users/debbie/Documents/Effect Lab Training Sandbox`. Require a live MCP response, no Soft Flash markers, and a captured fingerprint. Confirm the exact preset each time. If a safe reset is not verified, stop and request a manual reset. Never clean, reset, or delete a normal user project.

## Extending agents

Add a provider implementation for the relevant interface in `agents/providers.ts`. Keep credentials in server-only environment variables. Retain a mock implementation so the app works without keys. Add contract tests before selecting the provider in configuration.

## Adding platform adapters

Implement `PlatformAdapter` in `adapters/platform-adapter.ts`. Define a platform-specific output type. Return safe connection errors. Keep submission outside the adapter in V1. Add tests proving that automatic publishing is disabled.
