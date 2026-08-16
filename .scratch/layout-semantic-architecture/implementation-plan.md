# layout-semantic-architecture Implementation Plan

## Source Decisions

- [`map.md`](map.md): canonical architecture, direct refactor policy, no compatibility layer, and G0-G9 execution order.
- [`issues/01-canonical-schema-model.md`](issues/01-canonical-schema-model.md): `DocumentSchema` stores node definitions and independent structure.
- [`issues/02-layout-capability-algebra.md`](issues/02-layout-capability-algebra.md): spatial semantics are not persisted and are not a shared Dragcraft protocol.
- [`issues/03-schema-structure-resolver-output.md`](issues/03-schema-structure-resolver-output.md): the resolver exposes only an internal structural read model.
- [`issues/04-one-level-container-model.md`](issues/04-one-level-container-model.md): container regions are structural ownership facts and recursion is unsupported.
- [`issues/05-declarative-state-and-visibility.md`](issues/05-declarative-state-and-visibility.md): Core and Designer do not provide generic visibility or preview-state protocols.
- [`issues/06-web-geometry-adapter.md`](issues/06-web-geometry-adapter.md): `ApplicationSurface`, `PresentationFrame`, mount planes, reservation, and geometry belong to the internal Designer implementation; placement categories and `LayoutPlan` are not the public or material contract.
- [`issues/07-authoring-operations-model.md`](issues/07-authoring-operations-model.md): Authoring Engine and Schema Editor are the only Designer write path and destinations are owner anchors.
- [`issues/08-public-designer-contract.md`](issues/08-public-designer-contract.md): the public contract is `DocumentSchema`, `MaterialDefinition`, and controlled Vue Presentation extensions.
- [`issues/09-validation-and-conformance.md`](issues/09-validation-and-conformance.md): each invariant has one owner and one authoritative verification surface.
- [`issues/10-semantic-render-binding.md`](issues/10-semantic-render-binding.md): stable `type` is the only material/render binding key.
- [`issues/11-interaction-baseline.md`](issues/11-interaction-baseline.md): existing Designer interactions are the executable behavioral baseline.
- [`issues/12-transition-adapter-seam.md`](issues/12-transition-adapter-seam.md): the temporary transition adapter is internal and must be deleted after caller cutover.
- [`issues/13-session-state-continuity.md`](issues/13-session-state-continuity.md): session facts survive cutover; browser projections may be recomputed; current drag is fenced.
- [`issues/14-slice-cutover-order.md`](issues/14-slice-cutover-order.md): replace read, write, node interaction, regions, root surface, and frame geometry in bounded slices.
- [`issues/15-renderer-deletion-gate.md`](issues/15-renderer-deletion-gate.md): physical deletion requires six independent evidence groups and a behavior-free cleanup commit.

## Outcome

The Designer has one canonical `DocumentSchema` and one Authoring Engine. Structure and order are read from Core owner sequences; no `placement`, `flow`, `chrome`, `layer`, `sortScope`, `order`, `visible`, or `LayoutPlan` protocol is persisted, publicly exported, or used to decide structural ownership. `ApplicationSurface` owns one NodeHost per node, `PresentationFrame` is the only material geometry seam, and private mount-plane, reservation, geometry, and Interaction Plane implementations preserve the existing Designer interaction contract. External consumers receive only pure Schema and stable material semantics and own their runtime presentation. Legacy protocol and transition code are deleted only after the full evidence gate.

## Non-Negotiable Rules

1. `DocumentSchema` is the only persisted and session document contract; structure is `structure.root` plus one-level container regions.
2. Structural ownership and order never depend on presentation metadata, CSS, DOM geometry, or material placement categories.
3. `MaterialDefinition.presentation` contains only explicit visual/headless presentation and the approved `PresentationFrame` seam; it does not contain layout classification or generic visibility/order.
4. `ResolvedDocument`, indexes, registries, geometry, and renderer implementations remain private to Core/Designer.
5. Each node is rendered by one NodeHost and each interaction event has one implementation; no double read, write, render, or event replay is allowed.
6. A cutover slice is independently revertible at its declared seam; physical cleanup is separate from behavior changes.
7. Public consumers may depend only on the approved `@dragcraft/designer`, `@dragcraft/device-frames`, and field packages.
8. `.scratch` is historical evidence, not a protocol or compatibility surface.

