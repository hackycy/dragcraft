# Final Fix Report

Base: `cde5b56125bb4148eb8355b678f7b5a4ece02cfc`

## Final Whole-Branch Blocking Fixes

All eight findings in `final-fix-brief.md` were implemented with focused
RED-GREEN coverage before broad verification.

### RED-GREEN Evidence

1. Global ID/root-ID invariant
   - RED: ordinary `ADD_NODE` calls with an existing node ID or the document
     root ID returned success, mutated schema/history, and emitted events.
   - GREEN: `engine.test.ts` now proves both collisions return
     `SCHEMA_NODE_ID_DUPLICATE` with schema, history, `NODE_ADDED`, and
     `SCHEMA_CHANGED` unchanged. Candidate indexing also covers IDs throughout
     container subtrees used by duplication.
2. Authoritative state boundaries and final candidate validation
   - RED: `canPlace` could mutate live schema/container/child data; a nested
     `execute` could create unrelated history/events; renderer runtime arrays
     and nodes were mutable live references; malformed final add/move
     candidates could commit.
   - GREEN: `container-placement.test.ts`, `engine.test.ts`,
     `container-runtime.test.ts`, and add/move command tests prove detached
     callback snapshots, `COMMAND_REENTRANT`, recursively frozen and recursively
     readonly renderer snapshots, and atomic `SCHEMA_CANDIDATE_INVALID`
     rejection.
3. Absolute region-array sortable locks
   - RED: region add/move/remove operations could shift a `sortable:false`
     child, cross-owner moves did not check both arrays, and renderer actions
     stayed enabled.
   - GREEN: add/move/remove command tests cover insert, same-region move,
     cross-owner source removal and target insertion, and removal locks;
     `action-registry.test.ts` covers disabled region actions while preserving
     raw duplication availability for unsorted root nodes.
4. Total malformed runtime validation
   - RED: imports with `regions:null` or non-array nested children threw;
     malformed structure could reach migrations first; invalid root, version,
     and global config shapes could import; and null widget metadata or
     malformed variant/region/constraint values could throw or register.
   - GREEN: `engine.test.ts` proves malformed imports return structural
     diagnostics before migrations without changing the current schema;
     `registry.test.ts` proves malformed top-level metadata and container
     definitions warn once and are not registered.
5. Explicit same-region-ID migration
   - RED: equal region ID sets bypassed `migrateVariant`, so a material could
     not adapt state for changed target constraints.
   - GREEN: `change-container-variant.test.ts` proves an explicit migrator is
     called once and its validated state is committed even when IDs match.
6. Structured variant-denial propagation
   - RED: valid `messageKey` and `details` were dropped, and Designer property
     handlers discarded the command result.
   - GREEN: Core preserves `code`, `messageKey`, `message`, and `details`;
     `usePropertyBinding.test.ts` proves the complete structured denial reaches
     Designer callers.
7. Resolver null invalidates stale destination
   - RED: a resolver returning `null` published nothing, so a prior destination
     in the same region could be committed on drop.
   - GREEN: `ContainerRegionOutlet.test.ts` proves publication of
     `CONTAINER_DROP_NO_TARGET`; `useDragDrop.test.ts` proves the old target is
     cleared and no command/schema mutation occurs on the following drop.
8. Authoritative duplicate destination events
   - RED: `DUPLICATE_NODE` emitted the requested root index even when delegated
     `ADD_NODE` resolved a different mixed-scope array destination.
   - GREEN: `duplicate-node.test.ts` proves the duplicate event uses delegated
     add's committed destination.

Focused GREEN runs after implementation:

- Core changed-file suites: 11 files, 183 tests passed.
- Renderer changed-file suites: 3 files, 48 tests passed.
- Designer changed-file suites: 2 files, 49 tests passed.
- Core, Renderer, and Designer package typechecks passed.

### Final Verification

- `pnpm --filter @dragcraft/core exec vitest run`: 23 files, 313 tests passed.
- `pnpm --filter @dragcraft/renderer exec vitest run`: 13 files, 134 tests passed.
- `pnpm --filter @dragcraft/designer exec vitest run`: 11 files, 88 tests passed.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed after correcting import order, indentation, and test
  statement formatting reported by the first run.
- Sequential `pnpm --filter @dragcraft/core build`, Renderer build, and Designer
  build: passed, including declaration generation and `publint`.
- `pnpm docs:build`: passed (VitePress client/server build and page render).
- `git diff --check`: passed.

### Self-Review

- Command rejection paths mutate neither authoritative schema nor history and
  emit no success/schema-change events.
- External material callbacks receive cloned inputs; renderer runtime consumers
  receive cloned, recursively frozen definitions and nodes.
- Region locks are absolute owner-array indices. Same-region moves apply one
  pre-removal-to-post-removal index adjustment; cross-owner moves validate both
  source removal and target insertion.
- Structural diagnostics run before indexing, so malformed runtime shapes are
  rejected without iterator/property exceptions. Warning-only unresolved
  containers remain importable.
- Candidate validation reports errors belonging to the inserted/moved subtree,
  avoiding a new dependency on unrelated pre-existing diagnostics.
- Explicit variant migrators take precedence; automatic state preservation is
  used only without a migrator when region ID sets match.
- Public result/runtime type changes build across Core, Renderer, Designer, and
  docs. `DEFAULT_SCHEMA_VERSION` remains `1.0.0`.
- No geometry/coordinate ownership was moved into Core or persisted schema; the
  root test glob and its accepted no-match behavior were not changed.
