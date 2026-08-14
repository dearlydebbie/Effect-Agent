# Learning Lab

Learning Lab is Effect Lab's controlled template-learning mode. It uses official Snap resources, locally available official Lens Studio resources, and facts returned by the connected Lens Studio MCP server. It does not scrape public Lenses, copy creative concepts, or treat user projects as automatic training material.

## Evidence boundary

Every discovered resource has one source classification:

- `OFFICIAL_SNAP`
- `LOCAL_OFFICIAL_RESOURCE`
- `USER_PROJECT`
- `UNKNOWN`

Only the first two classifications are eligible for automatic inspection and learning. Installed packages remain `UNKNOWN` unless their authority is explicit in supported metadata. Unknown facts stay `UNKNOWN` in Pattern Cards.

Discovery is read-only. It uses exact names from runtime MCP capability discovery. The initial adapter can list and inspect the built-in preset registry through `scene-graphql`. It reports other resource paths as available, unavailable, or requiring a focused query. It does not run broad Asset Library or knowledge-base searches without a defined query.

## Preset census

The Preset Library stores the exact name and raw metadata returned by Lens Studio for every built-in preset. Category and likely-purpose values include an authority label: `EXPLICIT_METADATA`, `INFERENCE`, or `UNKNOWN`. Inferred taxonomy is useful for coverage planning but never becomes verified implementation knowledge.

Inspection progresses through `DISCOVERED`, `METADATA_INSPECTED`, `SCENE_INSPECTED`, and `DEEPLY_INSPECTED`. It advances only when matching evidence is stored. Each record retains its Lens Studio version, Pattern Card links, and inspection history.

`RepresentativePresetSelectionService` selects the first read-only wave by category coverage, reusable metadata-described concepts, beauty coverage, interaction and tracking variety, and technical-signature diversity. It excludes near-duplicate metadata patterns rather than increasing the count artificially.

The first-wave action runs targeted read-only `scene-graphql` inspections. It does not add presets to the scene. Pattern Card fields are labelled `METADATA_ONLY`, `SCENE_VERIFIED`, `PROPERTY_VERIFIED`, `BEHAVIOUR_VERIFIED`, or `UNKNOWN`.

Scene and property inspection require the disposable blank Lens named **Effect Lab Sandbox**. Its saved project folder must remain **Effect Lab Training Sandbox** at `/Users/debbie/Documents/Effect Lab Training Sandbox`. Verification also requires a live MCP response, no Soft Flash markers, and a captured fingerprint. Instantiation stays blocked until the current project, exact preset, human confirmation, and safe reset are all verified. If reset cannot be guaranteed, the user must reset the sandbox by hand.

The first BeautyPreset deep-inspection record is available in the Learning Lab. It stores the pre-change fingerprint, exact created objects and assets, editor properties, compiler and runtime evidence, preview evidence, remaining unknowns, and reset assessment. It does not treat object names as behavior evidence. The confirmed reset deleted only the isolated BeautyPreset scene branch and its four created assets. The resulting fingerprint matched the baseline, so this exact reset is recorded as `SAFE_AUTOMATIC_RESET`.

## Controlled workflow

1. Discover an official resource.
2. Inspect it through a supported MCP capability.
3. Save a Pattern Card with evidence and explicit unknowns.
4. Create an original training exercise.
5. Compare it with official resources, other exercises, and the local library.
6. Require `ORIGINAL` before build.
7. Complete and confirm the Lens Build Specification.
8. Build and compile through the existing controlled Lens Builder.
9. Capture a real preview.
10. Run Visual QA and Experience QA.
11. Require human review.
12. Save a Learning Record and reusable lessons.

The current V1 stops an automatically drafted exercise before build because its original concept and concrete build specification require human input. This is intentional. The system does not convert sparse preset metadata into guessed components or operations.

`CurriculumReadiness` reports `READY`, `PARTIAL`, or `NOT_READY` per category. Metadata-only cards can show coverage but cannot make a category ready. `PARTIAL` requires scene evidence. `READY` requires multiple scene-verified cards plus verified capability records.

## Curriculum

The curriculum contains 100 unassigned slots:

- Beauty: 20
- Randomisers: 15
- Games: 15
- Face effects: 10
- World AR: 10
- VFX: 10
- Fashion: 10
- Experimental: 10

Slots are planning targets, not fabricated exercises. Category allocation can change when official resource availability is known. Beauty exercises must preserve identity and natural skin texture. They must avoid excessive smoothing and unrealistic facial alteration.

## Pattern retrieval and capability knowledge

`PatternRetrievalService` ranks saved Pattern Cards for later Lens Builder planning. Retrieval is evidence support, not permission to copy the source concept, appearance, text, or assets.

`CapabilityKnowledgeBase` stores `VERIFIED`, `PARTIAL`, `DEPRECATED`, or `UNKNOWN` entries. A `VERIFIED` entry requires Lens Studio MCP or official Snap evidence. An LLM assumption cannot become a permanent verified capability.

Knowledge entries distinguish tools, components, properties, operations, limits, and version changes. They store supported operations, property paths, current Lens Studio version notes, limits, and evidence where those facts are available.

## Outcomes and rewards

Every completed exercise defaults to `TRAINING_ONLY`. The default `PUBLISH_CANDIDATE` gate requires:

- Technical QA: `PASS`
- Specification QA: `PASS`
- Visual QA score: at least 8
- Human review: `APPROVED`
- No critical Experience QA failure

Thresholds are in `config/learning.ts`. A publish candidate is not published automatically.

Reward suitability uses `HIGH`, `MEDIUM`, `LOW`, `INELIGIBLE`, or `UNKNOWN` for Top Performer and Lens+ potential. Without real evidence, both stay `UNKNOWN`. These fields are not programme eligibility or earnings claims.

## Persistence

V1 stores Pattern Cards and exercises in device-local browser storage through `BrowserLearningRepository`. `database/schema.sql` includes portable tables for resources, Pattern Cards, exercises, Learning Records, and capability knowledge. A later SQLite or Postgres repository can implement the same service boundary.

`LearningPerformanceEvidence` links a completed Learning Record to real performance record IDs. Unknown dates remain `null`. It starts as `NOT_ENOUGH_DATA` and cannot change recommendations without human review. No demo metric becomes learning evidence.
