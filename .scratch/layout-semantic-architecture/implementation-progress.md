# Layout Semantic Architecture Implementation Progress

Updated: 2026-08-07 13:47 CST

## Phase Status

- Phase 0: automated baseline and guardrails complete; playground baseline awaiting user confirmation.
- Phase 1: complete. Final-named DocumentSchema, definition snapshot, Schema Structure Resolver, immutable ResolvedDocument query model, and conformance tests are implemented beside the legacy path.
- Phase 2: complete. The pure Schema Editor, closed operation vocabulary, structural destinations, aggregate bundles, atomic batch execution, and conformance tests are implemented beside the legacy path.
- Phase 3: complete. Material Catalog, Authoring Engine, bounded snapshot history, four-state document session, and controlled DesignerInstance seams are implemented beside the legacy UI path.
- Phase 4: automated UI parity corrections are complete for Device Frame planes, toolbar affordance/geometry, node style, empty/start/end/region/forbidden drop feedback, selection edges, hover handle and framework empty state. Exact Playground business empty-state parity is stopped on open Wayfinder ticket 15.
- Phase 5: automated UI parity corrections are complete for Designer Localization, material groups/cards, Structure/toolbar actions, Playground inspector field sets, Color/Array/Spacing adapters and implementation-only CSS properties.
- Phase 6: complete. Renderer, Widgets, legacy Core protocols, their implementation-coupled tests and obsolete package dependencies are removed; Core is a Vue-free pure module with only the accepted Document, Resolver and Editor interface.
- Phase 7: public consumer cutover and runtime localization are implemented. Exact Playground custom empty-state parity is stopped on open Wayfinder ticket 15, and the human Playground acceptance checklist remains unconfirmed.

## Phase 0 Evidence

- Initial worktree: clean on `refactor` before Phase 0 edits.
- Pre-change baseline, executed in repository order:
  - `pnpm build`: passed, 14/14 tasks.
  - `pnpm lint`: passed; existing `check:public-boundary` source denylist reported `public package boundary valid`.
  - `pnpm typecheck`: passed, including 11/11 package builds and root `tsc`.
  - `pnpm test`: passed, 72 test files and 780 tests as recorded during Phase 0.
- Dependency guardrail:
  - `fast-check` is registered as `^4.9.0` in the workspace `testing` catalog.
  - The root workspace declares `fast-check` through `catalog:testing` for shared test infrastructure.
  - `@dragcraft/core` does not declare `fast-check` directly.
  - Lockfile resolves `fast-check@4.9.0` with `pure-rand@8.4.2`.
  - `pnpm install --frozen-lockfile --offline --trust-lockfile`: passed.
- Wayfinder ticket 11 resolved the Resolver options input, `DiagnosticReport` result, default/hard budgets, zero budget, and invalid-value fallback before Phase 1 began.

## Phase 1 Implementation

- Added canonical pure-data types in `packages/core/src/document/types.ts` and definition declarations in `packages/core/src/definitions/types.ts`.
- Added pure JSON inspection, JSON Pointer generation, and input-isolated deep-frozen snapshots in `packages/core/src/document/json.ts`; `structuredClone` is not used.
- Added the sole `resolveSchema(input, definitions, options?)` seam with `rejected`, `ready`, `degraded`, and `conflicted` results.
- Added stable decode/structure/definition diagnostics, machine-stable ordering, immutable reports, default budget 200, hard limit 2000, zero budget, and invalid-value fallback.
- Added immutable `nodesById`, `locationsById`, ordered root, and declaration-ordered container/region views.
- Added decode, ownership, reference, one-level container, unknown type, capability, region set, cardinality, and accepted-type conformance coverage.
- Added two bounded `fast-check` properties with seed `20260806`: 20 diagnostic-order cases and 50 generated legal one-level documents.
- Phase 1 modules contain no Vue import. The legacy Core Vue dependency and old modules remain untouched because their removal is assigned to Phase 6.
- The new Core root export cutover remains deferred as required by the accepted execution strategy; production Designer code is not routed through the new modules yet.

## Phase 1 Red-Green Evidence

Every behavioral cycle used the same directed command:

`pnpm --filter @dragcraft/core test --run src/resolver/resolve-schema.test.ts`

Each red was observed before its minimal implementation. The following green run passed at the stated cumulative count:

| Cycle | Observed red | Following green |
| --- | --- | --- |
| 1 | missing `./resolve-schema`; 1 failed suite, 0 tests | 1/1 tests |
| 2 | input mutations leaked into the returned Schema | 2/2 tests |
| 3 | executable value returned `ready` instead of `rejected` | 3/3 tests |
| 4 | malformed document envelope returned `ready` | 4/4 tests |
| 5 | malformed node/reference shapes returned `ready` | 5/5 tests |
| 6 | root node was absent from `nodesById` | 6/6 tests |
| 7 | duplicate node ID returned `ready` | 7/7 tests |
| 8 | missing root reference returned a partial `ready` document | 8/8 tests |
| 9 | orphan node returned `ready` | 9/9 tests |
| 10 | repeated root ownership produced duplicate views | 10/10 tests |
| 11 | valid region children were misclassified as orphans | 11/11 tests |
| 12 | region-owned container owner returned `ready` | 12/12 tests |
| 13 | missing container owner diagnostic was absent | 13/13 tests |
| 14 | unknown type returned `ready` instead of `degraded` | 14/14 tests |
| 15 | ordinary type with container structure returned `ready` | 15/15 tests |
| 16 | registered container without structure returned `ready` | 16/16 tests |
| 17 | region key mismatch returned `ready` | 17/17 tests |
| 18 | nested container capability was misclassified as missing structure | 18/18 tests |
| 19 | cardinality/accepts violations returned `ready` | 19/19 tests |
| 20 | `maxDiagnostics: 0` retained the diagnostic | 20/20 tests |
| 21 | invalid budget `-2` retained 199 instead of default 200 | 21/21 tests |
| 22 | requested 9999 retained 2001 instead of hard-limit 2000 | 22/22 tests |
| 23 | `DiagnosticReport` was mutable at runtime | 23/23 tests |
| 24 | an array getter executed twice instead of being rejected untouched | 24/24 tests |
| 25 | locale-dependent sort failed after 1 property case; seed `20260806`, path `0:0`, counterexample `["A","a"]` | 25/25 tests |
| 26 | container view used Schema key order instead of declaration order | 26/26 tests |

During cycle 7, the first attempted green run failed before test collection with esbuild `Unexpected "|"` because a private function was inserted between union branches. The declaration position was fixed and the repeated green command passed 7/7. This failed command is retained as implementation evidence rather than omitted.

After review/refactor, the directed suite passed 26/26. Adding the generalized legal-document property without changing production behavior produced the final directed result: 1 file and 27/27 tests passed.

## Phase 1 Review And Verification Evidence

- `pnpm --filter @dragcraft/core typecheck`: passed.
- First `pnpm exec eslint packages/core/src/document packages/core/src/definitions packages/core/src/resolver`: failed with 7 mechanical import-order/indent errors.
- After fixes, the next directed lint found one remaining import-order error in `resolver/diagnostics.ts`; the final directed lint passed with no output.
- `pnpm --filter @dragcraft/core test --run`: passed, 26 files and 373 tests.
- `pnpm --filter @dragcraft/core build`: passed; tsdown built both artifacts and publint reported no issues.
- `rg -n "from ['\"]vue['\"]|from ['\"]@vue/" packages/core/src/document packages/core/src/definitions packages/core/src/resolver`: no matches (exit 1, expected for an empty search result).
- `find packages/core/src -maxdepth 2 -type f -path '*/editor/*' -print`: no output; Phase 2 files were not created.
- Final repository gates, executed in required order:
  - `pnpm build`: passed, 14/14 tasks. Existing guide/playground chunk-size warnings remain.
  - `pnpm lint`: passed; `public package boundary valid`.
  - `pnpm typecheck`: passed, including 11/11 package builds and root `tsc`.
  - `pnpm test`: passed; Core reported 26 files and 373 tests, including the new 27-test Resolver suite, and every reported workspace package suite passed.
- `git diff --check`: passed before the progress update.
- No accepted public interface change or other genuine architecture gap was exposed, so no new Wayfinder ticket was created.

## Phase 2 Implementation

- Added the sole `applySchemaOperation(document, request, definitions)` Schema Editor seam. Tests and callers do not cross the internal operation implementation seams.
- Added the closed `SchemaOperation` vocabulary: `insert-bundle`, `move`, `remove`, `unwrap`, `update-node`, `update-page`, and `update-global-config`, plus a non-nested `OperationBatch`.
- Added pure-data `NodeBundle`, `OwnerRef`, `InsertPosition`, and `StructuralDestination` types; no numeric insertion index is exposed to callers.
- Added internal `operations/*.ts` implementations for update, bundle insertion, move, remove, unwrap, destination resolution, immutable structure cloning, and candidate commit validation.
- Resolved `start`, `end`, `before`, and `after` against the current owner sequence inside Core, including same-owner move offsets and explicit missing owner/anchor rejection.
- Added self-contained aggregate validation for bundle entry presence, bundle/global ID uniqueness, container ownership, internal child references, unique internal ownership, and detached nodes.
- Added deep input isolation for inserted bundles, root/region moves, cascade container removal, and declaration-order unwrap.
- Every changed candidate is passed through `resolveSchema()` before commit, so reference integrity, root-only containers, non-container region children, accepts, cardinality, and definition conformance remain owned by the existing Resolver rules.
- Added sequential, non-nested, atomic batch execution. A later operation reads the prior resolved result; any rejection discards the private working result and exposes no partial document.
- Added a bounded `fast-check` property with seed `20260806` and 50 cases for generated legal one-level documents and move/update operation sequences. Every committed result re-resolves to `ready`, and the input snapshot remains unchanged.
- The new Core root export cutover remains deferred by the accepted execution strategy. No Designer, Material Catalog, Authoring Engine, history, or other Phase 3 module was created.

## Phase 2 Red-Green Evidence

