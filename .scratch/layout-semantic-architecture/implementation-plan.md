# layout-semantic-architecture Implementation Plan

## Source Decisions

- [`map.md`](map.md): the canonical architecture, direct refactor policy, no compatibility layer, and final deletion boundary.
- [`issues/01-canonical-schema-model.md`](issues/01-canonical-schema-model.md): `DocumentSchema` stores node definitions and independent structure.
- [`issues/02-layout-capability-algebra.md`](issues/02-layout-capability-algebra.md): layout is a Designer presentation concern and never a Schema field.
- [`issues/03-schema-structure-resolver-output.md`](issues/03-schema-structure-resolver-output.md): `ResolvedDocument` is an internal read model, not a public or session Schema projection.
- [`issues/04-one-level-container-model.md`](issues/04-one-level-container-model.md): container regions are structural ownership facts; recursive children are not supported.
- [`issues/05-declarative-state-and-visibility.md`](issues/05-declarative-state-and-visibility.md): no generic visibility or preview-state protocol is provided by Core or Designer.
- [`issues/06-web-geometry-adapter.md`](issues/06-web-geometry-adapter.md): Designer owns Presentation, geometry, and Region Outlet behavior internally.
- [`issues/07-authoring-operations-model.md`](issues/07-authoring-operations-model.md): Authoring Actions and the Authoring Engine are the only Designer write path.
- [`issues/08-public-designer-contract.md`](issues/08-public-designer-contract.md): public input/output is `DocumentSchema` plus `MaterialDefinition[]`; no renderer interface is public.
- [`issues/09-validation-and-conformance.md`](issues/09-validation-and-conformance.md): each invariant has one owner and one authoritative verification surface.
- [`issues/10-semantic-render-binding.md`](issues/10-semantic-render-binding.md): stable `type` is the only material/render binding key; external consumers own production rendering.
- [`issues/11-interaction-baseline.md`](issues/11-interaction-baseline.md): existing Designer interactions are the executable behavioral baseline.
- [`issues/12-transition-adapter-seam.md`](issues/12-transition-adapter-seam.md): a transition adapter is internal and temporary, and must be deleted after caller cutover.
- [`issues/13-session-state-continuity.md`](issues/13-session-state-continuity.md): session facts and presentation projections are distinct; cutover cannot duplicate state.
- [`issues/14-slice-cutover-order.md`](issues/14-slice-cutover-order.md): cut over read/write and presentation responsibilities in bounded slices.
- [`issues/15-renderer-deletion-gate.md`](issues/15-renderer-deletion-gate.md): six evidence groups are required before physical deletion and the cleanup commit is behavior-free.

## Outcome

The active Designer runtime consumes and exposes the pure `DocumentSchema` contract directly. `ResolvedDocument` remains an internal Core read model; no tree-shaped `DesignerSchema`/`SchemaNode` compatibility projection is created, `schema.import` accepts the same `DocumentSchema` input as the public factory, and no `Renderer*` interface is exported from `@dragcraft/designer`. Legacy protocol files, adapters, exports, package edges, and denylist exceptions are physically removed in one separately verifiable cleanup boundary.

## Non-Negotiable Rules

1. `DocumentSchema` is the only persisted and session document contract; structure is read from `structure.root` and `structure.containers`.
2. Layout, geometry, DOM, presentation, and renderer event behavior are not represented in Schema or projected into a compatibility tree.
3. `ResolvedDocument` and all indexes remain private to Core/Designer implementation modules and are never public exports or `DesignerSession.document` values.
4. One Designer instance has one document, one history, and one active authoring backend; no double read, write, render, or shadow comparison.
5. Public consumers may depend only on `@dragcraft/designer`, `@dragcraft/device-frames`, and approved field packages.
6. Physical deletion is separate from behavior changes; the cleanup slice must be independently reviewable and revertible.

## Gate Overview

