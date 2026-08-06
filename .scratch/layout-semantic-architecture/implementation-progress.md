# Layout Semantic Architecture Implementation Progress

Updated: 2026-08-06 01:53 CST

## Phase Status

- Phase 0: automated baseline and guardrails complete; playground baseline awaiting user confirmation.
- Phase 1: complete. Final-named DocumentSchema, definition snapshot, Schema Structure Resolver, immutable ResolvedDocument query model, and conformance tests are implemented beside the legacy path.
- Phase 2: not started.

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

## Red-Green Evidence

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

## Review And Verification Evidence

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
- Package-manager observation, not an automated baseline failure: a non-frozen catalog resolution currently advances `vitepress@next` to `2.0.0-alpha.19`, whose `vite@^8.2.0` requirement has no stable registry match. The docs dependency was not changed; frozen installation succeeds.

## Stop Point

- Phase 1 is complete.
- Phase 2 was not started and must remain deferred beyond this task.
