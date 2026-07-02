# Layout-Position Layer Separation Design

Date: 2026-07-02

## Problem

The current layout system conflates two orthogonal concerns in `LayoutSlotManifest`:

1. **Slot-level layout behavior** — `allocation`, `axis`, `edge`, `order` describe how a slot physically behaves in the container (reserve space, stacking direction).
2. **Instance-level positioning** — `anchor` describes where a specific node appears on screen.

This causes several issues:

- `anchor` is type-level (declared on `WidgetMeta.layoutManifest`), but positioning needs to be per-instance (e.g., FAB-A at bottom-right, FAB-B at bottom-left).
- No mechanism for conditional visibility (show/hide based on props or global state).
- `NodeLayout.data` is dead code — carried through the type system but never consumed.
- Overlay rendering assumes one anchor per slot; multiple instances with different positions are impossible.

## Design Decisions

### 1. NodeLayout becomes the single source of instance-level layout behavior

```ts
interface NodeLayout {
  slot?: string
  sortScope?: string | false
  order?: number
  visible?: boolean | ((ctx: { node: SchemaNode; schema: DesignerSchema }) => boolean)
  position?: NodePosition
}
```

- `anchor` moves from `LayoutSlotManifest` to `NodeLayout.position.anchor`
- `visible` added to `NodeLayout` — boolean or predicate with `{ node, schema }` context (same as existing behavior predicates)
- `data` removed from `NodeLayout`

### 2. New NodePosition type

```ts
interface NodePosition {
  anchor: { block?: LayoutAnchor; inline?: LayoutAnchor }
}
```

`LayoutAnchor` is `'start' | 'center' | 'end'` (already defined). `offset` and other positioning extensions are deferred — YAGNI.

### 3. Slot and Position are independent, with mutual exclusion

| Has slot | Has position | Behavior |
|----------|-------------|----------|
| Yes | No | Normal slot rendering (existing behavior) |
| No | Yes | Positioned overlay — shell discovers from schema, no slot assignment |
| Yes | Yes | Slot wins, position ignored |
| No | No | Defaults to content slot (existing behavior) |

When a node has `position` but no explicit `slot`, `resolveNodeLayout` does NOT assign a default slot. The node stays out of the slot system entirely.

### 4. LayoutSlotManifest loses anchor

```ts
interface LayoutSlotManifest {
  allocation: LayoutAllocation
  axis?: LayoutAxis
  edge?: LayoutEdge
  order?: number
  className?: string
  // anchor removed — now per-instance on NodeLayout.position
}
```

Existing widgets (navbar, tabbar) don't use anchor, so no migration needed.

### 5. ResolvedNodeLayout carries resolved visibility and position

```ts
interface ResolvedNodeLayout {
  slot: string | undefined       // undefined when position-only
  sortScope: string | false
  order?: number
  visible: boolean               // predicate already evaluated
  position?: NodePosition
}
```

`resolveNodeLayout` evaluates the `visible` predicate:

```ts
const resolvedVisible = typeof merged.visible === 'function'
  ? merged.visible({ node, schema })
  : (merged.visible ?? true)
```

### 6. LayoutPlan unchanged — positioned nodes excluded

`createLayoutPlan()` behavior:
- Nodes with `layout.position` and no `slot` are **excluded** from `entries`, `slots`, `sortScopes`, and `slotManifests`.
- Nodes with both `slot` and `position` enter the slot system (position ignored).
- The shell independently discovers positioned nodes from `schema.root.children`.

### 7. Rendering pipeline

**Slot-based nodes (existing):**

```
schema → createLayoutPlan() → plan.slots → RootRenderer → WidgetRenderer
```

WidgetRenderer applies `.dc-node--hidden` CSS class when `resolvedLayout.visible === false`.

**Positioned nodes (new):**

```
schema.root.children
  → filter: node has layout.position
  → resolve visibility (design mode: all visible; preview mode: skip invisible)
  → group by position.anchor
  → render as absolutely-positioned overlay items
```