| Gate | Name | Unlock condition | Outcome |
| --- | --- | --- | --- |
| G0 | Reproducible convergence guard | start | The stale G9 claim is replaced by a machine-checkable inventory and baseline evidence. |
| G1 | DocumentSchema session cutover | G0 Exit all satisfied | Active session reads use `DocumentSchema` and Core queries without rebuilding a tree projection. |
| G2 | Public presentation boundary | G1 Exit all satisfied | Public Designer exports contain only approved Designer, Schema, material, and PresentationFrame contracts. |
| G3 | Legacy protocol removal | G2 Exit all satisfied | Old Schema/Layout/Renderer protocol and all production callers are removed from source and package graph. |
| G4 | Deletion evidence and closeout | G3 Exit all satisfied | Six deletion evidence groups are independently recorded and the behavior-free cleanup commit is verified. |

## G0: Reproducible Convergence Guard

### Purpose

Reopen the invalidated closeout with traceable evidence. This gate closes the risk that a green test suite and a later feature log can hide active legacy protocol.

### Inputs

- `CLAUDE.md`, `CONTEXT.md`, `map.md`, all `issues/*.md`, and the current `packages/designer/src` and `scripts` sources.
- Existing package scripts: `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:browser`, `pnpm check:public-boundary`, and `pnpm check:obsolete-protocol`.

### Objective

Make the obsolete-protocol checker scan active Designer source and emit a deterministic, path/line/identifier inventory that can be rerun before and after every later gate.

### Scope boundary

Change only the checker, its package invocation, and focused checker tests or evidence files. Do not change runtime behavior or delete protocol code in this gate.

### Constraints

- The checker must include `packages/designer/src` and exclude `.scratch` history.
- Transitional findings may be reported in non-strict inventory mode, but strict mode must fail until the inventory is empty.
- Do not weaken existing tests or add a compatibility alias.

### Slice policy

One slice for scanner coverage and deterministic output; one slice for package invocation and focused regression tests.

### Verification

#### Directed

- Run the checker against a fixture containing `DesignerSchema`, `SchemaNode`, and renderer protocol names; verify every finding includes a stable relative path and line.
- Run the checker in inventory mode against the repository; verify the current violations include `packages/designer/src` and record the output.

#### Repository

1. `pnpm check:obsolete-protocol` in inventory mode.
2. `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm test:browser` in that order.

#### Manual acceptance

无

### Evidence rule

The checker fixture, repository inventory, and ordered repository commands prove scanner coverage and that no runtime behavior changed.

### Stop conditions

- A referenced decision document is missing or no longer resolved.
- The checker cannot distinguish source from `.scratch` history.
- Baseline repository verification fails for a pre-existing reason that cannot be isolated to this gate.

### Rollback

Revert the checker-only slice; no runtime files are touched.

### Exit conditions

1. The checker scans `packages/designer/src` and reports deterministic source findings.
2. Strict mode is available and fail-closed; inventory mode preserves the current baseline without hiding findings.
3. Ordered repository verification passes with no production behavior diff.
4. The runbook records the exact baseline inventory and current source SHA.

## G1: DocumentSchema Session Cutover

### Purpose

Remove the active tree-shaped compatibility projection from `NextDesignerSessionAdapter` and make session document reads use the canonical `DocumentSchema` plus internal resolved queries.

### Inputs

- G0 evidence and `issues/01`, `issues/02`, `issues/03`, `issues/08`, `issues/13`, `issues/14`.
- `packages/designer/src/session/types.ts`, `packages/designer/src/session/next-designer-session-adapter.ts`, and all current session consumers/tests.

### Objective

Expose the current `DocumentSchema` snapshot directly from the session, accept `DocumentSchema` for `schema.import`, and replace tree fields (`root.children`, node `layout`, node `container`) with structure and material queries owned by the session.

### Scope boundary

Session types, adapter projection, action types, and their direct Designer consumers/tests. Presentation visuals and public extension naming remain for G2.

### Constraints

- No `DesignerSchema`, `SchemaNode`, or runtime conversion helper may remain in the active path.
- `ResolvedDocument` may be used only inside the adapter implementation.
- `DocumentSchema` export/import must be JSON round-trip isolated.

### Slice policy

