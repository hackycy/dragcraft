# Layout Semantic Architecture Implementation Progress

Updated: 2026-08-06 22:05 CST

## Phase Status

- Phase 0: automated baseline and guardrails complete; playground baseline awaiting user confirmation.
- Phase 1: complete. Final-named DocumentSchema, definition snapshot, Schema Structure Resolver, immutable ResolvedDocument query model, and conformance tests are implemented beside the legacy path.
- Phase 2: complete. The pure Schema Editor, closed operation vocabulary, structural destinations, aggregate bundles, atomic batch execution, and conformance tests are implemented beside the legacy path.
- Phase 3: complete. Material Catalog, Authoring Engine, bounded snapshot history, four-state document session, and controlled DesignerInstance seams are implemented beside the legacy UI path.
- Phase 4: complete. Designer Presentation replacement is implemented beside the legacy Renderer path and verified through the ApplicationSurface seam.
- Phase 5: complete. The workbench consumes DesignerInstance, the package root uses the accepted allowlist, and public consumer/package/theme validation covers the replacement path.
- Phase 6: complete. Renderer, Widgets, legacy Core protocols, their implementation-coupled tests and obsolete package dependencies are removed; Core is a Vue-free pure module with only the accepted Document, Resolver and Editor interface.
- Phase 7: not started. Playground and guide consumers still use the legacy Designer interface and remain assigned to the next phase.

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
- No automated Phase 5 package blocker remains. Repository build/typecheck/test still encounter the unchanged product consumers assigned to Phase 7.
- No automated Phase 6 blocker or failure remains. Repository build/typecheck/test still stop only at the unchanged product consumers assigned to Phase 7.
- Package-manager observation, not an automated baseline failure: a non-frozen catalog resolution currently advances `vitepress@next` to `2.0.0-alpha.19`, whose `vite@^8.2.0` requirement has no stable registry match. The docs dependency was not changed; frozen installation succeeds.
- No accepted-interface blocker remains from Wayfinder ticket 12; Phase 4 automated implementation is complete.

## Stop Point

- Phase 2 is complete.
- Phase 3 is complete.
- Phase 4 is complete; its accepted public-interface gap was resolved by Wayfinder ticket 12 before implementation resumed.
- Phase 5 is complete.
- Phase 6 is complete.
- Phase 7 was not started.