## Gate Overview

| Gate | Name | Unlock condition | Outcome |
| --- | --- | --- | --- |
| G0 | Convergence Guard and Drift Inventory | start | A deterministic inventory identifies every remaining placement/layout/legacy path and freezes the real baseline. |
| G1 | Canonical Schema and Session | G0 Exit all satisfied | Session reads the canonical `DocumentSchema` and private structural queries without tree or layout projections. |
| G2 | Authoring and Structural Operations | G1 Exit all satisfied | All Designer writes use owner anchors, Schema Operations, and one history source; presentation cannot alter structure. |
| G3 | Node Interaction and Geometry | G2 Exit all satisfied | NodeHost, geometry registration, selection, toolbar, and drag feedback use the new session seam without placement branches. |
| G4 | Container Region Cutover | G3 Exit all satisfied | Region outlets own one-level child rendering and structural drop behavior without page-level placement projection. |
| G5 | Root Surface Cutover | G4 Exit all satisfied | ApplicationSurface renders the root sequence once through Document/Viewport mount planes without `LayoutPlan` or chrome/layer VNodes. |
| G6 | PresentationFrame and Surface Geometry | G5 Exit all satisfied | `PresentationFrame` is the only public material geometry seam; reservation, viewport mounting, stacking, and measurement are private Designer behavior. |
| G7 | Public and External Consumer Boundary | G6 Exit all satisfied | Public exports, docs, examples, and external runtime examples expose only Schema/type semantics and approved Designer extensions. |
| G8 | Conformance and Product Evidence | G7 Exit all satisfied | Structural, interaction, browser, package-boundary, and three-template evidence proves the new implementation preserves the baseline. |
| G9 | Legacy Deletion and Closeout | G8 Exit all satisfied | Old protocols, adapters, exports, package edges, and tests are removed in one behavior-free cleanup boundary. |

## G0: Convergence Guard and Drift Inventory

### Purpose

Prevent the current implementation and its green tests from being mistaken for the resolved map. This gate explicitly inventories `MaterialPresentationLayout`, `placement`, `flow`, `chrome`, `layer`, `sortScope`, `LayoutPlan`, old Renderer protocols, and public documentation that still prescribes them.

### Inputs

- `CLAUDE.md`, `CONTEXT.md`, `map.md`, all `issues/*.md`, current Designer/Core sources, package manifests, docs, examples, Playground, and check scripts.

### Objective

Produce a deterministic path/line/identifier inventory and a source-to-decision drift report distinguishing historical `.scratch` references, explicitly local external-runtime implementation, and remaining Dragcraft contracts that must be removed.

### Scope boundary

Only scanners, fixtures, baseline evidence, and control-plane documentation. Do not change runtime behavior, public exports, Schema, or tests except focused scanner tests.

### Constraints

- Scan Designer/Core source, public exports, docs, examples, Playground, manifests, and contract tests; exclude `.scratch` and generated output.
- Strict mode fails while prohibited Dragcraft placement/layout protocol remains.
- Do not weaken tests or hide findings through a compatibility alias.

### Slice policy

One scan-coverage slice; one fixture/baseline slice; one drift-report/runbook slice.

### Verification

#### Directed

- Invalid fixtures report stable path, line, and identifier findings for placement/layout and obsolete public protocols.
- Valid fixtures permit `PresentationFrame`, private geometry names, and explicitly local external runtime policy.
- Repository inventory records all findings before G1.

#### Repository

1. `pnpm check:obsolete-protocol` in inventory mode.
2. `pnpm check:public-boundary`.
3. `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm test:browser` in order.

#### Manual acceptance

无

### Evidence rule