Every Phase 2 behavioral cycle used:

`pnpm --filter @dragcraft/core test --run src/editor/apply-schema-operation.test.ts`

Each production behavior change had an observed red before its minimal green implementation:

| Cycle | Observed red | Following green |
| --- | --- | --- |
| 1 | missing `./apply-schema-operation`; 1 failed suite, 0 tests | 1/1 tests |
| 2 | equal global config returned `committed` | 2/2 tests |
| 3 | `update-page` fell through and rejected | 3/3 tests |
| 4 | `update-node` fell through and rejected | 4/4 tests |
| 5 | missing node update returned `committed` | 5/5 tests |
| 6 | equal node data returned `committed` | 6/6 tests |
| 7 | root `start` bundle insertion was rejected | 7/7 tests |
| 8 | root `end` bundle insertion was rejected | 8/8 tests |
| 9 | root `before` anchor insertion was rejected | 9/9 tests |
| 10 | root `after` anchor insertion was rejected | 10/10 tests |
| 11 | container-region insertion was rejected | 11/11 tests |
| 12 | missing anchor returned generic `SCHEMA_INVALID` | 12/12 tests |
| 13 | complete container aggregate insertion lacked container structure | 13/13 tests |
| 14 | global bundle ID conflict returned generic Schema diagnostics | 14/14 tests |
| 15 | same-owner move was rejected | 15/15 tests |
| 16 | root-to-region move was rejected | 16/16 tests |
| 17 | region-to-root move was rejected | 17/17 tests |
| 18 | ordinary root remove was rejected | 18/18 tests |
| 19 | region child remove was rejected | 19/19 tests |
| 20 | container cascade remove was rejected | 20/20 tests |
| 21 | declaration-order unwrap was rejected | 21/21 tests |
| 22 | sequential batch execution was rejected | 22/22 tests |
| 23 | runtime nested batch was committed | 23/23 tests |
| 24 | bundle entry missing from its node set returned generic Schema diagnostics | 25/25 tests |
| 25 | missing destination owner returned generic `SCHEMA_INVALID` | 26/26 tests |
| 26 | JSON object key order caused a false `committed` result | 28/28 tests |
| 27 | bundle could reuse an existing document container owner | 29/29 tests |
| 28 | bundle could reference a region child outside the aggregate | 30/30 tests |
| 29 | detached non-entry bundle node returned generic Schema diagnostics | 31/31 tests |
| 30 | multiple internal owners returned generic Schema diagnostics | 32/32 tests |
| 31 | bundle entry could also be internally region-owned | 33/33 tests |
| 32 | a self anchor in a different owner was incorrectly treated as `unchanged` | 38/38 tests |

The first attempted green for cycle 16 failed with `TypeError: Cannot add property 0, object is not extensible`; the target region was still the Resolver-owned frozen array. The implementation was corrected to clone every owner sequence before editing, and the repeated command passed 16/16.

The first property run failed after one case with seed `20260806`, path `0:1:2:1:1:2`, and counterexample `{ rootCount: 1, childCount: 0, moves: [0], locales: [] }`. The generated operation moved the only ordinary root node to its existing `end`, correctly producing `unchanged`; the property oracle was corrected to accept both legal success states. The repeated 50-case run passed.

Atomic batch failure, deep bundle snapshot isolation, Resolver-owned cardinality/accepts enforcement, and later-batch access to prior inserted nodes were added as conformance assertions without production changes. After review/refactor and these assertions, the directed suite passed 1 file and 37/37 tests.

The final review found and fixed one cross-owner self-anchor edge case with the same red-green command; the corrected directed suite passed 38/38.

## Phase 2 Review And Verification Evidence

- `pnpm --filter @dragcraft/core typecheck`: passed before and after refactor.
- First `pnpm exec eslint packages/core/src/editor`: failed with 5 mechanical curly/import/file-ending errors; after those fixes and the internal operation refactor, the next directed lint found 1 chaining-layout error; the final directed lint passed with no output.
- `pnpm --filter @dragcraft/core test --run src/editor/apply-schema-operation.test.ts`: passed, 1 file and 38 tests.
- `pnpm --filter @dragcraft/core test --run`: passed, 27 files and 411 tests.
- `pnpm --filter @dragcraft/core build`: passed; tsdown built both artifacts and publint reported no issues.
- `rg -n "from ['\"]vue['\"]|from ['\"]@vue/" packages/core/src/document packages/core/src/definitions packages/core/src/resolver packages/core/src/editor`: no matches (exit 1, expected).
- `rg -n "structuredClone" packages/core/src/editor`: no matches (exit 1, expected).
- Final repository gates, executed in required order:
  - `pnpm build`: passed, 14/14 tasks. Existing guide/playground chunk-size warnings remain.
  - `pnpm lint`: passed; `public package boundary valid`.
  - `pnpm typecheck`: passed, including 11/11 package builds and root `tsc`.
  - `pnpm test`: passed across every reported workspace package; Core reported 27 files and 411 tests.
- No accepted public interface change or genuine architecture gap was exposed, so no Wayfinder decision ticket was recreated.

## Phase 3 Implementation

- Added `packages/designer/src/materials/types.ts` with the flat `MaterialDefinition`, explicit visual/headless presentation, schema/container declarations, optional panel/inspector declarations, NodeBundle factory context, and Authoring Policy rules.
- Added `defineMaterial()` as a no-op inference helper in `packages/designer/src/materials/define-material.ts`.
- Added `createMaterialCatalog()` as the single immutable catalog seam. Initialization validates duplicate/empty types, explicit presentation consistency, JSON defaults, one-level container regions/cardinality/accepts, and authoring configuration; invalid configuration throws `DesignerConfigurationError`.
- The catalog owns immutable Core `SchemaDefinitionSnapshot`, Authoring, Presentation, panel/inspector projections and standard ordinary/container/headless NodeBundle creation. Optional material factories receive an injected ID factory and return complete aggregates.
- Added `packages/designer/src/authoring/types.ts`, `policy.ts`, `history.ts`, and `create-authoring-engine.ts`. `execute()` is the only Authoring action write seam: create, duplicate, move, remove, unwrap, update node/page/global config, non-nested batch, selection/hover, undo and redo are translated to the closed Core operation vocabulary.
- Authoring Policy is separate from Core Schema validity and supports allowed, denied, and confirmation-required decisions. Unknown/conflicted material nodes are read-only; policy rejection and confirmation never write document or history.
- History stores immutable Schema snapshot references with default 50 entries, `0` disabled, bounded retention, redo-branch truncation, one entry per batch, and undo/redo cursor movement. Selection and hover are reactive and repaired when a committed document removes their node; they are not part of history.
- Added `packages/designer/src/session/create-designer.ts` with the Phase 3 `createDesigner({ schema?, materials, ... })` session seam. Omitted schema creates canonical empty version `1`; explicit inputs use the Resolver four states; rejected imports preserve the installed document; successful imports reset the history baseline; export is detached JSON data or `null`.
- Added the Phase 3 conformance suites:
  - `packages/designer/src/materials/create-material-catalog.test.ts`: 12 tests.
  - `packages/designer/src/authoring/create-authoring-engine.test.ts`: 20 tests.
  - `packages/designer/src/session/create-designer.test.ts`: 8 tests.
- Added the required new Core root exports for Designer's internal workspace dependency (`resolveSchema`, `applySchemaOperation`, their pure-data types and JSON helpers). No new Core/ResolvedDocument/SchemaOperation type is re-exported from the Designer public root.

## Phase 3 Red-Green Evidence

Each vertical slice used a directed command before the minimal implementation and then repeated the same command after implementation:

- Material Catalog: `pnpm --filter @dragcraft/designer test --run src/materials/create-material-catalog.test.ts`. Initial missing-module, missing-helper, invalid presentation/container, projection, standard/custom bundle and configuration validation reds were followed by a final green result of `1 file and 12/12 tests passed`.
- Authoring Engine: `pnpm --filter @dragcraft/designer test --run src/authoring/create-authoring-engine.test.ts`. Initial missing-module and each missing action/policy/history/selection behavior was observed red before implementation; the final directed result was `1 file and 20/20 tests passed`.
- Designer session: `pnpm --filter @dragcraft/designer test --run src/session/create-designer.test.ts`. Initial missing-module, rejected initial state, import, diagnostic limit, export, configuration and empty-history cursor reds were followed by `1 file and 8/8 tests passed`.
- One green attempt after adding the new Core JSON export failed with `cloneJsonValue is not a function` because the workspace `@dragcraft/core/dist` artifact was stale. The real recovery command `pnpm --filter @dragcraft/core build` passed, and repeating the directed Material command passed `7/7` at that point. This was a build-artifact issue, not a production behavior change.
- Review found an empty-history cursor bug: undo from an initial rejected document made `canRedo` true. A new session seam test first failed, the cursor guard was corrected, and the repeated command passed `8/8`.

## Phase 3 Review And Verification Evidence

- `pnpm --filter @dragcraft/designer test --run`: passed, 15 files and 146 tests.
- `pnpm --filter @dragcraft/core test --run`: passed, 27 files and 411 tests.
- `pnpm --filter @dragcraft/designer typecheck`: passed.
- `pnpm exec eslint packages/designer/src/materials packages/designer/src/authoring packages/designer/src/session packages/core/src/index.ts`: passed with no output after mechanical import/type fixes.
- `pnpm --filter @dragcraft/core build`: passed; tsdown built both artifacts and publint reported no issues.
- `pnpm --filter @dragcraft/designer build`: passed; theme contract, package export validation and publint all passed.
- `find packages/designer/src -maxdepth 2 -type d -name presentation -print`: no output; no Phase 4 presentation module was created.
- `rg -n "structuredClone" packages/designer/src/materials packages/designer/src/authoring packages/designer/src/session packages/core/src/index.ts`: no matches.
- `git diff --check`: passed.
- Final repository gates, executed in the required order after Phase 3 implementation:
  - `pnpm build`: passed, 14/14 tasks. Existing guide/playground chunk-size warnings remain.
  - `pnpm lint`: passed; `public package boundary valid`.
  - `pnpm typecheck`: passed, including 11/11 package builds and root `tsc`.
  - `pnpm test`: passed across all reported workspace packages; Designer reported 15 files and 146 tests, Core reported 27 files and 411 tests.