The shell handles positioned node rendering. Uses the same `.dc-node--hidden` CSS class for invisible nodes in design mode.

### 8. ContainerShellProps gets schema

The shell needs schema to discover positioned nodes. `ContainerShellProps` is extended:

```ts
interface ContainerShellProps {
  isEmpty: boolean
  slotVNodes: Record<string, VNode[]>
  layoutPlan?: LayoutPlan
  schema: DesignerSchema   // new
}
```

RootRenderer passes `schema` to the shell. The shell reads `schema.root.children`, filters for nodes with `layout.position`, and renders them as overlays.

### 9. Design mode vs Preview mode

- **Design mode (canvas):** All nodes render. Invisible nodes get `.dc-node--hidden` CSS class (visual distinction: semi-transparent, dashed border). Users can select and edit invisible nodes.
- **Preview mode / Runtime:** Invisible nodes are not rendered at all. Slot-based invisible nodes skipped in WidgetRenderer. Positioned invisible nodes skipped by shell.

The shell determines the current mode by reading the renderer's context. The renderer already distinguishes design-time from preview (e.g., for selection/toolbar behavior). The shell receives this signal via `ContainerShellProps` or via inject from the renderer context. The specific mechanism is an implementation detail — the contract is: in design mode, invisible nodes render with `.dc-node--hidden`; in preview mode, they are omitted entirely.

### 10. .dc-node--hidden CSS

Applied by both WidgetRenderer (slot nodes) and shell (positioned nodes):

```css
.dc-node--hidden {
  opacity: 0.4;
  outline: 1px dashed var(--dc-border, #999);
  outline-offset: -1px;
}
```

## Files Affected

| Package | File | Change |
|---------|------|--------|
| core | `types.ts` | Add `NodePosition`, update `NodeLayout`, `ResolvedNodeLayout`; remove `data` from `NodeLayout`; remove `anchor` from `LayoutSlotManifest` |
| core | `layout.ts` | Update `resolveNodeLayout` to handle `visible`, `position`, and position-only slot suppression |
| core | `layout.test.ts` | Add tests for position resolution, visible predicate, position-only exclusion |
| core | `index.ts` | Export `NodePosition` |
| renderer | `WidgetRenderer.ts` | Apply `.dc-node--hidden` class when `resolvedLayout.visible === false` |
| renderer | `useWidgetNode.ts` | Expose `visible` from resolved layout |
| renderer | `types.ts` | Add `schema` to `ContainerShellProps` |
| renderer | `RootRenderer.ts` | Pass `schema` to container shell |
| device-frames | `frame-slots.ts` | Remove anchor from overlay rendering; add positioned node discovery from schema |
| device-frames | `device-frame.css` | Add `.dc-node--hidden` styles |
| themes | `canvas.css` | Add `.dc-node--hidden` styles (if themes owns canvas styles) |
| designer | `useDragDrop.ts` | Exclude positioned nodes from sort scope calculations |

## Example: FAB Registration

```ts
// WidgetMeta — no anchor, no position
registerWidget({
  type: 'fab',
  title: 'Floating Action Button',
  group: 'action',
  defaultProps: { icon: 'plus', color: 'primary' },
  formSchema: {
    sections: [{
      title: 'Properties',
      fields: [
        { key: 'icon', label: 'Icon', component: 'icon-picker' },
        { key: 'color', label: 'Color', component: 'color-picker' },
      ],
    }],
  },
})

// Schema instance A — bottom-right, visible when logged in
{
  id: 'fab-main',
  type: 'fab',
  props: { icon: 'plus', color: 'primary' },
  layout: {
    position: { anchor: { block: 'end', inline: 'end' } },
    visible: (ctx) => ctx.schema.globalConfig.user.loggedIn,
  },
}

// Schema instance B — bottom-left, always visible
{
  id: 'fab-help',
  type: 'fab',
  props: { icon: 'help', color: 'secondary' },
  layout: {
    position: { anchor: { block: 'end', inline: 'start' } },
    visible: true,
  },
}
```
