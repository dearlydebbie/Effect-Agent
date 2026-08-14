# Effect Lab

Effect Lab is a local-first workspace for researching, designing, building, testing, reviewing, and learning from AR effects for Snapchat and TikTok.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed in the terminal. No API key is required. The normal interface uses real local records and clear unavailable states when an integration is absent.

The default mode is production. Add these values only when you need explicit interface development data:

```bash
EFFECT_LAB_MODE=development
ENABLE_DEMO_DATA=true
```

Open **Learning Lab** to discover and inspect eligible official Lens Studio resources. If Lens Studio MCP is unavailable, the page shows an honest empty state and creates no substitute resources.

Learning Lab includes a Preset Library census and a proposed 20-preset read-only inspection wave. Category labels are metadata inference. Scene inspection remains blocked until you open and confirm the disposable Lens named `Effect Lab Sandbox`. The saved project must stay in `/Users/debbie/Documents/Effect Lab Training Sandbox`.

## Connect Lens Studio

Open a project in Lens Studio. Then run:

```bash
pbpaste | npm run lens:sync:manual:sandbox
npm run dev
```

For a reliable sandbox connection, copy the MCP config from Lens Studio and run `pbpaste | npm run lens:sync:manual:sandbox`. The config is read from stdin. The token does not enter shell history or browser code. The command saves verified credentials in ignored `.env.local` with owner-only permissions. Restart the app after each sync.

## Verify

```bash
npm run lint
npm test
npm run build
```

## Current boundaries

- Snapchat connects to the official local Lens Studio MCP server and discovers its capabilities at runtime. The first controlled recipe is `Soft Flash Test`.
- A confirmed Snapchat build can change the open Lens Studio project. It stops at human review and never publishes.
- Creative Direction now precedes the build specification. Technical, specification, visual, and experience QA remain separate.
- Lens Studio previews can be captured for review. Visual QA is `UNAVAILABLE` unless a real vision provider is configured; null scores are preserved.
- Human decisions and optional feedback are stored locally with the build.

## OpenAI Visual QA

Visual QA can use the official OpenAI Responses API with the actual Lens Studio preview image. The default model is `gpt-5.6-terra` and can be changed without changing business logic.

Add these server-only values to `.env.local`:

```bash
OPENAI_API_KEY="your-key"
OPENAI_VISION_MODEL="gpt-5.6-terra"
VISION_QA_ENABLED="true"
VISION_QA_MAX_ITERATIONS="3"
```

Restart Effect Lab. Open a Studio job and select **Capture and analyse preview**. Set `VISION_QA_ENABLED=false` to disable paid visual analysis. The UI reports `REAL`, `MOCK`, or `UNAVAILABLE` and displays the active model. The key is never returned to the browser.

Identical preview, creative brief, build specification, and model combinations reuse an in-memory result. Select **Re-analyse** to deliberately bypass the cache. Requests time out, retry at most twice, and return `UNAVAILABLE` after API or schema-validation failure.

When Visual QA recommends an iteration, select **Inspect Lens Studio** to create a Technical Iteration Plan. The planner reads the live hierarchy, the real `PostEffectVisual`, material references, texture references, and readable values through the connected MCP server. Each recommendation is marked `READY`, `NEEDS_HUMAN_INPUT`, `UNSUPPORTED`, or `UNKNOWN`. It never turns an undocumented property into a guessed edit. The Iteration 0 baseline is stored locally with the plan for later before-and-after reporting. A stored baseline is not an automatic rollback mechanism.

The implementation follows the official [OpenAI image-input guide](https://developers.openai.com/api/docs/guides/images-vision) and [structured-output guide](https://developers.openai.com/api/docs/guides/structured-outputs).
- TikTok exports a complete Effect House build pack. It does not control Effect House.
- A person must approve every effect before submission.
- Learning Lab has a 100-slot curriculum, evidence-based Pattern Cards, originality gates, and local Learning Records. Curriculum slots are not fake completed exercises.
- Template learning accepts only verified official Snap or local official Lens Studio resources. User projects and unknown packages are not automatic learning sources.
- Trend research is unavailable until a real provider is connected.
- Unknown analytics values stay `null` in the data model.

## Lens Studio sandbox sync

Run `pbpaste | npm run lens:sync:manual:sandbox` while the saved training project is open. The command requires the live Lens name `Effect Lab Sandbox`, the exact saved project path `/Users/debbie/Documents/Effect Lab Training Sandbox`, no Soft Flash markers, a live MCP response, and a captured project fingerprint. It does not modify the scene.
- V1 idea decisions persist in device-local browser storage through the repository abstraction. The portable SQLite schema is in `database/schema.sql` for the next persistence step.

See `docs/LENS_STUDIO_MCP.md`, `docs/LEARNING_LAB.md`, `ARCHITECTURE.md`, `ROADMAP.md`, and `AGENTS.md` for extension guidance.