Cut one read cluster at a time: session document snapshot, root/region queries, then action/import consumers. Each cluster must compile and pass its directed tests before the next.

### Verification

#### Directed

- Session contract tests assert identity/owner/order from `DocumentSchema` and reject any tree projection fields.
- Action tests assert `schema.import` accepts `DocumentSchema`, rejected input leaves the active snapshot unchanged, and export round-trips.

#### Repository

1. Focused Designer session/action tests.
2. `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm test:browser`.

#### Manual acceptance

无

### Evidence rule

Directed session/action assertions plus ordered repository/browser runs prove the active runtime has one canonical Schema source and preserved behavior.

### Stop conditions

- A consumer requires a tree-only field; pause and move that interpretation into Designer Presentation instead of restoring a compatibility field.
- Any second Schema/history or runtime conversion appears.

### Rollback

Revert the current session read/write cluster at the `DesignerSession` seam.

### Exit conditions

1. `DesignerSession.document.schema` is `ComputedRef<DeepReadonly<DocumentSchema>>` (or the rejected-state equivalent) and is never rebuilt from a resolved tree.
2. Active source contains no `DesignerSchema` or `SchemaNode`; `schema.import` is typed as `DocumentSchema`.
3. Session and browser behavior remain green with one document/history source.

## G2: Public Presentation Boundary

### Purpose

Close the public package boundary so production consumers receive Schema/material semantics and controlled PresentationFrame extensions, never Renderer interfaces or event-hook protocols.

### Inputs

- G1 evidence and `issues/06`, `issues/08`, `issues/10`, `issues/15`.
- `packages/designer/src/index.ts`, `types.ts`, `presentation/types.ts`, `event-hooks.ts`, and public boundary checks.

### Objective

Remove `RendererExtensions` and `RendererEventHooks` from public exports and options, rename or internalize remaining presentation implementation types, and update consumers to the approved Designer contract.

### Scope boundary

Public exports, public option/context types, package boundary tests, docs/examples imports. Do not delete internal renderer implementation until G3.

### Constraints

- No public compatibility alias or renderer interface.
- PresentationFrame remains the only allowed visual extension boundary.
- Device Frame is the one explicitly authorized Designer-level shell exception: `DcDesigner.deviceFrame` accepts only a readonly `{ id, containerShell }` value, never `createDesigner` options, Schema data, Renderer context, or event hooks.
- Public consumer imports stay within CLAUDE.md allowlist.

### Slice policy

One slice for type/option/export boundary; one slice for consumer fixtures/docs; one slice for allowlist and type-level tests.

### Verification

#### Directed

- Public type tests compile `createDesigner({ schema, materials })` and fail when importing renderer interfaces.
- Boundary scan reports no disallowed `@dragcraft/*` imports or renderer exports.

#### Repository

1. Focused public contract and consumer tests.
2. `pnpm check:public-boundary`.
3. `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm test:browser`.

#### Manual acceptance

无

### Evidence rule

Type-level/public-boundary evidence and ordered workspace/browser verification prove the package contract has no renderer interface.

### Stop conditions

- A consumer needs renderer-specific state or hooks; pause and resolve the boundary in the decision documents rather than adding an alias.

### Rollback

Revert public export and consumer wiring as one package-boundary slice.

### Exit conditions

1. `@dragcraft/designer` exports only approved Schema/material/Designer/Presentation types and values.
2. No `RendererExtensions` or `RendererEventHooks` public import path remains.
3. Public boundary and complete repository/browser verification pass.

## G3: Legacy Protocol Removal

### Purpose

Delete the old Schema/Layout/Renderer protocol and its production callers after the active runtime has fully converged on the new contracts.

### Inputs

- G2 evidence and `issues/09`, `issues/14`, `issues/15`.
- Strict obsolete-protocol inventory, package graph, workspace manifests, CSS entries, docs, examples, playgrounds, and lockfile.

### Objective

Perform a behavior-free cleanup that removes legacy semantic types, renderer interfaces/adapter files, old package edges and denylist exceptions, leaving only the new Core/Designer Presentation path.

### Scope boundary