Fixtures prove scanner semantics; inventory and source SHA prove the baseline; ordered commands prove no runtime behavior changed in G0.

### Stop conditions

- Any map or issue is missing, unresolved, or contradictory.
- The scanner cannot distinguish remaining contracts from `.scratch` or explicitly local external runtime code.
- Baseline verification fails for an unisolated pre-existing reason.

### Rollback

Revert scanner, fixture, and control-plane changes only; no runtime rollback is needed.

### Exit conditions

1. Inventory coverage and output are deterministic.
2. Every remaining placement/layout path is named and assigned to a later Gate.
3. Strict mode fails closed on prohibited findings.
4. Ordered baseline verification passes and the runbook records the exact SHA and inventory.

## G1: Canonical Schema and Session

### Purpose

Make the canonical document and private structural resolver the only session read source.

### Inputs

- G0 evidence and issues 01, 02, 03, 08, 13, and 14.
- Core resolver/editor modules, Designer session types/adapter, and direct session consumers/tests.

### Objective

Expose `DocumentSchema` directly through the session, retain private `ResolvedDocument` queries, and prohibit tree-shaped, layout-shaped, or renderer-shaped session projections.

### Scope boundary

Core resolver, session document types, adapter reads, import/export reads, and direct tests. Do not change authoring policy, NodeHost, Surface, or public presentation.

### Constraints

- No `DesignerSchema`, `SchemaNode`, `LayoutPlan`, or presentation placement in session document values.
- One document and one history source; rejected imports leave the current snapshot unchanged.

### Slice policy

Canonical snapshot; root/region owner queries; import/export and direct consumers. Verify each slice before the next.

### Verification

#### Directed

- Identity/owner/order tests assert canonical `DocumentSchema` and reject tree/layout fields.
- Import/export tests assert JSON round trip and rejected-state stability.

#### Repository

1. Focused Core and Designer session tests.
2. `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm test:browser`.

#### Manual acceptance

无

### Evidence rule

Directed session assertions and ordered repository/browser runs prove one canonical read source.

### Stop conditions

- A consumer requires a tree/layout field; move it to a later Presentation gate instead of restoring a projection.
- A second document/history source or conversion path appears.

### Rollback

Revert the current read cluster at the internal `DesignerSession` seam.

### Exit conditions

1. Session schema reads are canonical `DocumentSchema` snapshots or explicit rejected state.
2. No tree-shaped or layout-shaped session projection remains.
3. Session and browser behavior pass with one document/history source.

## G2: Authoring and Structural Operations

### Purpose

Make authoring depend only on structural owners and anchors, eliminating presentation-driven placement, sort scopes, and root/container restrictions.

### Inputs

- G1 evidence and issues 04, 07, 09, 12, and 14.
- Authoring Engine, Policy, Schema Editor, action adapters, destinations, structure panel, and history tests.

### Objective

Route every Designer write through `evaluate/execute`, produce owner-anchor Schema Operations, and preserve one atomic history commit per action without consulting presentation placement.

### Scope boundary

Authoring Engine/Policy, Schema Editor operations, destination conversion, material create/duplicate/move/remove/update, and direct write consumers/tests. Do not change NodeHost or canvas DOM.

### Constraints

- No `requiresRootDestination`, `CONTAINER_NON_FLOW_MATERIAL`, `sortScope`, visual order, or placement-derived owner.
- NodeBundle insertion remains atomic; Policy cannot replace Core structural invariants.

### Slice policy

Read destination; create/duplicate; move/remove/unwrap; update/history. Each action cluster must pass focused tests before the next.

### Verification

#### Directed

- Root and region actions use `start/end/before/after` structural destinations.
- History tests prove rejected/unchanged actions do not commit and undo/redo moves one Schema timeline.
- A material with any visual Frame remains structurally movable without placement metadata.

#### Repository

1. Focused Authoring Engine, Schema Editor, drag/drop, and structure tests.
2. `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm test:browser`.

#### Manual acceptance

无

### Evidence rule

Action matrix and history assertions prove structural ownership is independent of Presentation; ordered runs prove preserved behavior.