- No accepted public interface change or genuine architecture gap was exposed, so no Wayfinder decision ticket was recreated.

## Phase 4 Implementation

- Added internal `ApplicationSurface`, `NodeHost`, `InteractionPlane`, Geometry Registry, Presentation Diagnostic Registry and Surface Reservation Registry modules beside the legacy Renderer path; no workbench caller was cut over.
- Added ordered Document, Viewport and private Interaction Plane DOM ownership inside the new surface, including stacking contexts, safe-area integration and measured reservation variables.
- Added distinct visual, headless and unknown material presentation paths. Headless containers create their declared Outlets automatically; unknown containers preserve Schema-owned region children in read-only recovery regions.
- Added `DesignerRegionOutlet` with resolved structural ordering, one-primary-Outlet ownership, missing/duplicate Outlet recovery, default midpoint structural anchors and an optional material geometry resolver.
- Added `PresentationFrame` around the complete NodeHost with missing/duplicate slot recovery and `DesignerViewportPortal` routing for root-owned nodes; region-child portal attempts recover in place.
- Added `MaterialPreviewContext` with read-only node/page/global/owner/state data and `updateSelf()` routed only through the existing Authoring Action execute seam. The removed `invokeAction()` interface was not reintroduced.
- Added centralized ResizeObserver measurement, surface-relative coordinate conversion with transform normalization, root/region drop anchors, selected geometry, toolbar actions, selection/hover routing and presentation diagnostics in the Interaction Plane.
- Added stable root-ordered `useSurfaceReservation()` measurements and private reservation CSS variables; structural CSS now owns ApplicationSurface planes, scrollport padding, NodeHost, selection, toolbar and recovery geometry.
- Extended theme hook validation to scan the new presentation renderers and registered the new internal data hooks in the theme contract. The legacy Renderer import remains temporarily because Phase 5 workbench cutover and Phase 6 deletion are explicitly out of scope.

## Phase 4 Red-Green Evidence

Every Phase 4 slice used the directed command:

`pnpm --filter @dragcraft/designer test --run src/presentation/application-surface.test.ts`

Each listed production behavior had an observed red before its minimal green implementation:

| Cycle | Observed red | Following green |
| --- | --- | --- |
| 1 | missing `./application-surface`; 1 failed suite, 0 tests | 1/1 tests |
| 2 | headless proxy marker was absent | 2/2 tests |
| 3 | missing `./designer-region-outlet`; 1 failed suite, 0 tests | 3/3 tests |
| 4 | omitted visual-container Outlet silently lost its child | 4/4 tests |
| 5 | duplicate Outlets rendered two child NodeHosts | 5/5 tests |
| 6 | headless container proxy rendered no declared Outlets | 6/6 tests |
| 7 | unknown container fallback did not expose a read-only recovery region | 7/7 tests |
| 8 | configured PresentationFrame was absent | 8/8 tests |
| 9 | missing frame slot silently lost the NodeHost | 9/9 tests |
| 10 | duplicate frame slot produced no recovery | 10/10 tests |
| 11 | missing `./designer-viewport-portal`; 1 failed suite, 0 tests | 11/11 tests |
| 12 | region-child portal moved the NodeHost into Viewport Plane | 12/12 tests |
| 13 | default Outlet dragover produced no structural destination | 13/13 tests |
| 14 | custom Outlet resolver was ignored and returned default `end` | 14/14 tests |
| 15 | Preview received no `context`; missing module/prop warning | 15/15 tests |
| 16 | selected NodeHost had no surface-relative Interaction Plane geometry | 16/16 tests |
| 17 | root `dragover` emitted no `StructuralDestination` or drop feedback | 17/17 tests |
| 18 | edge reservations exposed no measured size, offset or total | 18/18 tests |
| 19 | selected-node remove toolbar was absent | 19/19 tests |
| 20 | duplicate toolbar action had no owner-relative destination | 20/20 tests |
| 21 | region move-up/move-down actions were absent | 21/21 tests |
| 22 | NodeHost click/hover did not route Authoring Actions | 22/22 tests |
| 23 | missing/duplicate Outlet, Frame and Portal diagnostics stayed outside Interaction Plane | 22/22 tests |
| 24 | Reservation and region providers kept stale root/document order after resolved-document updates | 24/24 tests |
| 25 | non-zero surface origin made root `clientY` choose `after(second)` | 25/25 tests |
| 26 | root `dragleave` left the Interaction Plane drop indicator visible | targeted test: 1 passed, 23 skipped |
| 27 | Frame-wrapped region children were invisible to the default midpoint resolver, which returned `end` | targeted test: 1 passed, 24 skipped |
| 28 | a 2x surface transform made a 24px logical reservation consume 48px | targeted test: 1 passed, 25 skipped |

The CSS tracer used the public stylesheet seam `pnpm --filter @dragcraft/designer test --run src/presentation/structure-css.test.ts`: the first run failed because `contain: layout paint` was absent, and the following run passed 1/1. The combined final directed command passed 2 files and 27/27 tests.

Cycle 26 used `pnpm --filter @dragcraft/designer test --run src/presentation/application-surface.test.ts -t 'routes root drop anchors'`. The red run failed 1 test because the drop indicator remained after root `dragleave`; after adding `ApplicationSurface.handleRootDragLeave()`, the repeated command passed 1 test with 23 skipped.

Cycle 27 used `pnpm --filter @dragcraft/designer test --run src/presentation/application-surface.test.ts -t 'resolves framed region children'`. The red run failed 1 test with 24 skipped because the resolver returned `end`; after ordering descendant NodeHosts by the resolved direct-child sequence, the repeated command passed 1 test with 24 skipped.

Cycle 28 used `pnpm --filter @dragcraft/designer test --run src/presentation/application-surface.test.ts -t 'normalizes edge reservation sizes'`. The red run failed 1 test with 25 skipped because a 2x transform produced `48px` instead of `24px`; after measuring through Geometry Registry's surface conversion, the repeated command passed 1 test with 25 skipped.

## Phase 4 Architecture Decision

- Wayfinder ticket 12 resolved the Phase 4 interface question before implementation resumed: `MaterialPreviewContext.invokeAction(name, payload?)` is removed.
- Preview Schema writes are limited to `updateSelf()` through the existing Authoring Engine execute seam. No material-action registry, custom Authoring Action variant, deprecated alias or compatibility layer was added.
- No accepted public interface was changed by Phase 4, so no new Wayfinder decision ticket was required.

## Phase 4 Review And Verification Evidence

- Post-cycle-28 directed rerun: `pnpm --filter @dragcraft/designer test --run src/presentation/application-surface.test.ts src/presentation/structure-css.test.ts`: passed, 2 files and 27 tests.
- Post-cycle-28 full Designer rerun: `pnpm --filter @dragcraft/designer test --run`: passed, 17 files and 173 tests.
- `pnpm --filter @dragcraft/designer typecheck`: passed.
- Post-cycle-28 `pnpm exec eslint packages/designer/src/presentation`: passed with no output.
- `pnpm --filter @dragcraft/designer build`: passed; theme contract reported 61 tokens and 36 components, theme interactions passed, tsdown/publint passed, and package exports passed.
- Final post-cycle-28 repository gates were rerun in the required order:
  - `pnpm build`: passed, 14/14 tasks. Existing guide/playground chunk-size warnings remain.
  - `pnpm lint`: passed; `public package boundary valid`.
  - `pnpm typecheck`: passed, including 11/11 package builds and root `tsc`.
  - `pnpm test`: passed across all workspace suites; Designer reported 17 files and 173 tests, Core 27 files and 411 tests, and all other reported packages passed.
- `git diff --check`: passed.
- No Phase 5 module or caller was changed.

## Phase 5 Implementation

- Replaced the legacy Engine/Renderer workbench context with one internal Designer context backed by `DesignerInstance`, its private Material Catalog, resolved-document projection, workspace controller, form bindings, i18n and drag state. These implementation details remain behind the `DcDesigner`/`DesignerInstance` seam.
- Cut `DcDesigner`, Canvas, material panel, structure tree, property panel, keyboard shortcuts and drag/drop over to the Phase 3 Authoring and Phase 4 Presentation modules. Canvas now mounts `ApplicationSurface`; no Designer production source or theme entry imports Renderer or Widgets.
- Material search and drag creation consume the same `MaterialDefinition[]` catalog. Root and region drops use `StructuralDestination`; the structure tree follows resolved root/region order and emits owner-relative move, duplicate and remove `AuthoringAction` values.
- Property and global-config form edits compile `props.*`, `style.*`, `page.*` and `globalConfig.*` bindings to the existing closed Authoring action vocabulary. No container variant, projected index, sort scope or arbitrary command path was restored.
- Routed Document and Viewport planes through the optional switchable Container Shell while keeping the Interaction Plane as a stable direct child of `ApplicationSurface`, outside Device Frame clipping.
- Replaced the package root with the accepted runtime allowlist: `createDesigner`, `defineMaterial`, `DcDesigner`, `useDesigner`, `DesignerRegionOutlet`, `DesignerViewportPortal`, `useSurfaceReservation` and `DOCUMENT_SCHEMA_VERSION`, plus the accepted pure-data, host, material, authoring, Presentation and form types.
- Merged the retained Presentation structure and recipes into Designer CSS, removed the Renderer stylesheet import and legacy Renderer/Widgets hooks, preserved real workbench part hooks, and updated theme validation to scan only UI, Designer Presentation and form-generator ownership.
- Added a built-output public consumer fixture covering visual, headless, one-level container, Presentation Frame, field adapter and Device Frame integration. Individual negative imports cover Engine, Command, ResolvedDocument, SchemaOperation, legacy ComponentMap/WidgetDefinition, RootRenderer, NodeHost, Geometry Registry and `DesignerSchema`.
- Extended package export validation to resolve the root and CSS/JSON subpaths, check built declaration paths and enforce the exact runtime export allowlist. The root public-boundary scan now includes the consumer fixture.
- Added a Designer-local TypeScript project for package-scoped validation; the root project excludes the dedicated fixture because the fixture has its own built-package `paths` and is run explicitly by Designer build/typecheck.
- Renderer and Widgets packages, Designer dependency declarations and legacy Core protocols were not deleted or changed; those tasks remain Phase 6. Playground and guide consumers were not rewritten; those tasks remain Phase 7.