Only physical deletion, import/export/dependency cleanup, denylist cleanup, and removal of superseded tests/fixtures. No new behavior or visual fixes.

### Constraints

- Cleanup must be a distinct commit boundary and independently revertible.
- Strict source scan covers `packages/designer/src`, all workspace source, docs, examples, playground, manifests, and lockfile; `.scratch` is historical evidence only.
- Preserve behavior tests migrated to the new interface.

### Slice policy

One deletion slice for Designer legacy protocol; one package graph/CSS slice; one documentation/denylist slice. Run strict inventory after each slice.

### Verification

#### Directed

- Strict checker has zero findings for old Schema/Layout/Renderer identifiers and package names.
- Static caller scan proves no active import or factory path reaches the deleted protocol.
- Cleanup diff contains only deletion and reference removal.

#### Repository

1. `pnpm check:public-boundary`.
2. `pnpm check:obsolete-protocol --strict`.
3. `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm test:browser`.

#### Manual acceptance

- Three existing Playground templates and the Guide Project are rechecked after the cleanup commit; record user confirmation before closing this gate.

### Evidence rule

Six evidence groups from `issues/15` are each linked to a directed result, repository run, or manual confirmation. The cleanup commit SHA and strict zero-finding report are mandatory.

### Stop conditions

- Any legacy caller, package edge, CSS import, or strict scan finding remains.
- Cleanup diff contains a behavior change or requires a new compatibility alias.
- Manual acceptance is not explicitly confirmed.

### Rollback

Revert only the independent cleanup commit; do not restore a runtime dual track.

### Exit conditions

1. All six deletion evidence groups are independently recorded and traceable to the current cleanup SHA.
2. Strict source/package/docs scan is empty outside `.scratch` history.
3. Ordered repository/browser verification and manual acceptance pass after cleanup.
4. The effort is complete with no active legacy protocol or public renderer interface.

## G4: Evidence Closeout

### Purpose

Preserve an auditable closeout record after G3 without allowing later feature evidence to overwrite deletion proof.

### Inputs

- G3 cleanup commit and strict scan output.
- `issues/15` six-group checklist and the final runbook ledger.

### Objective

Append immutable, per-group G9 evidence to the runbook with the current source SHA and exact command output references.

### Scope boundary

Runbook evidence and closeout metadata only. No source, package, or behavior changes.

### Constraints

- Never replace deletion evidence with later feature evidence.
- Record the current commit SHA, not a historical SHA.

### Slice policy

One append-only evidence slice covering groups 1-6, followed by one final ledger transition.

### Verification

#### Directed

- Runbook validator confirms hashes, Gate order, strict linear state, and six non-empty evidence groups.

#### Repository

1. `git rev-parse HEAD` and `git diff --check`.
2. Final `pnpm check:obsolete-protocol --strict`.
3. Final ordered repository verification from G3.

#### Manual acceptance

无

### Evidence rule

The runbook entries, cleanup SHA, strict scan report, and final ordered commands provide the complete closeout record.

### Stop conditions

- Source baseline hash or cleanup SHA is missing or differs from the current commit.
- Any prior evidence is overwritten rather than appended.

### Rollback

Revert the runbook-only append; preserve the cleanup commit and source state.

### Exit conditions

1. The runbook ledger is `passed+` and every Gate Progress Log is evidence-complete.
2. G9 deletion evidence remains independently traceable after later documentation or style changes.

## Definition Of Done

- All five Gates are passed in order with append-only evidence.
- Active Designer session and public package use only `DocumentSchema`, `MaterialDefinition`, and internal Designer Presentation contracts.
- No old Schema/Layout/Renderer protocol, renderer interface export, package edge, or active caller remains outside `.scratch` history.
- The cleanup commit is behavior-free, independently reviewable, and verified by strict scan, full repository/browser checks, and explicit manual acceptance.

## Explicitly Out Of Scope

- Runtime Schema migration, public compatibility aliases, dual read/write/render, or a production Runtime renderer.
- Recursive containers and non-Vue/browser host adapters.
- New Designer interaction or visual redesign unrelated to restoring the map contract.
