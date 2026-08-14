# Production readiness audit

Date: 2026-08-14

## Runtime policy

`EFFECT_LAB_MODE` defaults to `production`. Supported values are `production`, `development`, and `test`. Demo data is available only when mode is `development` and `ENABLE_DEMO_DATA=true`. Tests can select mocks explicitly. Production never falls back to mocks.

## Inventory

### PRODUCTION_FAKE — removed from normal UI

- Overview: six hard-coded workflow totals, fake performance chart, platform totals, activity feed, production-flow totals, recommendations from demo ideas, and estimated earnings.
- Discover: 20 seeded opportunities, fake trend and saturation scores, and a button that reported fake research success.
- Ideas: seeded recent ideas and mock generation presented as an available agent.
- Studio: four demo jobs, one demo TikTok pack, fake job progress, and dead filter and sort controls.
- Library: seeded ideas presented as library records and inactive filter controls.
- Analytics: hard-coded views, uses, shares, category comparison values, learning claims, and inactive import and comparison controls.
- Earnings: four example payouts, platform totals, and a speculative estimate.
- Settings: a green mock-provider status, fake save actions, and review controls that did not persist.
- Shared shell: fake Studio count, fake notification state, and non-working global search.
- Generic Studio detail: fake QA, files, preview, progress, and review actions.

### DEVELOPMENT_ONLY — retained and isolated

- `data/demo-ideas.ts`: 20 explicit demo ideas.
- `agents/mock-providers.ts`: explicit development and test providers.
- `MockVisionProvider`: visual interface development only.
- Development demo data requires two settings: `EFFECT_LAB_MODE=development` and `ENABLE_DEMO_DATA=true`.

### TEST_ONLY — retained

- Fake MCP transports and provider clients under `tests`.
- Demo ideas used as deterministic domain fixtures by adapter, duplicate, and Creative Director tests.
- Mock visual reports used by provider contract tests.

### LEGITIMATE_EMPTY_STATE

- No opportunities because no trend provider is connected.
- No ideas when the local browser repository is empty.
- No analytics when no manual or connected records exist.
- No earnings when no payout is stored.
- No activity when no local event source exists.
- Unavailable TikTok direct automation.
- Disabled global search until a real index exists.

### REAL_DATA — preserved

- Soft Flash Test specification, build record, Visual QA, technical iteration plan, iteration captures, and human feedback.
- Lens Studio MCP connection and capability discovery.
- Lens Studio target identity and live scene and asset markers.
- Learning Lab preset census, representative selection, Pattern Cards, exercises, and capability knowledge stored in this browser.
- Manually created ideas, earnings, and performance records stored in this browser.

## Source of truth

V1 uses browser local storage through repository interfaces. It persists across Effect Lab restarts in the same browser origin and profile. It does not automatically move between ports, browsers, or devices.

- Ideas: `effect-lab-ideas-v1`
- Performance: `effect-lab-performance-v1`
- Earnings: `effect-lab-earnings-v1`
- Learning corpus: `effect-lab-learning-v1`
- Preset census: `effect-lab-preset-census-v1`
- Human feedback: `effect-lab-build-feedback-v1`
- Soft Flash preview and iteration records: build-specific `effect-lab-*` keys

SQLite and D1 schemas are portability targets, not the current runtime source of truth. Hard-coded TypeScript is allowed only for product configuration, genuine controlled test specifications, and explicit development/test fixtures.

Production hides old idea records with `demo: true`. It does not delete them. This preserves uncertain or development history while preventing it from appearing as live data.

## Unavailable production capabilities

- Live trend research
- Real AI idea generation
- Real AI critique
- AI build planning outside configured implementations
- Platform performance ingestion
- Snapchat analytics ingestion
- TikTok analytics ingestion
- TikTok direct Effect House control
- Automatic submission or publishing
- Global search