## Phase 5 Red-Green Evidence

Phase 5 behavior was exercised through the agreed `DcDesigner`/`DesignerInstance` and public package consumer seams. Each production behavior below had an observed red before its minimal green implementation:

| Cycle | Command | Observed red | Following green |
| --- | --- | --- | --- |
| 1 | `pnpm --filter @dragcraft/designer test --run src/workbench-cutover.test.ts` | `defineMaterial is not a function` at the public workbench tracer | 1 file, 1 test passed |
| 2 | same directed workbench command, structure-tree target | selected region child had no `[data-dc-action="remove"]` | targeted test passed |
| 3 | same directed workbench command, property-edit target | inspector input was absent | targeted test passed after the failed first green below |
| 4 | `pnpm --filter @dragcraft/designer test --run src/public-interface.test.ts` | legacy interface expectations required `buildComponentMap`, `createEngine` and other removed exports; 2/3 tests failed | 1 file, 3 tests passed with the accepted allowlist |
| 5 | directed Device Frame workbench target | Interaction Plane remained inside the Container Shell | targeted test passed with Interaction Plane outside the shell |
| 6 | `pnpm --filter @dragcraft/designer typecheck` | 4 compile-contract errors in page binding, material grouping, deep-readonly Schema input and material icon typing | passed after one incomplete green attempt still reported 3 deep-readonly errors |
| 7 | `node packages/designer/scripts/validate-theme-contract.mjs` | `document-recovery` was missing and retained workbench part hooks were not emitted | `theme contract valid: 61 tokens, 26 components`; full `check:theme` also passed interaction recipes |
| 8 | `pnpm --filter @dragcraft/designer check:package-exports` and `check:public-consumer` | built root still exposed the legacy 60+ value surface instead of 8 values; the consumer could not import the replacement types/values | exact runtime allowlist passed and the consumer fixture typechecked |
| 9 | `pnpm --filter @dragcraft/designer test --run src/components/DcDesigner.test.ts -t 'preserves right-panel'` | the retained right rail emitted no `data-dc-part="rail"` hook, so the assertion failed while reading its attributes | 1 test passed, 2 skipped, with the right rail/extension hooks and tab/tabpanel/toggle ARIA contract restored |

The first attempted green for property editing failed with `Cannot assign to read only property 'text'`: the binding path was mutating a Resolver-owned frozen snapshot. The binding adapter was corrected to clone before constructing `update-node`, and repeating the directed test passed.

The first typecheck green attempt reduced the original four errors but still failed at three call sites because only the caller, not the field-binding seam, accepted `DocumentDeepReadonly`. The internal seam was corrected and repeating the same typecheck passed.

The first public-consumer green attempt, after the new build already passed exact package exports, failed because the fixture incorrectly supplied `BannerProps` as the complete `defineMaterial` generic and used an array instead of `{ types }` for region accepts. The fixture was corrected to use the accepted inference interface; repeating `pnpm --filter @dragcraft/designer check:public-consumer` passed without changing production behavior.

The first right-panel green attempt restored the hooks and ARIA relationships, but the test still expected the expanded-state toggle label. Happy DOM reports a zero-width Designer root, so the component correctly entered compact state and emitted the localized expand-properties label. The assertion was changed to verify the stable accessible contract for that rendered state; repeating the same directed command passed 1 test with 2 skipped.

The material root-drop conformance assertion passed on its first run after the structural-destination implementation. It required no production change and is recorded as added conformance coverage, not claimed as a red-green cycle.

The first full Designer audit after cutover ran `pnpm --filter @dragcraft/designer test --run` and reported 9 failed files, 90 failed tests and 88 passed tests because legacy suites still exercised Engine/Renderer/Widgets implementation seams. In accordance with the deep-module replacement rule, those tests were rewritten at the accepted Designer seam rather than keeping compatibility exports. After the right-panel contract cycle, the final full Designer result is 18 files and 101 tests passed.

## Phase 5 Review And Verification Evidence

- `pnpm --filter @dragcraft/designer test --run`: passed, 18 files and 101 tests.
- `pnpm --filter @dragcraft/designer typecheck`: passed, including `tsc -p fixtures/public-consumer/tsconfig.json`.
- `pnpm --filter @dragcraft/designer check:theme`: passed; 61 tokens, 26 emitted components and interaction recipes were valid.
- `pnpm --filter @dragcraft/designer build`: passed; both public CSS outputs, module/declaration output, publint, exact package exports and the public consumer fixture passed.
- `pnpm exec eslint packages/designer/src packages/designer/scripts packages/designer/fixtures packages/designer/tsconfig.json scripts/check-public-boundary.mjs`: passed with no output after mechanical fixes.
- `pnpm check:public-boundary`: passed with `public package boundary valid`.
- `pnpm --filter @dragcraft/core test --run`: passed, 27 files and 411 tests.
- The production/theme dependency audit found no `@dragcraft/renderer` or `@dragcraft/widgets` import. Expected removed-name mentions remain only in negative public-interface assertions. Package dependencies remain intentionally until Phase 6.
- `git diff --check`: passed before this progress update.
- Final repository gates were executed in the required order:
  - `pnpm build`: package and docs builds reached 12/14 successful tasks, then failed in the Phase 7 guide consumer because `ContainerRegionOutlet` is no longer exported; Turbo terminated the concurrent playground build with exit 129. No Phase 5 package build failed.
  - `pnpm lint`: passed; `public package boundary valid`.
  - `pnpm typecheck`: all 11 package builds passed, including Designer's consumer fixture, then root `tsc` failed only in the unchanged Phase 7 guide/playground sources that still import legacy Designer symbols such as `DesignerSchema`, `WidgetDefinition`, `CommandType`, `createEngine` and `defineContainerWidget`.
  - `pnpm test`: all package suites passed, including Designer 18 files/101 tests and Core 27 files/411 tests; the run then failed in 5 unchanged guide-project suites at import time because `defineContainerWidget` is no longer a function. The recursive run stopped before playground tests.
- These repository-gate failures are the expected direct-cutover interval assigned to Phase 7. No compatibility alias or premature product-consumer rewrite was added to make them pass.
- No implementation finding required a change to the accepted public interface. The `defineMaterial` fixture error was resolved by using its accepted inference contract, so no Wayfinder decision ticket was recreated.

## Phase 6 Implementation

- Deleted the complete `packages/renderer` and `packages/widgets` modules. Ignored local `dist`, `.turbo` and package-local `node_modules` artifacts were moved to the macOS Trash after their tracked sources were deleted, so neither package directory remains in the workspace.
- Removed both obsolete packages from Designer dependencies and regenerated `pnpm-lock.yaml` through pnpm. The removed Renderer-only Floating UI dependency and its unused workspace catalog entry were also removed.
- Deleted the legacy Core Engine, command bus and handlers, event hub, registry, history manager, layout/sortable protocols, container definition/plan/placement/variant path, tree Schema/index/store/validation/helpers, old style helpers, legacy types and their implementation-coupled tests.
- Replaced the Core root with only the accepted DocumentSchema, SchemaDefinitionSnapshot, Schema Structure Resolver, ResolvedDocument, Schema Editor, NodeBundle, Schema Operation and Structural Destination exports.
- Removed Core's Vue peer/dev dependency and its now-unused utils dependency. Core source is now limited to `document`, `definitions`, `resolver`, `editor` and the root export.
- Deleted the two remaining cross-package tests that read the removed Renderer stylesheet from device-frames and playground. Their retained behavior remains covered through Designer's Presentation and structure stylesheet interface tests.
- Removed the two obsolete standalone packages from `.github/architecture/07-package-reference.md` and updated only the directly affected Core, Designer and dependency-index descriptions. The Phase 8 architecture rewrite was not started.
- Added `scripts/check-obsolete-protocols.mjs` and wired it into the root lint gate. It enforces absent package directories/imports/dependencies/lockfile importers, the final Core source topology, Core's Vue isolation and absence from the architecture package reference.
- No playground material/template or guide consumer was rewritten. The only playground edit deleted the Phase 6 implementation-coupled Renderer CSS assertion.

## Phase 6 Red-Green-Refactor Evidence

Each Phase 6 slice first extended the repository conformance seam, observed the expected failure, applied the minimum deletion, then kept the checker green during review/refactor:

| Cycle | Command | Observed red | Following green |
| --- | --- | --- | --- |
| 1 | `pnpm check:obsolete-protocols` | 6 violations: two package directories, two Designer dependencies and two lockfile importers remained | `node scripts/check-obsolete-protocols.mjs`: passed with `obsolete package removal valid` after package deletion and pnpm lockfile regeneration |
| 2 | `node scripts/check-obsolete-protocols.mjs` | 54 legacy Core files, 2 Core Vue manifest declarations and 6 Core Vue imports remained | same command passed after the legacy Core cluster and Vue dependency were removed |
| 3 | `node scripts/check-obsolete-protocols.mjs` | after excluding the checker's own denylist literal, exactly 2 source tests still read the deleted Renderer CSS implementation | same command passed after deleting those two implementation-coupled assertions |
| 4 | `node scripts/check-obsolete-protocols.mjs` | architecture package reference still listed both deleted package names | same command passed after the scoped package-reference update |
| 5 | `pnpm lint` | existing workspace lint reported the now-unused `@floating-ui/dom` catalog item | repeating `pnpm lint` passed after removing that catalog entry |