### Stop conditions

- A structural rule cannot be expressed by Core owner/region invariants or explicit authoring Policy.
- Any write bypasses Authoring Engine or introduces a second history source.

### Rollback

Revert the affected action cluster at the Authoring Engine seam.

### Exit conditions

1. All Designer writes use Authoring Engine and Schema Editor.
2. No write path reads placement, sort scope, visual order, or layout classification.
3. Atomic history and structural destination tests pass.

## G3: Node Interaction and Geometry

### Purpose

Replace placement-specific NodeHost behavior with one geometry and interaction implementation while preserving selection, toolbar, masks, and drag feedback.

### Inputs

- G2 evidence and issues 06, 09, 11, 13, and 14.
- NodeHost, selection projection, toolbar positioning, geometry composables, and interaction tests.

### Objective

Have NodeHost render one node exactly once and register its element with a private Geometry Registry; Interaction Plane consumers use measured geometry rather than placement kind.

### Scope boundary

NodeHost, selection/toolbar/drop geometry, Interaction Plane, and direct tests. Root Surface, Region Outlet, and Frame cleanup remain for later Gates.

### Constraints

- No placement branch controls selection plane, mask, toolbar, or node DOM ownership.
- Self-positioning is a Frame/mount-plane concern, not a NodeHost semantic category.

### Slice policy

NodeHost rendering; selection and mask; toolbar; geometry/drop feedback. One interaction cluster per slice.

### Verification

#### Directed

- NodeHost uniqueness and geometry tests cover visual, headless, unknown, container, and region nodes.
- Interaction tests cover selection, hover, toolbar collision, masks, drag feedback, and scroll/scale remeasurement.

#### Repository

1. Focused NodeHost and interaction tests.
2. `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm test:browser`.

#### Manual acceptance

无

### Evidence rule

NodeHost/geometry tests and browser smoke prove one interaction implementation without placement branches.

### Stop conditions

- A behavior requires a second DOM entity for one node.
- Geometry cannot be expressed relative to the Renderer Frame Boundary without global selectors or body portals.

### Rollback

Revert the entire node interaction cluster at the NodeHost/Geometry Registry seam.

### Exit conditions

1. Every rendered node has one NodeHost and one geometry registration.
2. Selection, toolbar, masks, and drag feedback no longer depend on placement kinds.
3. Interaction behavior remains equivalent under scroll, scale, and clipping.

## G4: Container Region Cutover

### Purpose

Make container ownership and region child rendering a structural module independent of page-level Presentation classification.

### Inputs

- G3 evidence and issues 04, 06, 09, 11, and 14.
- `DesignerRegionOutlet`, container queries, region drop geometry, recovery handling, and container tests.

### Objective

Render each declared region once in the material preview, preserve real region order, and route region drops to structural destinations without root projection or recursive containers.

### Scope boundary

Region Outlet, container owner queries, empty/forbidden/recovery states, and region interaction tests. Root Surface and Frame geometry remain for later Gates.

### Constraints

- One-level container invariant is enforced by Core and Policy, not layout classification.
- Missing or duplicate outlets diagnose and recover children; they never silently drop them.

### Slice policy

Outlet mounting; region order/empty state; region drag/drop; unresolved/recovery container. Verify each cluster independently.

### Verification

#### Directed

- Region tests cover root-to-region and region-to-region movement, empty/dragging/forbidden mutual exclusion, and unresolved recovery.
- Container tests prove every child is rendered once in its declared region.

#### Repository

1. Focused container/region tests.
2. `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm test:browser`.

#### Manual acceptance

无

### Evidence rule

Region invariant/action tests and browser checks prove structural ownership and no page-level child projection.

### Stop conditions

- A container needs recursive children or an unapproved dynamic region.
- Region drop bubbles into root drop or loses children.

### Rollback

Revert the Region Outlet interaction cluster at the container presentation seam.

### Exit conditions

1. Every container region has exactly one controlled outlet or a diagnosed recovery path.
2. Region children follow Schema order and are rendered once.
3. Region/root drag behavior and one-level invariants pass.

