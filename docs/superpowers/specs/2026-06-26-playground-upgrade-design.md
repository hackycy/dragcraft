# Playground Upgrade Design

**Goal:** Upgrade the playground from a basic internal demo to an external-facing, product-grade showcase of the dragcraft architecture, oriented toward mini-program decoration scenarios.

## Overview

The playground currently consists of a single `App.vue` with a hardcoded e-commerce schema and a bottom action bar. This design upgrades it with:

1. A product-grade top header bar replacing the bottom action bar
2. Three pre-built scene templates (e-commerce homepage, content detail, product detail)
3. Template switching with modification detection

**Non-goals:** Theme switching, preview mode, Vue Router, component decomposition beyond what's needed.

## 1. PlaygroundHeader Component

**File:** `playground/src/components/PlaygroundHeader.vue`

Layout (left to right):
- **Brand:** "Dragcraft Playground" text label
- **Template switcher:** Dropdown/select with 3 template options
- **Spacer**
- **Undo/Redo:** Icon buttons, disabled when unavailable
- **Import/Export:** Same buttons as current bottom bar
- **Locale toggle:** zh-CN / en switch

Props:
- `activeTemplateId: string` — currently selected template
- `templates: Array<{ id: string; label: string }>` — available templates
- `canUndo: boolean`
- `canRedo: boolean`

Emits:
- `templateSwitch(id: string)` — user selected a different template
- `undo` / `redo`
- `importOpen` / `exportOpen`
- `toggleLocale`

Styling: Uses existing `--dc-*` CSS variables. Matches the designer's visual language. Header height ~48px, border-bottom separator.

## 2. Template Schemas

**Directory:** `playground/src/config/templates/`

Each template exports a `DesignerSchema` object.

### 2.1 `ecommerce-schema.ts`

The existing `initial-schema.ts` content, relocated. No schema changes. Contains: banner image, shop title/description, divider, product image, product name/price, buy button, member form section (name, phone, gender, agreement, submit).

### 2.2 `content-detail-schema.ts`

Simulates a mini-program article detail page. Widgets used:
- Image (cover banner)
- Text (title, author info, body paragraphs)
- Divider (section separators)
- Button (follow author action)
- Link (share action)

### 2.3 `product-detail-schema.ts`

Simulates a mini-program product detail page. Widgets used:
- Image (product hero image)
- Text (price, original price, product name, description)
- Divider (section separators)
- Form-select (color spec, size spec — demonstrating form widgets in non-form context)
- Button (add to cart, buy now)

## 3. Template Switching

**File:** `playground/src/composables/useTemplateSwitch.ts`

### Template Registry

```ts
interface TemplateEntry {
  id: string
  label: string
  schema: DesignerSchema
}
```

Static array with 3 entries: `ecommerce`, `content-detail`, `product-detail`.

### Composable API

```ts
function useTemplateSwitch(options: {
  importSchema: (schema: DesignerSchema) => void
  exportSchema: () => DesignerSchema
}): {
  activeTemplateId: Ref<string>
  templates: TemplateEntry[]
  switchTemplate: (id: string) => void
  resetTemplate: () => void
}
```

### Switch Logic

`switchTemplate(id)`:
1. Get current schema via `exportSchema()`
2. Get baseline schema from the active template entry
3. Compare via `JSON.stringify(current) === JSON.stringify(baseline)`
4. If different, `confirm('当前修改将丢失，是否切换？')` — abort if user cancels
5. Call `importSchema(targetTemplate.schema)`
6. Update `activeTemplateId`

`resetTemplate()`:
1. Re-import the active template's baseline schema (discard all modifications)

## 4. App.vue Changes

### Removals
- Bottom action bar (`.playground-actions`) — moved to header
- `SchemaIOModal.vue` usage stays, but trigger moves to header events
- `MiniProgramEmptyState` — stays as-is (no changes)

### Additions
- Import `PlaygroundHeader` component
- Import `useTemplateSwitch` composable
- Import all 3 template schemas
- Wire header events to existing `useDesigner()` and `useSchemaIO()` APIs

### Updated Flow

```
App.vue
├── PlaygroundHeader (top)
│   ├── template switch → useTemplateSwitch.switchTemplate()
│   ├── undo/redo → designer.undo() / designer.redo()
│   ├── import/export → io.handleImportOpen() / io.handleExport()
│   └── locale → toggleLocale()
├── DcDesigner (main area, flex: 1)
└── SchemaIOModal (overlay)
```

## 5. File Changes Summary

| Action | File | Description |
|--------|------|-------------|
| Create | `playground/src/components/PlaygroundHeader.vue` | Top header bar component |
| Create | `playground/src/composables/useTemplateSwitch.ts` | Template switching composable |
| Create | `playground/src/config/templates/ecommerce-schema.ts` | E-commerce homepage template (from existing initial-schema) |
| Create | `playground/src/config/templates/content-detail-schema.ts` | Content detail page template |
| Create | `playground/src/config/templates/product-detail-schema.ts` | Product detail page template |
| Modify | `playground/src/App.vue` | Replace bottom bar with header, integrate template switching |
| Delete | `playground/src/config/initial-schema.ts` | Replaced by templates/ directory |
| Unchanged | `playground/src/styles/playground.css` | Keep existing styles, add header styles |
| Unchanged | `playground/src/shared/*` | SchemaIOModal, use-schema-io, fields — no changes |
| Unchanged | `playground/src/main.ts` | No changes |

## 6. Success Criteria

- Header displays correctly with all interactive elements
- All 3 templates load without errors and render in the device frame
- Template switching works: modified schema triggers confirm dialog, clean switch imports new schema
- Undo/Redo buttons reflect actual engine state
- Import/Export, Locale toggle work from the header (same behavior as before)
- `pnpm build`, `pnpm lint`, `pnpm typecheck` pass