Refactor/review kept the accepted seams fixed: the Core root was reduced to replacement modules, the conformance traversal was changed to ignore generated `dist`, `.turbo` and `node_modules` directories, and the checker was added to the permanent root lint command. No compatibility export or replacement seam was introduced.

Dependency command evidence:

- First `pnpm install --lockfile-only --offline`: failed because `vitepress@next` resolved to `2.0.0-alpha.19`, whose `vite@^8.2.0` requirement had no stable matching version.
- `pnpm install --lockfile-only --offline --filter @dragcraft/designer`: failed for the same workspace-wide catalog resolution reason.
- `pnpm install --lockfile-only --offline --config.minimum-release-age=10080`: passed and retained the existing `vitepress@2.0.0-alpha.18` resolution while removing only obsolete importers/dependencies.
- `pnpm install --frozen-lockfile --offline --trust-lockfile`: passed after the package deletion, passed again after Core dependency cleanup, and the final run reported all 13 workspace projects already up to date in 25ms.

## Phase 6 Review And Verification Evidence

- `node scripts/check-obsolete-protocols.mjs`: passed with `obsolete package removal valid`.
- `rg -n "@dragcraft/(renderer|widgets)" packages playground examples docs skills README.md CLAUDE.md --glob '!**/dist/**' --glob '!**/node_modules/**'`: no matches (exit 1, expected).
- `rg -n "from ['\"]vue['\"]|from ['\"]@vue/|\"vue\"" packages/core/src packages/core/package.json`: no matches (exit 1, expected).
- `pnpm --filter @dragcraft/core test --run`: passed, 2 files and 65 tests. Only the replacement Resolver and Schema Editor interface suites remain.
- `pnpm --filter @dragcraft/core build`: passed; tsdown built the reduced runtime/declarations and publint reported no issues.
- `pnpm --filter @dragcraft/core typecheck`: invoked the root `tsc` because Core has no package-local tsconfig and failed only on unchanged Phase 7 guide/playground consumers; the Core package build above generated declarations successfully.
- `pnpm --filter @dragcraft/designer test --run`: passed, 18 files and 101 tests.
- `pnpm --filter @dragcraft/designer typecheck`: passed, including the built public-consumer fixture.
- `pnpm --filter @dragcraft/designer build`: passed; theme checks, tsdown/publint, exact package exports and the public consumer fixture all passed.
- `pnpm --filter @dragcraft/device-frames test --run`: passed, 3 files and 14 tests after removal of the cross-package stylesheet assertion.
- `pnpm build:packages`: passed, 9/9 retained packages. Renderer and Widgets no longer appear in Turbo's package graph.
- Final repository gates were run in required order:
  - `pnpm build`: all retained packages and docs passed; Turbo reported 10/12 successful tasks, then the unchanged Phase 7 guide failed on removed `ContainerRegionOutlet` and playground failed on removed `useI18n`.
  - `pnpm lint`: passed; public package boundary and obsolete protocol conformance both reported valid.
  - `pnpm typecheck`: all 9 retained package builds passed, then root `tsc` failed only in unchanged Phase 7 guide/playground sources that still consume legacy Designer names and shapes.
  - `pnpm test`: all 9 retained package suites passed, including Core 65, Designer 101 and device-frames 14 tests; the recursive run then failed in 5 unchanged guide-project suites at import time because `defineContainerWidget` is no longer a function. Playground tests were not reached.
- `git diff --check`: passed.
- No accepted public interface change or genuine architecture gap was exposed, so no Wayfinder decision ticket was recreated.

## Phase 7 Discovery Stop Evidence

- Read the accepted implementation plan, the complete implementation progress, `CONTEXT.md`, the architecture map and related resolved tickets before editing any product consumer.
- Confirmed the Phase 7 automated seams from tickets 08 and 09: product setup through `createDesigner({ schema?, materials })`, pure-data delivery through `DesignerInstance.exportSchema()` / `importSchema()`, and an autonomous Guide Runtime consuming only `DocumentSchema`.
- Consumer inventory exposed a genuine accepted-interface gap before the first red cycle: Phase 7 requires preserving Playground and Guide host confirmation UX, but the replacement public interface has no host confirmation adapter.
- `DcStructurePanel` and `InteractionPlane` directly execute `remove-node` and discard the returned `confirmation-required` state. The only implemented retry contract is for a caller to send the same closed Action with `confirmed: true`; `DcDesigner` has no public way to ask its host to do that.
- Created open Wayfinder ticket 13, `Authoring 确认与宿主交互契约`, to decide the missing seam. No accepted interface, test, consumer or production implementation was changed.

Actual commands and results:

- `rg -n "createConfirmActionInterceptor|actionInterceptor|interceptor|confirmation-required|confirmed: true|confirm\\(" packages playground examples --glob '!**/dist/**' --glob '!**/node_modules/**'`: found legacy confirmation setup only in the two Phase 7 consumers, and the replacement confirmation state only inside Authoring Engine/types/tests; no replacement host adapter exists.
- `rg -n "execute\\(\\{ type: '(remove-node|unwrap-container|duplicate-node|move-node)'|remove-node|unwrap-container" packages/designer/src --glob '*.ts'`: found direct workbench remove execution in `packages/designer/src/components/DcStructurePanel.ts` and `packages/designer/src/presentation/interaction-plane.ts`; neither call site handles confirmation.
- `pnpm --filter @dragcraft/designer test --run src/authoring/create-authoring-engine.test.ts -t 'requires explicit confirmation'`: passed, 1 test passed and 19 skipped. The existing test verifies that the Engine returns `confirmation-required` first and commits only after `confirmed: true`.
- `pnpm --filter playground build`: failed after 3193 modules transformed because the unchanged Phase 7 field consumer imports removed `useI18n` from `@dragcraft/designer`.
- `pnpm --filter guide-project test --run src/editor/create-page-designer.test.ts`: failed before collecting tests because the unchanged Phase 7 guide imports removed `defineContainerWidget`.
- `git status --short --branch` before the discovery: clean on `refactor...origin/refactor`.

No red-green implementation claim is made: the accepted-interface blocker was identified before a Phase 7 test seam could be exercised, so development stopped as required.

## Wayfinder Ticket 13 Decision

- Ticket 13 is resolved. `createDesigner()` gains an optional `confirmAuthoringAction(request)` host seam accepting a minimal `{ action, code, materialType, nodeId? }` request and returning `boolean | Promise<boolean>`.
- `DesignerInstance.execute()` remains synchronous and does not invoke host confirmation. Programmatic callers continue to handle `confirmation-required` and explicitly retry with `confirmed: true`.
- All Schema Actions originating inside `DcDesigner`, including structure controls, Interaction Plane, drag/drop, inspector edits and `MaterialPreviewContext.updateSelf()`, use one private coordinator and the same Engine write path.
- Confirmation is fail-closed and single-flight. Missing callbacks, cancellation, callback failure, a changed immutable Schema reference or `dispose()` discard the retained Action without a commit; pending state is not public.
- Batch results identify the first protected child with `actionIndex`; confirmed children are retried in order and the batch commits atomically only after every required confirmation succeeds.
- No action interceptor, custom command, `window.confirm()` default, product modal dependency, second write path or confirmation state in Schema/history is introduced.
- Ticket 13 supersedes only the confirmation portions of tickets 07 and 08. `CONTEXT.md` and the architecture map now reflect the decision.
- Phase 7 implementation did not resume during the decision session.
- `test "$(sed -n '3p' .scratch/layout-semantic-architecture/issues/13-authoring-confirmation-host-contract.md)" = "Status: resolved"`: passed.
- `rg -n "Authoring Confirmation|Authoring 确认与宿主交互契约|confirmAuthoringAction|actionIndex" CONTEXT.md .scratch/layout-semantic-architecture/map.md .scratch/layout-semantic-architecture/issues/13-authoring-confirmation-host-contract.md .scratch/layout-semantic-architecture/implementation-progress.md`: found the expected glossary, map, ticket and progress entries.
- `git diff --check`: passed.
- `git status --short --branch`: reported only the four decision artifacts: `CONTEXT.md`, the architecture map, the implementation progress and ticket 13; no implementation file changed.

## Phase 7 Implementation

- Implemented resolved Wayfinder ticket 13 through the optional `createDesigner({ confirmAuthoringAction })` host seam and the minimal frozen `AuthoringConfirmationRequest`. `DesignerInstance.execute()` remains synchronous and never invokes the callback.
- Added one private confirmation coordinator for every `DcDesigner` Schema Action source: structure tree, Interaction Plane and material `updateSelf()`, drag/drop, inspector/property edits, undo and redo controls and keyboard shortcuts.
- Confirmation is fail-closed and single-flight. Selection and hover remain responsive while Schema/history Actions are blocked; cancellation, callback throw/rejection, stale Schema references and disposal cannot commit a retained Action.
- Added batch `actionIndex` to identify the first unconfirmed child. Protected children are confirmed sequentially and the complete batch commits once with one history entry only after all confirmations succeed.
- Rebuilt Playground materials as direct `MaterialDefinition` values and all templates as flat `DocumentSchema` values with stable one-level regions. E-commerce covers navbar, tab bar, FAB, long content, measured top/bottom reservations and a Headless analytics material; content detail covers single/irregular containers and root/region moves; product detail covers ordinary content, fixed purchase actions and an overlay dialog.
- Playground now creates the Designer through the accepted public seam, uses the public Ant Design Vue field adapter, retains Device Frame switching, template switching, locale switching, material search, inspector, four-state import/export validation and host-owned Ant Design confirmation UX. Locale changes rebuild the Designer from its exported Schema and dispose the prior instance.
- Rebuilt Guide minimal/full setup around `createDesigner({ schema, materials })`, changed persistence to `DocumentSchema`, removed migration and legacy action/extension examples, and retained host-owned confirmation through `window.confirm()` supplied only by the Guide.
- Replaced the Guide production Runtime with an autonomous pure-data consumer. It imports only public `DocumentSchema`/`NodeDefinition` types, owns its node registry and mount policy, and interprets `structure.containers` directly without Material Definition, Presentation, Resolver, Designer internals or a shared production renderer.
- Added a Guide host regression that keeps the loaded revision status after import. The document watcher uses synchronous flushing so the import's dirty notification occurs before the host writes the final loaded status.
- No accepted public interface changed beyond resolved Wayfinder ticket 13, and no new architecture gap appeared. No new Wayfinder ticket was created.