## G5: Root Surface Cutover

### Purpose

Replace the old page projection with a single ApplicationSurface that mounts root nodes according to `structure.root`.

### Inputs

- G4 evidence and issues 06, 09, 11, 13, and 14.
- ApplicationSurface, CanvasSurface, root drop geometry, scrollport, selection planes, and root surface tests.

### Objective

Render one root NodeHost per root node through Document/Viewport mount planes, remove `LayoutPlan` and chrome/layer VNode distribution, and keep root drop feedback structural.

### Scope boundary

Root surface DOM, root sequence projection, one scrollport, root drop feedback, and direct tests. Frame/Device Frame reservation and public material contract remain for G6/G7.

### Constraints

- No `regions/chrome/layers` surface projection for root nodes.
- Root drop geometry returns only structural anchors; it never computes persistent index from visual order.

### Slice policy

Root read/mount; single scrollport and empty state; root drop feedback; root selection plane. One surface cluster per slice.

### Verification

#### Directed

- Root order and one-NodeHost tests cover ordinary, headless, unknown, and visual nodes.
- Drop tests cover start/end/before/after, scroll remeasurement, and root/region target exclusivity.

#### Repository

1. Focused ApplicationSurface and root interaction tests.
2. `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm test:browser`.

#### Manual acceptance

无

### Evidence rule

Root surface tests and browser smoke prove one root render path, one scrollport, and structural drop feedback.

### Stop conditions

- A root node requires a second renderer or a second business scrollport.
- A root behavior cannot be expressed without restoring `LayoutPlan` or placement distribution.

### Rollback

Revert the root surface cluster at the ApplicationSurface seam.

### Exit conditions

1. Root nodes render once in Schema order through ApplicationSurface.
2. Active source contains no root `LayoutPlan`, chrome/layer VNode distribution, or visual sort mapping.
3. Root drop, empty canvas, scroll, and selection behavior pass.

## G6: PresentationFrame and Surface Geometry

### Purpose

Move special visual geometry behind the single approved `PresentationFrame` seam and keep reservation, portal, stacking, and measurement private to Designer.

### Inputs

- G5 evidence and issues 06, 08, 09, 11, 13, and 14.
- Material presentation types, NodeHost wrappers, mount planes, Device Frame, reservation/measurement code, and geometry tests.

### Objective

Remove `MaterialPresentationLayout`, `MaterialPresentationPlacement`, `ResolvedPresentationLayout`, `sortScope`, generic `order/visible`, and public placement exports; implement sticky/edge/overlay behavior with Frame-owned DOM and private `SurfaceReservation`/Viewport Portal mechanisms.

### Scope boundary

Material presentation interface, Frame slot contract, mount-plane and reservation implementation, stacking/measurement CSS, and direct/browser geometry tests. Do not change external Runtime policy until G7.

### Constraints

- A Frame renders exactly one complete NodeHost slot and cannot inspect or reorder other nodes.
- Reservation is runtime DOM measurement only; it never enters Schema or MaterialDefinition.
- Interaction Plane remains outside business clipping and above business planes.

### Slice policy

Public material type removal; Frame slot/NodeHost ownership; Document/Viewport mounting; reservation/measurement/stacking. Each slice passes focused geometry tests before the next.

### Verification

#### Directed

- Public type tests reject placement/layout fields and expose only approved Frame/material contracts.
- Frame tests cover ordinary, sticky, edge, floating, headless, and unknown nodes with exactly one slot.
- Reservation tests cover measured/fallback sizes, safe area composition, resize, and frame switching without Schema/history changes.

#### Repository

1. Focused material, Frame, surface geometry, and browser tests.
2. `pnpm check:public-boundary`.
3. `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm test:browser`.

#### Manual acceptance

- Start the browser harness and inspect toolbar, selection, drag/drop, Device Frame, sticky/edge/floating, and resize scenarios; pause for explicit user confirmation before closing this Gate.

### Evidence rule

