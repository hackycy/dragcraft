# 下一代布局语义架构实施计划

Status: accepted

## Objective

在一个开发分支内直接替换现有 Schema、Core command/layout、Renderer 和 WidgetDefinition 体系，保留现有 Designer 工作台与交互体验；最终合并状态只包含新 `DocumentSchema`、Schema Structure Resolver、Schema Editor、Authoring Engine、ApplicationSurface 和单一 `MaterialDefinition[]` 注册面。

本计划不实现迁移、兼容 alias、双读、双写、旧 Schema adapter、生产 Runtime renderer 或递归容器。

## Final Module Topology

```text
@dragcraft/designer                         public deep module
  ├── public DocumentSchema and material interfaces
  ├── createDesigner / DesignerInstance
  ├── Authoring Engine and bounded history
  ├── Vue workbench and interaction UI
  └── internal Presentation
       ├── ApplicationSurface
       ├── Document / Viewport / Interaction planes
       ├── NodeHost and Geometry Registry
       ├── DesignerRegionOutlet
       └── PresentationFrame integration

@dragcraft/core                             internal pure module
  ├── DocumentSchema value types
  ├── Schema Structure Resolver
  ├── ResolvedDocument query model
  ├── Schema Operations / NodeBundle
  └── Schema Editor

@dragcraft/form-generator                   retained internal module
@dragcraft/ui / i18n / icons / utils        retained internal modules
@dragcraft/device-frames                    retained public optional module
@dragcraft/fields-*                         retained public adapter modules

@dragcraft/renderer                         removed
@dragcraft/widgets                          removed
```

`@dragcraft/core` must no longer depend on Vue. `@dragcraft/designer` is the only owner of Vue session state, history coordination, material presentation, browser geometry and interaction side effects. The old Renderer is not retained as a separate seam because it has only one real consumer and its new responsibilities are private to Designer.

## Dependency Direction

```text
MaterialDefinition[]
  ├── project pure SchemaDefinitionSnapshot ──> Core Resolver / Editor
  ├── project Authoring definitions ──────────> Designer Authoring Engine
  └── project Presentation registry ──────────> Designer ApplicationSurface

Designer UI ──> DesignerInstance ──> Authoring Engine ──> Core Editor
ApplicationSurface ──> ResolvedDocument + controlled Authoring Actions
External consumer <── JSON DocumentSchema only
```

Core never imports Designer, Vue, form-generator, device-frames or presentation types. Presentation never edits Schema directly. Workbench panels never call Core operations directly; they dispatch `AuthoringAction` through `DesignerInstance.execute()`.

## Execution Strategy

The branch may temporarily contain unused new modules beside old implementation while the replacement is built. Do not create a compatibility adapter or `v2` namespace. Public exports and application code switch only after the new Core, Authoring and Presentation path can operate together. The final cleanup phase is mandatory before merge.

### Phase 0: Baseline And Guardrails

1. Run and record the current `pnpm build`, `pnpm lint`, `pnpm typecheck` and `pnpm test` baseline.
2. Record the current playground interaction checklist for toolbar, selection, root/container drag, structure tree, inspector, undo/redo, import/export, template switching and Device Frame switching.
3. Add `fast-check` to the workspace testing catalog and `@dragcraft/core` dev dependencies.
4. Add source-level denylist checks for forbidden public imports, but enable legacy-symbol deletion checks only at the final cutover.

Verification: existing automated checks remain green before behavioral changes; baseline manual checklist is recorded beside the implementation PR.

### Phase 1: Pure Document And Resolver

Create final-named Core modules; do not route production Designer code through them yet.

Target ownership:

```text
packages/core/src/document/types.ts
packages/core/src/document/json.ts
packages/core/src/definitions/types.ts
packages/core/src/resolver/resolve-schema.ts
packages/core/src/resolver/diagnostics.ts
packages/core/src/resolver/resolved-document.ts
```

Tasks:

1. Define `DocumentSchema`, page/node/structure types, JSON value types, IDs, container declarations and `SchemaDefinitionSnapshot`.
2. Implement JSON validation and an input-isolated immutable snapshot without `structuredClone`.
3. Implement the single `resolveSchema(input, definitions, options?)` interface and four-state result.
4. Build `nodesById`, `locationsById`, ordered root and container/region views inside `ResolvedDocument`.
5. Implement stable diagnostic codes, JSON Pointer paths, stable sorting, default limit 200 and hard limit 2000.
6. Cover empty/root/container documents, duplicate/missing/orphan references, multiple ownership, illegal nested containers, unknown types, definition conflicts, region set mismatch and cardinality.

Verification: Core table tests assert exact status/code/path/order; inputs remain unchanged; no Vue dependency appears in Core source or manifest.

### Phase 2: Pure Schema Editor

Target ownership:

```text
packages/core/src/editor/schema-operation.ts
packages/core/src/editor/node-bundle.ts
packages/core/src/editor/structural-destination.ts
packages/core/src/editor/apply-schema-operation.ts
packages/core/src/editor/operations/*.ts
```

Tasks:

1. Define the closed operation vocabulary: `insert-bundle`, `move`, `remove`, `unwrap`, `update-node`, `update-page`, `update-global-config` and non-nested `batch`.
2. Resolve `start/end/before/after` anchors against the current owner sequence inside Core.
3. Implement aggregate insert, deep duplicate input support, root/region moves, cascade remove and region-order unwrap.
4. Enforce unique ownership, root-only containers, non-container region children, accepts/cardinality and reference integrity on every result.
5. Return only `rejected`, `unchanged` or `committed`; never expose a partial working document.
6. Add bounded `fast-check` generators for valid one-level documents and operation sequences. Log and replay failure seeds.

Verification: every committed output re-resolves successfully; rejected operations preserve original references/data; batch failure is atomic; property-test case counts are fixed for CI.

### Phase 3: Material Catalog And Authoring Engine

Target ownership:

```text
packages/designer/src/materials/types.ts
packages/designer/src/materials/define-material.ts
packages/designer/src/materials/create-material-catalog.ts
packages/designer/src/authoring/types.ts
packages/designer/src/authoring/policy.ts
packages/designer/src/authoring/history.ts
packages/designer/src/authoring/create-authoring-engine.ts
packages/designer/src/session/create-designer.ts
```

Tasks:

1. Implement the flat `MaterialDefinition` interface and no-op `defineMaterial()` inference helper.
2. Validate all material definitions once at initialization; duplicate type and invalid visual/container configuration throw `DesignerConfigurationError`.
3. Project one immutable catalog into the Core definition snapshot, Authoring definitions and Presentation lookup without exposing parallel registries.
4. Implement standard NodeBundle creation for ordinary/container/headless materials and optional material authoring customization.
5. Implement `AuthoringEngine.execute(action)` as the only state-changing entry and translate actions to Core operations.
6. Implement immutable snapshot history with default 50, `0` disabled, redo-branch truncation and bounded retention.
7. Implement `DesignerDocumentState`, four-state import, rejected-import preservation, detached export and reactive selection/hover state.
8. Rebuild `createDesigner({ schema?, materials, ... })`; omitted Schema creates the canonical empty version-1 document.

Verification: tests cross only Material Catalog, Authoring Engine and DesignerInstance interfaces. No public or UI caller receives Core Engine, Store, Registry, Command or ResolvedDocument.

### Phase 4: Designer Presentation Replacement

Move the useful interaction implementation into final internal Designer modules instead of adapting the old Renderer.

Target ownership:

```text
packages/designer/src/presentation/application-surface.ts
packages/designer/src/presentation/node-host.ts
packages/designer/src/presentation/geometry-registry.ts
packages/designer/src/presentation/interaction-plane.ts
packages/designer/src/presentation/designer-region-outlet.ts
packages/designer/src/presentation/designer-viewport-portal.ts
packages/designer/src/presentation/surface-reservation.ts
packages/designer/src/presentation/material-preview-context.ts
packages/designer/src/presentation/recovery/*.ts
```

Tasks:

1. Build one ApplicationSurface with Document Plane, Viewport Plane and private Interaction Plane.
2. Create exactly one NodeHost per resolved node and use it as the only selection, measurement and toolbar anchor.
3. Render visual, headless and unknown materials through distinct explicit paths.
4. Implement PresentationFrame around the complete NodeHost; detect missing/duplicate slot mounts and recover in Document Plane.
5. Implement `DesignerViewportPortal` for root-owned nodes and reject/recover region-child portal attempts.
6. Implement `DesignerRegionOutlet` with one stable outlet per declared region, default midpoint anchors and optional material geometry resolver.
7. Centralize ResizeObserver and coordinate conversion in Geometry Registry; avoid global selectors and body portals.
8. Implement measured edge reservations with stable root order and Device Frame safe-area integration.
9. Route selection, toolbar, drop feedback and presentation diagnostics through the Interaction Plane while preserving current visual behavior.
10. Merge required Renderer structural CSS into Designer `structure.css`; retain public tokens and selected `data-dc-*` hooks, but remove old surface/layout classes and private variable names tied to placement.

Verification: happy-dom tests assert one NodeHost, stable structural order, visual/headless/unknown paths, Outlet recovery and action routing. Browser geometry is verified later through the product playground checklist, not Playwright.

### Phase 5: Workbench Cutover And Public Interface

Tasks:

1. Change `DcDesigner`, Canvas, material panel, structure tree, property panel, drag/drop and keyboard shortcuts to consume only `DesignerInstance` and internal Designer context.
2. Preserve existing toolbar actions, drag affordances, selection feedback, panel behavior, focus handling, pan/zoom and undo/redo shortcuts.
3. Translate property edits and custom toolbar actions into closed `AuthoringAction` values.
4. Replace projected indexes and sort scopes with structural destinations and anchors throughout root and region dragging.
5. Replace `packages/designer/src/index.ts` with the agreed allowlist and public form types.
6. Add positive consumer fixtures for visual/headless/container/Frame/fields/device-frame integration and negative import checks for removed internals.
7. Update package export validation and public-boundary scripts.

Verification: Designer package tests compile without importing Renderer or Widgets; public consumer fixtures import only allowed public packages; Standard and structure CSS exports resolve from built output.

### Phase 6: Remove Obsolete Packages And Protocols

1. Delete `packages/widgets`; move no helper forward except `defineMaterial()` in Designer.
2. Delete `packages/renderer`; all retained presentation behavior and CSS must already live privately in Designer.
3. Remove both packages from Designer dependencies, workspace build graph, architecture reference and lockfile via normal pnpm install.
4. Delete old Core Engine, command bus, event hub, registry, layout, sortable, container plan/placement/variant and tree-schema modules after all callers switch.
5. Delete their implementation-coupled tests; retain behavior only through the new deep module interfaces.
6. Remove Vue peer dependency from Core.

Verification: repository source outside architecture history has no imports of `@dragcraft/renderer` or `@dragcraft/widgets`; Core package builds without Vue.

### Phase 7: Rebuild Product Consumers

#### Playground

Rewrite all materials as `MaterialDefinition` and all templates as `DocumentSchema`:

1. E-commerce home: navbar, bottom bar, FAB, long scrolling content and measured top/bottom reservation.
2. Content detail: one-region container, three-region irregular container, root/region moves and region sorting.
3. Product detail: ordinary content, fixed purchase bar, overlay dialog and Device Frame switching.
4. Add one real Headless functional material such as analytics configuration.
5. Preserve template switching, locale, material search, inspector, import/export and host confirmation UX.

#### Guide Project

1. Rewrite the minimal and full Designer setup around `createDesigner({ schema?, materials })`.
2. Rewrite persistence against `DocumentSchema` and remove migration examples.
3. Keep its production Runtime example autonomous: it may import the public pure-data types from Designer but must not share MaterialDefinition, Presentation or internal resolution.

Verification: playground and guide project build without legacy schema fields or internal package imports; exported JSON round-trips through Designer without structural change.

### Phase 8: Documentation And Final Gate

1. Rewrite `.github/architecture` as the canonical implemented architecture; remove LayoutPlan, placement and old package responsibility descriptions.
2. Rewrite public docs and examples around DocumentSchema, MaterialDefinition, PresentationFrame, one-level regions and external consumer autonomy.
3. Update package reference to remove Renderer and Widgets.
4. Run source/documentation denylist checks outside `.scratch` for old symbols and contracts.
5. Run, in repository-required order: `pnpm build`, `pnpm lint`, `pnpm typecheck`, then `pnpm test`.
6. Start the playground and complete the human Web acceptance checklist below.

## Human Web Acceptance

- Toolbar, selection outline, drag handle and drop indicator retain the current interaction quality.
- Document content scrolls inside the single application scrollport.
- Navbar, bottom bar, FAB and dialog use their registered Frames correctly.
- Device Frame clips Preview content but not the Designer toolbar/selection plane.
- Surface reservations track measured sizes and never create a second page scrollbar.
- Root sorting, region sorting and root/region moves match the structure tree and exported Schema.
- Container empty state and recovery state never hide children.
- Headless and unknown nodes remain selectable and inspectable.
- Undo/redo, template switching, import/export, property editing and confirmation behavior remain functional.
- No business preview covers Designer interaction UI; no node is rendered twice or silently lost.

## Final Deletion Gate

The merge is blocked while any active implementation, public documentation, example or playground code still depends on:

```text
DesignerSchema / SchemaNode tree
root.children
layout / LayoutPlan / NodeLayout
flow / chrome / layer placement
sortScope / projected index
ContainerPlan / container variant / migration
WidgetMeta / WidgetDefinition / ComponentMap registration
createEngine / CommandType / custom Core handlers
RootRenderer / WidgetRenderer / WidgetRuntimeContext
schema migration / compatibility alias / dual read / dual write
```

Mentions in `.scratch/layout-semantic-architecture` may remain as decision history and rejected terminology. Business props are open JSON and are not scanned for forbidden field names.

## Definition Of Done

The implementation is complete only when all automated gates pass, the three product playground scenarios pass the human checklist, architecture and public docs describe only the new system, the old packages and protocols are removed, and the final dependency graph matches this plan without a compatibility layer.