## Phase 7 Red-Green Evidence

Each slice began with a failing behavior assertion or failing product-consumer gate, followed by only the implementation needed for that slice. The retained tests exercise the accepted Authoring Engine, public Designer, workbench, product consumer and autonomous Runtime seams.

| Cycle | Directed command | Observed red | Following green |
| --- | --- | --- | --- |
| 1 | `pnpm --filter @dragcraft/designer test --run src/authoring/create-authoring-engine.test.ts` | protected batch result omitted the required child `actionIndex` | engine suite passed with the exact first protected child index |
| 2 | `pnpm --filter @dragcraft/designer test --run src/workbench-cutover.test.ts` | a protected structure-tree action never delivered a host confirmation request | workbench requested confirmation and retried through the same Engine seam |
| 3 | `pnpm --filter @dragcraft/designer test --run src/authoring/create-authoring-confirmation-coordinator.test.ts` | the atomic protected batch produced no first request | coordinator confirmed children in order and committed one history entry |
| 4 | same coordinator command | cancellation left the coordinator pending and blocked a later attempt | cancellation failed closed and a later attempt could request confirmation |
| 5 | `pnpm --filter @dragcraft/designer test --run src/workbench-cutover.test.ts` | material preview `updateSelf()` bypassed host confirmation | preview self-updates used the same private coordinator |
| 6 | `pnpm exec vitest run playground/src/components/widgets/mini-program.test.ts` | the e-commerce consumer failed at import because `defineContainerWidget` no longer exists | direct materials and the e-commerce `DocumentSchema` round-tripped through Designer |
| 7 | `pnpm exec vitest run playground/src/components/widgets/container.test.ts` | the content template resolved as `rejected` | one-level container definitions passed and root/region sorting and moves committed |
| 8 | `pnpm exec vitest run playground/src/components/widgets/mini-program.test.ts` | the product template resolved as `rejected` | ordinary content, purchase bar and overlay dialog passed and round-tripped |
| 9 | `pnpm --filter ./playground build` | build failed because the old field layer imported removed `useI18n` | public field adapter cutover built successfully after 3190 modules transformed |
| 10 | `pnpm --filter guide-project test --run src/editor/create-page-designer.test.ts` | Guide setup failed at import because `defineContainerWidget` no longer exists | full/minimal public setup and history behavior passed |
| 11 | `pnpm --filter guide-project test --run src/runtime/RuntimePage.test.ts` | the old Runtime interpreted `DocumentSchema` as a legacy runtime registry/layout plan | autonomous structure and host mount-policy tests passed |
| 12 | `pnpm --filter guide-project typecheck` | the first green attempt found stale Designer declarations and one `DragEvent` fixture cast | Designer build refreshed declarations, the fixture was corrected, and Guide typecheck passed |
| 13 | `pnpm exec tsc -p playground/tsconfig.json` | the first consumer check found seven local `JsonObject`/Vue component typing errors | local types were tightened and the same TypeScript check passed |
| 14 | `pnpm --filter guide-project test --run src/App.test.ts` | 1/1 failed: expected `已加载草稿修订号 3`, received `有未保存的更改` | 1 file and 1/1 test passed after the document watcher used `flush: 'sync'` |

Review retained the accepted deep modules and removed the old consumer layers instead of wrapping them: Playground custom field wrappers/messages, Guide command/interceptor/migration examples, and the shared Runtime layout/placement implementation and its implementation-coupled tests were deleted. No compatibility alias, generic interceptor or shared production renderer was introduced.

Two failed verification attempts are retained explicitly:

- Running `pnpm --filter @dragcraft/designer typecheck` concurrently with `pnpm --filter @dragcraft/designer build` failed because the build cleaned `dist` while the public-consumer fixture resolved the package; after the build completed, the same typecheck passed. This was a command race, not a source failure.
- The first `pnpm --filter guide-project typecheck` after adding `App.test.ts` rejected spreading `NodeListOf<HTMLButtonElement>` because the repository does not enable `DOM.Iterable`; replacing the test-only spread with `Array.from()` made the same typecheck pass without changing tsconfig or production behavior.

## Phase 7 Verification Evidence

Directed product and package checks:

- `pnpm exec eslint packages/designer/src playground/src examples/guide-project/src`: passed with no output after mechanical import-order fixes.
- `pnpm --filter @dragcraft/designer test --run`: passed, 19 files and 110 tests.
- `pnpm --filter @dragcraft/designer build`: passed; theme contract, tsdown/publint, exact package exports and the public-consumer fixture all passed.
- `pnpm --filter @dragcraft/designer typecheck`: passed after the sequential rebuild described above.
- `pnpm exec vitest run playground/src/components/widgets/container.test.ts playground/src/components/widgets/mini-program.test.ts`: passed, 2 files and 4 tests.
- `pnpm exec tsc -p playground/tsconfig.json`: passed with no output.
- `pnpm --filter ./playground build`: passed after 3190 modules transformed; only the existing chunk-size warning remains.
- `pnpm --filter guide-project test --run`: passed, 5 files and 10 tests.
- `pnpm --filter guide-project typecheck`: passed.
- `pnpm --filter guide-project build`: passed after 3190 modules transformed; only the existing chunk-size warning remains.

Final repository gates were executed sequentially in the required order:

- `pnpm build`: passed, 12/12 tasks. Designer package exports/public consumer passed; Guide and Playground both built.
- `pnpm lint`: passed; `public package boundary valid` and `obsolete package removal valid`.
- `pnpm typecheck`: passed after 9/9 package builds and the root `tsc`.
- `pnpm test`: passed after 9/9 package builds. Every recursive suite passed, including Core 65, Designer 110, device-frames 14, form-generator 86 and Guide 10 tests. Playground has no package test script, so its 2 files and 4 tests were run explicitly above.

Final conformance audits:

- `rg -n "DesignerSchema|WidgetDefinition|defineContainerWidget|defineWidget|createEngine|useDesigner|EventName|createConfirmActionInterceptor|actionInterceptor|ContainerRegionOutlet|RuntimeRenderer|schemaMigrations|CommandType" playground/src examples/guide-project/src --glob '!**/dist/**'`: only `updateEventName` matched the broad `EventName` substring; no legacy consumer symbol or protocol remains.
- `rg -n --pcre2 "from\\s+['\"]@dragcraft/(?!designer(?:/|['\"])|device-frames(?:/|['\"])|fields-[^/'\"]+(?:/|['\"]))" playground/src examples/guide-project/src`: no matches; product consumers import only allowed public packages.
- `rg -n "MaterialDefinition|Presentation|Resolver|DesignerRegionOutlet|@dragcraft/core|@dragcraft/renderer|@dragcraft/widgets" examples/guide-project/src/runtime`: no matches; the Guide Runtime remains autonomous.
- `rg -n "structuredClone" packages/designer/src playground/src examples/guide-project/src`: no matches.
- `git diff --check`: passed.
- `git diff --name-only -- .github docs .scratch/layout-semantic-architecture/implementation-plan.md .scratch/layout-semantic-architecture/map.md .scratch/layout-semantic-architecture/issues`: no output. Phase 8 architecture/docs and accepted decision artifacts were not modified.

Automated Phase 7 implementation is complete. The Playground human acceptance checklist below remains unchecked because browser geometry and interaction quality require human acceptance; no agent acceptance claim is made.

## Phase 1-7 UI Parity Audit

The audit compared the replacement branch with `origin/main` under the accepted constraint that Phase 1-7 may replace logic and internal module ownership but must preserve the existing Designer UI and interaction behavior.

Confirmed implementation defects that do not require a public interface change:

- Device Frame topology places Document and Viewport planes below the host shell, but `structure.css` targeted only direct ApplicationSurface children; ApplicationSurface also clipped its sibling Interaction Plane.
- NodeHost made the complete preview draggable and the selected-node toolbar omitted the established drag affordance.
- Catalog-only/headless materials without `panel` metadata were exposed as draggable material-panel items.
- Further review found unresolved Phase 4/5 parity defects: NodeHost does not project persisted `node.style`; toolbar positioning remains on the trailing side with hard-coded English labels; empty/end drop feedback and forbidden-state feedback are incomplete; palette group labels are raw keys; main's node-handle/selection-edge/forbidden/empty-state theme recipes and Playground empty state were removed; and the rewritten Playground inspector/field presentation differs from main. These remain unmodified after the architecture stop below.
- Consumer presentation code also introduced `--pg-*` and `--guide-*` implementation variables instead of the required `--dc-internal-<owner>-<name>` convention. This is UI scope/standards drift, not part of the accepted logical refactor.

Completed red-green slices before the stop:

| Cycle | Directed command | Observed red | Following green |
| --- | --- | --- | --- |
| 1 | `pnpm --filter @dragcraft/designer test --run src/presentation/structure-css.test.ts` | 1/1 failed because ApplicationSurface had `overflow: hidden`; shell-nested Document/Viewport selectors also no longer represented the real topology | 1 file and 1/1 test passed after the public structural stylesheet allowed Interaction Plane overflow and selected shell-nested planes |
| 2 | `pnpm --filter @dragcraft/designer test --run src/presentation/application-surface.test.ts -t 'starts node dragging from the selected-node toolbar affordance'` | 1 failed and 26 skipped because `[data-dc-action="drag"]` was absent | 1 passed and 26 skipped after drag callbacks moved from the complete NodeHost to the selected-node toolbar affordance |
| 3 | `pnpm --filter @dragcraft/designer test --run src/components/DcDesigner.test.ts -t 'omits catalog-only materials from the material panel'` | 1 failed and 3 skipped; actual titles were `['hidden', 'Visible']` instead of `['Visible']` | 1 passed and 3 skipped after the panel projection ignored materials without `panel` metadata |