Type-level rejection, Frame/geometry tests, ordered checks, and user confirmation prove the sole geometry seam and preserved interaction behavior.

### Stop conditions

- A Frame needs Schema, ResolvedDocument, registry, geometry registry, or renderer context.
- Removing placement causes an unexplained structural regression; pause and assign it to structural Policy or Frame geometry before continuing.

### Rollback

Revert the Frame/geometry cluster at the ApplicationSurface/PresentationFrame seam.

### Exit conditions

1. No public or internal Designer material/session path uses placement categories, LayoutPlan, sortScope, generic order, or generic visibility.
2. PresentationFrame is the only public ApplicationSurface geometry seam.
3. Reservation, mount-plane, stacking, and geometry behavior pass directed, repository, browser, and manual evidence.

## G7: Public and External Consumer Boundary

### Purpose

Ensure public docs and consumers describe the new contract rather than rebuilding a shared Dragcraft layout protocol.

### Inputs

- G6 evidence and issues 02, 05, 08, 10, and 15.
- Public exports, docs, skills, examples, Playground, external runtime-local registry, and boundary/checker fixtures.

### Objective

Publish only `DocumentSchema`, stable `type`/props semantics, approved Designer controls, and `PresentationFrame`; external Runtime examples interpret Schema independently and do not import Designer presentation or geometry.

### Scope boundary

Public docs, examples, Playground contract tests, checker fixtures, package exports, and external-runtime import cleanup. No new runtime behavior or compatibility alias.

### Constraints

- External consumers may implement local layout strategies but may not consume Dragcraft placement types or `ResolvedDocument`/registry/renderer interfaces.
- Historical names remain only in `.scratch` evidence and explicit negative tests.

### Slice policy

Export/type contract; public docs/skills; examples/Playground; checker fixture/import boundary. Verify each slice independently.

### Verification

#### Directed

- Invalid public-contract fixture fails on placement/layout and legacy renderer names; valid fixture passes with Frame and local external policy.
- Public type tests reject private resolver, layout, registry, and renderer imports.

#### Repository

1. `pnpm check:public-boundary`.
2. `pnpm check:obsolete-protocol --strict`.
3. `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm test:browser`.

#### Manual acceptance

无

### Evidence rule

Type tests, fixtures, strict scans, and ordered repository/browser runs prove the public/external boundary.

### Stop conditions

- A public consumer requires Schema, geometry, or renderer context; resolve it in decision documents instead of adding an alias.
- Docs and shipped exports disagree about an approved seam.

### Rollback

Revert the public/docs/examples slice without reverting runtime geometry behavior.

### Exit conditions

1. Public exports contain no placement/layout protocol or renderer interface.
2. Public docs/examples describe Schema/type semantics and Frame without shared layout plans.
3. External runtime code owns local presentation and imports only approved packages.

## G8: Conformance and Product Evidence

### Purpose

Collect independent evidence that the refactor preserves the existing interaction contract while satisfying structural and presentation invariants.

### Inputs

- G0-G7 evidence, issues 09 and 11 acceptance matrices, three Playground templates, Guide Project, and full repository/browser harness.

### Objective

Run the complete invariant matrix, session continuity checks, browser smoke, and manual product acceptance with no dual implementation or hidden placement path.

### Scope boundary

Verification, evidence, and append-only runbook updates. Runtime changes belong to the owning earlier Gate.

### Constraints

- A failure requiring runtime changes reopens the owning Gate; it cannot be patched in G8.
- No test may be skipped or weakened.

### Slice policy

Core invariant matrix; Designer module/interaction matrix; browser/template matrix; state continuity/Cutover Fence; final static inventory. Record each evidence group independently.

### Verification

#### Directed

- Run issue 09 invariant-owner checks and issue 11 ten-scenario interaction baseline.
- Verify drag fence, frame switch, undo/redo, import rejection, and unknown/headless recovery.

#### Repository

1. `pnpm check:public-boundary`.
2. `pnpm check:obsolete-protocol --strict`.
3. `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm test:browser` in order.
4. `git diff --check` and deterministic source/package inventory.

