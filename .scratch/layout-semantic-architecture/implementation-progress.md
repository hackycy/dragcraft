# Layout Semantic Architecture Implementation Progress

Updated: 2026-08-06 15:22 CST

## Phase Status

- Phase 0: automated baseline and guardrails complete; playground baseline awaiting user confirmation.
- Phase 1: complete. Final-named DocumentSchema, definition snapshot, Schema Structure Resolver, immutable ResolvedDocument query model, and conformance tests are implemented beside the legacy path.
- Phase 2: complete. The pure Schema Editor, closed operation vocabulary, structural destinations, aggregate bundles, atomic batch execution, and conformance tests are implemented beside the legacy path.
- Phase 3: complete. Material Catalog, Authoring Engine, bounded snapshot history, four-state document session, and controlled DesignerInstance seams are implemented beside the legacy UI path.
- Phase 4: partially implemented. Wayfinder ticket 12 is resolved, but the remaining Phase 4 implementation has not resumed.
- Phase 5: not started and explicitly prohibited until Phase 4 is complete.

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

## Phase 4 Partial Implementation

- Added internal `ApplicationSurface` and `NodeHost` Vue modules beside the legacy Renderer path; no workbench caller was cut over.
- Added ordered Document, Viewport and private Interaction Plane DOM ownership inside the new surface.
- Added distinct visual, headless and unknown material presentation paths. Headless containers create their declared Outlets automatically; unknown containers preserve Schema-owned region children in read-only recovery regions.
- Added `DesignerRegionOutlet` with resolved structural ordering, one-primary-Outlet ownership, missing/duplicate Outlet recovery, default midpoint structural anchors and an optional material geometry resolver.
- Added `PresentationFrame` around the complete NodeHost with missing/duplicate slot recovery.
- Added `DesignerViewportPortal` that moves root-owned NodeHosts into the surface Viewport Plane and recovers region-child attempts in place.
- Added the initial recovery module for missing regions.
- The implementation stopped before Material Preview Context, Geometry Registry, Surface Reservation, complete Interaction Plane behavior, presentation structural CSS, or any workbench cutover.

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

## Phase 4 Architecture Stop

- Wayfinder ticket 12 was created at `.scratch/layout-semantic-architecture/issues/12-material-preview-action-contract.md`.
- Ticket 08 requires `MaterialPreviewContext.invokeAction(name, payload?)` to pass through Authoring Policy, Schema Editor, commit and history.
- The accepted Phase 3 `AuthoringAction` union has no material-action variant, and `MaterialAuthoringDefinition` has no action-name/payload/compiler declaration.
- Implementing a useful `invokeAction()` therefore requires changing the accepted public material or authoring interface. A private callback would bypass the Authoring Engine; an always-rejected placeholder would not implement the accepted behavior.
- Development stopped without choosing either design. No `material-preview-context.ts` file was created and no accepted interface was changed.

## Phase 4 Stop-Point Verification Evidence

- Final directed command `pnpm --filter @dragcraft/designer test --run src/presentation/application-surface.test.ts`: passed, 1 file and 14/14 tests.
- `pnpm --filter @dragcraft/designer typecheck`: failed with four WIP errors: one custom resolver test inference error, two possibly-undefined context errors, and one Vue Teleport overload error.
- `pnpm exec eslint packages/designer/src/presentation`: failed with 12 WIP errors: one test-title rule, one quoted-property rule, nine chaining/quoted-property formatting errors across the new modules, and one additional chaining error.
- `git diff --check`: passed.
- Full repository gates were not run because Phase 4 stopped at an unresolved accepted-interface decision and remains incomplete.
- No Phase 5 module or caller was changed.

## Phase 5 Entry Audit

- The 2026-08-06 Phase 5 request was stopped before the first red cycle because its accepted presentation dependency is incomplete and Wayfinder ticket 12 still records an unresolved change to the accepted public material or authoring interface.
- No Phase 5 test, production module, public export, caller or Phase 6 work was changed. No red-green result is claimed.
- The existing Wayfinder ticket 12 remains the authoritative decision ticket; it was not recreated or replaced.
- `sed -n '178,202p' .scratch/layout-semantic-architecture/implementation-plan.md`: passed; showed the unfinished Phase 4 structural-CSS task immediately before the Phase 5 workbench cutover and public-interface tasks.
- `rg -n "^Status: open$|^Blocks: Phase 4$|Implementing a useful|Phase 5: not started and explicitly prohibited" .scratch/layout-semantic-architecture/issues/12-material-preview-action-contract.md .scratch/layout-semantic-architecture/implementation-progress.md`: passed; reported ticket 12 as `Status: open`, `Blocks: Phase 4`, and the existing Phase 5 prohibition.
- `git ls-remote origin refs/heads/refactor`: passed; remote `refactor` resolved to `3ef3ac1462f6841adb46ff32585d9364e7a91e71`, identical to local HEAD, so no accepted remote resolution is missing locally.
- Pre-audit `git status --short --branch`: passed; reported `## refactor...origin/refactor` with no worktree changes.
- Post-audit `git diff --check`: passed; `git diff --name-only` reported only this progress file.

## Wayfinder Ticket 12 Decision

- Ticket 12 is resolved: `MaterialPreviewContext.invokeAction(name, payload?)` is deleted from the accepted public interface.
- No named material action registry, payload contract, compiler, material-action `AuthoringAction` variant, deprecated method, rejecting placeholder or compatibility alias will be added.
- Preview Schema writes are limited to `updateSelf()` through Authoring Policy, Schema Editor, commit and history. Workbench structure operations continue to produce the existing closed `AuthoringAction` values.
- Material-owned external side effects remain in material Vue or host state and do not enter Dragcraft authoring or history.
- Ticket 12 supersedes only the `invokeAction()` portions of tickets 06 and 08. `CONTEXT.md` and the architecture map were updated to match.
- No implementation phase resumed during the decision session; Phase 4 remains incomplete and Phase 5 remains unstarted.
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
- Package-manager observation, not an automated baseline failure: a non-frozen catalog resolution currently advances `vitepress@next` to `2.0.0-alpha.19`, whose `vite@^8.2.0` requirement has no stable registry match. The docs dependency was not changed; frozen installation succeeds.
- No accepted-interface blocker remains from Wayfinder ticket 12, but Phase 4 is still incomplete.

## Stop Point

- Phase 2 is complete.
- Phase 3 is complete.
- Phase 4 is partially implemented; its accepted public-interface gap is resolved by Wayfinder ticket 12, but implementation has not resumed.
- Phase 5 was not started.