Architecture stop:

- Main switches locale through the same Designer session's mutable i18n controller. The replacement public `DesignerInstance` has no locale operation and `CreateDesignerOptions.locale` is initialization-only.
- Phase 7 currently exports the Schema, disposes the Designer and creates a new instance when locale changes. This preserves only Schema data and loses selection, hover, undo/redo history, pending confirmation and preview-local state.
- Preserving the accepted UI behavior requires a new or changed public locale seam. Open Wayfinder ticket 14, `Designer 运行时本地化宿主契约`, records the conflict and required decision.
- Development stopped before writing a locale test or changing a locale/public interface. The accepted plan, resolved tickets and `CONTEXT.md` were not modified.

Actual audit commands and results:

- `git merge-base origin/main HEAD`: returned `2a7e45b8973eb879dfca2a10d58827886a70fccf`; `origin/main` is the exact branch base.
- `git diff --name-status origin/main...HEAD`: showed the Phase 1-7 replacement, including Designer presentation/workbench/theme and Playground consumer files.
- `git log --reverse --format='%h %s' origin/main..HEAD`: showed the accepted-plan commit followed by Phase 1-7 implementation commits through `e6c34ff`.
- `git diff --numstat origin/main...HEAD -- packages/designer/theme/baseline/recipes.css playground/src/App.vue playground/src/components/widgets/basic.ts playground/src/components/widgets/container.ts`: showed substantial UI rewrites in each file, including 13 additions/142 deletions in the Designer interaction recipes and 48 additions/121 deletions in Playground App.
- `rg -n -- "--(?:pg|guide)-" playground/src/components/widgets packages/designer examples/guide-project/src/domain/widgets`: found the new Playground container/divider and Guide container implementation variables outside the required prefix convention.
- `rg -n "readonly locale|setLocale|getDesignerInternals|toggleLocale" packages/designer/src/session packages/designer/src/index.ts packages/designer/src/public-interface.test.ts packages/designer/fixtures/public-consumer/consumer.ts playground/src/App.vue`: found initialization-only `locale?: string`, private `DesignerInternals.i18n`, and the Playground recreation path; no public runtime locale operation exists.
- `sed -n '108,119p' playground/src/App.vue`: showed `toggleLocale()` exporting the Schema, disposing the current Designer and creating a replacement instance.
- `git diff --check`: passed before the ticket/progress edits.

Verification after the architecture stop:

- `pnpm build`: failed with 8 successful tasks out of 10 reached. `@dragcraft/docs` reported 7 `ENOENT` errors because VitePress code includes still reference Phase 6/7-deleted Guide files including `runtime/layout.ts`, `editor/actions.ts`, `editor/extensions.ts`, `editor/messages.ts` and `editor/schema-migrations.ts`; Turbo then cancelled the concurrent Designer build. This is a real repository gate failure and was not changed because docs are assigned to Phase 8.
- `pnpm --filter @dragcraft/designer build`: theme contract, interaction recipes, tsdown/publint and package exports passed. Its final public-consumer command failed because the ignored package-local `node_modules/.bin/tsc` still targets absent `typescript@6.0.3`, while the frozen lockfile resolves 5.9.3.
- `pnpm install --frozen-lockfile --offline --trust-lockfile`: passed with `Already up to date`; `pnpm install --frozen-lockfile --offline --force --trust-lockfile` also passed with `Already up to date`. Neither command rewrote the stale package-local generated shim, and no manifest or lockfile changed.
- `pnpm exec tsc -p packages/designer/fixtures/public-consumer/tsconfig.json`: passed using the root lockfile-resolved TypeScript 5.9.3 binary.
- `pnpm exec tsc -p packages/designer/tsconfig.json`: passed with no output.
- `pnpm exec eslint packages/designer/src/components/DcDesigner.test.ts packages/designer/src/components/DcMaterialPanel.ts packages/designer/src/composables/useDragDrop.test.ts packages/designer/src/presentation/application-surface.test.ts packages/designer/src/presentation/application-surface.ts packages/designer/src/presentation/interaction-plane.ts packages/designer/src/presentation/node-host.ts packages/designer/src/presentation/structure-css.test.ts`: first failed only on one padded blank line added by this audit; after removing that line, the exact command passed with no output.
- `pnpm --filter @dragcraft/designer test --run`: first run passed 18 files and failed the legacy drag/drop test because it still fired `dragstart` on the complete NodeHost. After updating that integration test to select the node and use the restored toolbar affordance, the same command passed 19 files and 112/112 tests.
- `pnpm exec tsc`: passed with no output after all audit test edits.
- `pnpm --filter @dragcraft/core test --run`: passed 2 files and 65/65 tests, covering the retained Phase 1 Resolver and Phase 2 Editor suites.
- `pnpm --filter @dragcraft/device-frames test --run`: passed 3 files and 14/14 tests.
- `pnpm --filter guide-project test --run`: passed 5 files and 10/10 tests.
- `pnpm exec vitest run playground/src/components/widgets/container.test.ts playground/src/components/widgets/mini-program.test.ts`: passed 2 files and 4/4 tests.
- `pnpm check:public-boundary`: passed with `public package boundary valid`.
- `pnpm check:obsolete-protocols`: failed with `packages/renderer still exists`. Read-only follow-up showed no tracked file under `packages/renderer`; the ignored directory contains only stale `dist`, `node_modules` and `.turbo` artifacts from before package deletion. The audit did not delete these local generated artifacts after the architecture stop.
- `test "$(sed -n '3p' .scratch/layout-semantic-architecture/issues/14-runtime-designer-locale-contract.md)" = "Status: open"`: passed.
- `git diff --check`: passed after the implementation, ticket and progress edits.

## Wayfinder Ticket 14 Decision

- Ticket 14 is resolved. The public seam is the dedicated `DesignerInstance.localization` deep module with a read-only locale, synchronous `setLocale(locale)` and `translate(key, fallback?)`; the private `I18nInstance`, writable locale and runtime `mergeMessages()` remain hidden.
- Designer Localization updates all Designer-owned and Form Generator key-based text. Material groups resolve `group.${group}` with raw-group fallback, and host UI such as DevicePicker consumes the same `translate()` function. Material Preview remains user-owned and receives no localization context.
- Locale changes preserve Designer identity, Document reference, selection, hover, history, pending confirmation and mounted Preview instances. They create no Action, Operation, history entry or diagnostic, and they do not re-invoke a pending confirmation callback.
- Locale keys are exact and case-sensitive. Unknown non-empty locales are accepted with fallback/key resolution; empty or runtime non-string values throw `TypeError` without mutation. After `dispose()`, localization remains readable and `setLocale()` is a no-op.
- Ticket 14 supersedes only the runtime localization portion of ticket 08. The decision session updated `CONTEXT.md`, tickets 08 and 14, the architecture map and this progress file; no production implementation or test was changed during the decision.
- Phase 7 implementation did not resume in this decision session.
- `test "$(sed -n '3p' .scratch/layout-semantic-architecture/issues/14-runtime-designer-locale-contract.md)" = "Status: resolved"`: passed.
- The first consistency-search attempt used a double-quoted pattern containing Markdown backticks; zsh tried to execute `DesignerInstance.localization` and printed `command not found`, so that attempt was discarded as invalid verification.
- `rg -n 'Designer 本地化|DesignerInstance\.localization|DesignerLocalization|Ticket 14|ticket 14|Superseded in part by:.*14' CONTEXT.md .scratch/layout-semantic-architecture/map.md .scratch/layout-semantic-architecture/issues/08-public-designer-contract.md .scratch/layout-semantic-architecture/issues/14-runtime-designer-locale-contract.md .scratch/layout-semantic-architecture/implementation-progress.md`: passed and found the glossary term, ticket 08 supersede marker, resolved ticket interface, map decision and progress entries.
- `git status --short -- CONTEXT.md .scratch/layout-semantic-architecture/map.md .scratch/layout-semantic-architecture/issues/08-public-designer-contract.md .scratch/layout-semantic-architecture/issues/14-runtime-designer-locale-contract.md .scratch/layout-semantic-architecture/implementation-progress.md`: listed exactly the five decision artifacts, with ticket 14 still untracked because it was created during the preceding UI audit.
- `git diff --check`: passed.

## Wayfinder Ticket 12 Decision

- Ticket 12 is resolved: `MaterialPreviewContext.invokeAction(name, payload?)` is deleted from the accepted public interface.
- No named material action registry, payload contract, compiler, material-action `AuthoringAction` variant, deprecated method, rejecting placeholder or compatibility alias will be added.
- Preview Schema writes are limited to `updateSelf()` through Authoring Policy, Schema Editor, commit and history. Workbench structure operations continue to produce the existing closed `AuthoringAction` values.
- Material-owned external side effects remain in material Vue or host state and do not enter Dragcraft authoring or history.
- Ticket 12 supersedes only the `invokeAction()` portions of tickets 06 and 08. `CONTEXT.md` and the architecture map were updated to match.
- Phase 4 resumed only after this decision and completed before the Phase 5 work recorded above began.
- `test "$(sed -n '3p' .scratch/layout-semantic-architecture/issues/12-material-preview-action-contract.md)" = "Status: resolved"`: passed.
- `git diff --check`: passed.
- `git diff --name-only`: reported only `CONTEXT.md`, the implementation progress, the architecture map and tickets 06, 08 and 12; no implementation file changed.

## Phase 1-7 UI Parity Implementation

Implementation resumed only after Wayfinder ticket 14 resolved the runtime localization interface. The accepted public seams remained the public consumer, mounted `DcDesigner` / Application Surface Vue integration and the existing CSS/theme contract.

Completed UI corrections:

- Implemented the resolved `DesignerInstance.localization` deep module with read-only locale, synchronous `setLocale()` and `translate()`. Playground locale changes retain the same Designer instance, Document, selection and history; DevicePicker consumes the same translator.
- Restored localized Material groups/cards, Structure Panel and toolbar action text. Group keys use `group.${group}` with raw-key fallback.
- Projected persistent `node.style` onto the unique NodeHost and restored toolbar anchoring/orientation, stable action dimensions, drag cursor and toolbar-owned node dragging.
- Restored root/region empty, start and end drop feedback, policy/Core forbidden preflight feedback, default empty state, root four-edge selection, hovered-node handle and the corresponding Standard-theme recipes.
- Replaced `--pg-*` / `--guide-*` variables with `--dc-internal-playground-*` / `--dc-internal-guide-*`.
- Restored Playground Material/Form localization, all main-compatible Basic/Form/Mini inspector field sets, Color/Array/Spacing field adapters and their styles. Spacing binds to accepted `style.margin` / `style.padding` CSS shorthand paths and writes through the existing node binding interface.
- Updated the theme manifest for the emitted `empty-state`, `node-handle`, selection-edge, drop and forbidden hooks; no TypeScript public interface changed.

### UI Red-Green Evidence

The earlier Designer slices used directed tests at the agreed mounted/public seams. Effective red tests covered:

- `src/session/create-designer.test.ts`: same-session localization, invalid values and dispose behavior.
- `src/components/DcDesigner.test.ts`: material group localization and catalog-only material filtering.
- `src/presentation/application-surface.test.ts`: node style, hover handle, empty root/region and end feedback, toolbar drag affordance and forbidden feedback.
- `src/presentation/structure-css.test.ts`: toolbar geometry, default empty state, four-edge root selection, hover handle and forbidden recipes.
- `src/composables/useDragDrop.test.ts`: denied-material preflight without commit/history mutation.
- `src/components/DcStructurePanel.test.ts`: localized Structure actions.

Playground vertical slices and their actual commands/results:

| Cycle | Directed command | Observed red | Following green |
| --- | --- | --- | --- |
| Locale groups | `cd playground && pnpm exec vitest run --config vite.config.ts src/App.test.ts` | 1/1 failed because English group titles remained `basic`, `form`, `navigation`, `action`, `layout` | 1/1 passed after Playground messages and same-session translation were connected |
| Material cards | same App command | 1/1 failed: all cards except Text remained Chinese and Navigation Bar was missing | 1/1 passed with all 19 translated cards, including Navigation Bar |
| Inspector messages | `cd playground && pnpm exec vitest run --config vite.config.ts src/components/widgets/localization.test.ts` | 1/1 failed because the first required section key was `undefined` | 2/2 passed after all current Material/global sections, labels, placeholders and options resolved in `zh-CN` and `en` |
| Tab fields | `cd playground && pnpm exec vitest run --config vite.config.ts src/App.test.ts -t "preserves the tab bar"` | 1 failed and 1 skipped because 0 Array items were rendered instead of 4 | 1 passed and 1 skipped after local Array/Color adapters; adding item 5 also updated the Tab Bar preview |
| Spacing | `cd playground && pnpm exec vitest run --config vite.config.ts src/App.test.ts -t "preserves spacing"` | 1 failed and 2 skipped because 0 Spacing controls were rendered instead of 2 | intermediate red showed whole `style` replacement is outside the binding interface; final 1 passed and 2 skipped with `style.margin` / `style.padding` shorthand and live NodeHost projection |
| Basic/Form parity | `cd playground && pnpm exec vitest run --config vite.config.ts src/components/widgets/localization.test.ts -t "preserves the basic"` | 1 failed and 1 skipped; Button lacked the `type` field | 2/2 localization-contract tests passed after all Basic/Form field sets matched main |
| Mini parity | `cd playground && pnpm exec vitest run --config vite.config.ts src/components/widgets/localization.test.ts -t "preserves the mini-program"` | 1 failed and 2 skipped; Floating Button had no non-spacing fields | 3/3 localization-contract tests passed after Floating Button and Swiper inspector behavior was restored |

Two setup failures were not counted as red: running the Playground test from the repository root could not resolve Vue, and running before Designer `dist` existed could not collect the test. `pnpm --filter @dragcraft/designer exec tsdown` then passed before the effective Playground red cycles.

### Ticket 15 Architecture Stop

- Main's Playground-specific empty state used deleted `rendererExtensions.emptyState` to render phone/arrow icons and idle/drag-over copy.
- Current `DesignerExtensions` exposes rail, panel and material-item adapters only. Application Surface owns a hard-coded framework empty-state VNode and does not expose its internal drag state.
- CSS/message overrides cannot legally mount the original Vue icons or reproduce its drag-over content. Exact parity therefore requires a new or changed public interface.
- Created open Wayfinder ticket 15, `Designer 空态展示扩展契约`. No empty-state interface, export, public test or product implementation was added after the gap was confirmed.

### UI Verification Evidence

- `pnpm --filter @dragcraft/designer test --run`: passed 19 files and 127/127 tests after formatting.
- `cd playground && pnpm exec vitest run --config vite.config.ts`: passed 4 files and 10/10 tests.
- `pnpm --filter @dragcraft/core test --run`: passed 2 files and 65/65 tests.
- `pnpm --filter @dragcraft/device-frames test --run`: passed 3 files and 14/14 tests.
- `pnpm --filter guide-project test`: passed 5 files and 10/10 tests.
- `pnpm --filter playground build`: passed after 3194 modules; Vite emitted only the existing large-chunk warning.
- In-app browser at `http://localhost:9981/`: desktop 1280x720 reported body width 1280, Designer 1280x672, 19 Material cards, 20 visible NodeHosts and 0 recovery/diagnostic elements. Tab Inspector rendered one Array, three Color and two Spacing controls with property-panel `scrollWidth === clientWidth === 275`; locale switch showed `Basic/Form/Navigation/Action/Layout`, `Tab list`, English section titles and `Preview device`. Mobile 390x844 reported body width 390, a two-row 88px header and a 390x756 Designer with no horizontal page overflow or visible element overlap.
- `pnpm --filter @dragcraft/designer generate:theme-contract && pnpm --filter @dragcraft/designer check:theme`: first check failed because the new DOM hooks were absent from the manifest; after declaring the already-emitted hooks it passed with `theme contract valid: 61 tokens, 29 components` and `theme interaction recipes valid`.
- `rg -n --glob '!**/dist/**' -- '--(?:pg|guide)-' playground/src examples/guide-project/src`: no output, exit 1, confirming no forbidden short implementation prefix remains.
- `pnpm exec tsc -p packages/designer/fixtures/public-consumer/tsconfig.json` and `pnpm exec tsc -p examples/guide-project/tsconfig.json`: both passed with no output using root TypeScript 5.9.3.
- `pnpm build`: reached 8 successful tasks out of 10 and failed only in Phase 8 docs with 7 `ENOENT` includes for Guide files removed by Phase 6/7; Turbo cancelled the concurrent Designer build.
- First `pnpm lint` failed with 106 auto-fixable formatting errors in UI files. After targeted `pnpm exec eslint --fix ...`, the second `pnpm lint` passed ESLint and `public package boundary valid`, then failed only because ignored generated `packages/renderer` remnants still exist.
- `pnpm typecheck`: built 8/9 package tasks; Designer theme, bundle, publint and package exports passed, then its package-local generated `.bin/tsc` failed because it still targets absent `typescript@6.0.3`. Frozen/offline install and `--force` both reported `Already up to date`; the equivalent root TypeScript 5.9.3 public-consumer and Guide commands above passed.
- `git diff --check`: passed after all UI implementation, formatting, theme manifest, ticket and progress edits.

## Playground Human Baseline

The following Phase 0 items remain intentionally unconfirmed and must not be marked passed by an agent:

- [ ] Toolbar actions and toolbar positioning.
- [ ] Node selection and selection outline feedback.
- [ ] Root-level drag, reorder, and drop feedback.
- [ ] Container child drag, reorder, and root/container moves.
- [ ] Structure tree selection and ordering stay synchronized with the canvas.
- [ ] Inspector property editing updates the selected node correctly.
- [ ] Undo and redo restore the expected document and selection behavior.
- [ ] Import and export preserve the current document and confirmation behavior.
- [ ] Template switching loads the selected template and retains expected confirmation behavior.
- [ ] Device Frame switching updates the preview frame without breaking Designer interaction UI.

## Blockers

- Phase 0 cannot be marked complete until the user confirms the playground human baseline.
- No automated Phase 1 blocker or failure remains.
- No automated Phase 2 blocker or failure remains.
- Phase 5 automated UI parity is complete; Playground human acceptance remains open.
- No tracked-source Phase 6 package or protocol reference remains.
- Phase 6 tracked-source removal is complete, but the current worktree's obsolete-protocol command remains red until ignored generated remnants under `packages/renderer` are removed outside this architecture decision stop.
- No accepted-interface blocker remains from Wayfinder ticket 14; Phase 7 uses the resolved localization contract.
- Open Wayfinder ticket 15 blocks exact Playground custom empty-state parity because the accepted `DesignerExtensions` interface has no empty-state Adapter.
- The root `pnpm build` gate is red because active VitePress documents include Guide files deleted by Phase 6/7. Correcting those documents belongs to Phase 8 and was not pulled into this Phase 1-7 UI audit.
- Package-manager observation, not an automated baseline failure: a non-frozen catalog resolution currently advances `vitepress@next` to `2.0.0-alpha.19`, whose `vite@^8.2.0` requirement has no stable registry match. The docs dependency was not changed; frozen installation succeeds.
- No accepted-interface blocker remains from Wayfinder ticket 12; Phase 4 automated implementation is complete.
- No accepted-interface blocker remains from Wayfinder ticket 13; Phase 7 completed through the resolved host-confirmation contract.

## Stop Point

- Phase 2 is complete.
- Phase 3 is complete.
- Phase 4 automated UI corrections are complete except exact Playground business empty-state parity, which is stopped on ticket 15.
- Phase 5 automated UI parity is complete.
- Phase 6 is complete.
- Phase 7 public consumer cutover and ticket 14 localization are implemented; ticket 15 and the human Playground acceptance checklist remain open.
- Phase 8 was not started.