#### Manual acceptance

- Recheck the three Playground templates and Guide Project; provide a running URL and checklist, then pause for explicit user confirmation.

### Evidence rule

Each invariant/scenario has one recorded owner and authoritative test; repository commands, browser output, static inventory, and user confirmation jointly prove conformance.

### Stop conditions

- Any remaining placement/layout path remains outside the explicitly permitted private implementation list.
- Any scenario differs in an unassigned way or manual acceptance is unavailable.

### Rollback

No runtime rollback in this Gate; return failures to the owning Gate and preserve evidence.

### Exit conditions

1. All invariant and interaction scenario owners have passing evidence.
2. Ordered repository/browser verification and strict inventory pass.
3. Three templates and Guide Project receive explicit manual confirmation.
4. No unresolved behavior or placement drift remains before deletion.

## G9: Legacy Deletion and Closeout

### Purpose

Physically remove superseded Renderer, adapter, protocol, package, CSS, test, and denylist paths only after the replacement implementation has converged.

### Inputs

- G8 evidence and issue 15 six-group deletion checklist.
- Strict inventory, package graph, manifests, lockfile, docs, examples, Playground, and cleanup candidates.

### Objective

Create one independently reviewable behavior-free cleanup commit and record all six deletion evidence groups with the current source SHA.

### Scope boundary

Only deletion, import/export/dependency cleanup, denylist removal, superseded fixture removal, and append-only closeout evidence. No new behavior, layout redesign, or compatibility alias.

### Constraints

- Cleanup is one distinct commit and independently revertible.
- `.scratch` may retain historical references; source/package/docs strict scan must be empty.
- Do not restore a dual path or public facade during cleanup.

### Slice policy

One deletion inventory slice; one physical cleanup slice; one strict verification slice; one append-only closeout slice.

### Verification

#### Directed

- Issue 15 checklist records callers, protocols, exports, package graph, CSS/assets, and tests/docs independently.
- Cleanup diff audit proves behavior-free scope.

#### Repository

1. `pnpm check:public-boundary`.
2. `pnpm check:obsolete-protocol --strict`.
3. `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm test:browser` in order.
4. `git diff --check` and cleanup-scope diff inspection.

#### Manual acceptance

无；G8 owns product confirmation.

### Evidence rule

The six-group checklist, cleanup SHA, strict zero-finding report, ordered verification, and cleanup diff prove deletion without behavior change.

### Stop conditions

- Any remaining caller, package edge, CSS import, or strict finding remains.
- Cleanup diff contains behavior changes or requires a compatibility alias.
- G8 manual evidence is absent or stale.

### Rollback

Revert only the independent cleanup commit and closeout metadata; do not restore a runtime dual track.

### Exit conditions

1. All six issue 15 deletion evidence groups are complete and traceable to the cleanup SHA.
2. Strict source/package/docs scan is empty outside `.scratch` history.
3. Ordered repository/browser verification passes after cleanup.
4. Runbook reaches its terminal state and records effort completion.

## Definition Of Done

- G0 through G9 pass in strict linear order with append-only evidence.
- Schema, session, authoring, interaction, region, root surface, and Frame geometry have one implementation each.
- No Designer or public Material contract contains placement categories, `LayoutPlan`, `sortScope`, generic `order`, or generic visibility.
- `PresentationFrame` is the only public ApplicationSurface geometry seam; reservation and mount-plane behavior are private.
- Existing Designer interaction scenarios and product templates are manually accepted.
- The cleanup commit removes obsolete protocols and adapters without behavior changes, and the final strict inventory is empty outside `.scratch`.

## Explicitly Out Of Scope

- Schema migration, public compatibility aliases, dual read/write/render, or long-lived transition facades.
- Recursive containers and nested container interaction.
- Non-Vue/browser host adapters.
- Dragcraft-owned production Runtime renderer or shared cross-platform presentation policy.
- New product interaction or visual redesign unrelated to preserving the established Designer baseline.
