# Playground Mini-App Widgets Upgrade Design

**Goal:** Upgrade the playground to demonstrate full mini-program decoration capabilities by adding navigation/tab/swiper widgets and type-level behavior fields (locked, sticky, zIndex).

## Overview

The playground currently has 10 builtin widgets (5 basic + 5 form) with flat linear layout. This design adds:

1. Three new playground-only widgets: Navbar, TabBar, Swiper
2. Type-level behavior fields (locked, sticky, zIndex) on widget meta
3. Designer integration for locked widgets (prevent delete/drag)
4. Updated templates showcasing complete mini-program page structures

**Non-goals:** Modifying `@dragcraft/core`, `@dragcraft/renderer`, or `@dragcraft/designer` packages. All changes are playground-only.

## 1. New Widget Components

All widgets live in `playground/src/widgets/` with the same pattern as `packages/builtin-widgets`.

### 1.1 NavbarWidget

**File:** `playground/src/widgets/NavbarWidget.ts`

Simulates a WeChat mini-program top navigation bar.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `'页面标题'` | Navigation bar title text |
| `showBack` | `boolean` | `false` | Show back arrow button |
| `backgroundColor` | `string` | `'#ffffff'` | Background color |
| `textColor` | `string` | `'#1a1a1a'` | Title text color |
| `transparent` | `boolean` | `false` | Transparent background mode |

**Rendering:** Left back arrow (when `showBack`) + centered title + right placeholder area. Height ~44px + status bar padding.

**Meta behavior:** `locked: true`, `sticky: 'top'`, `zIndex: 100`

**Form schema sections:**
- Basic: title, showBack
- Style: backgroundColor, textColor, transparent

### 1.2 TabBarWidget

**File:** `playground/src/widgets/TabBarWidget.ts`

Simulates a WeChat mini-program bottom tab bar.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tabs` | `Array<{label, icon}>` | `[{label:'首页',icon:'home'},{label:'我的',icon:'user'}]` | Tab items |
| `activeIndex` | `number` | `0` | Currently selected tab |
| `backgroundColor` | `string` | `'#ffffff'` | Background color |
| `activeColor` | `string` | `'#07C160'` | Active tab color |
| `inactiveColor` | `string` | `'#999999'` | Inactive tab color |

**Rendering:** Horizontal row of icon + label items. Height ~50px + safe area padding. Uses simple SVG icons or Unicode symbols for tab icons.

**Meta behavior:** `locked: true`, `sticky: 'bottom'`, `zIndex: 100`

**Form schema sections:**
- Basic: tabs (JSON editor or repeatable fields), activeIndex
- Style: backgroundColor, activeColor, inactiveColor

### 1.3 SwiperWidget

**File:** `playground/src/widgets/SwiperWidget.ts`

Image carousel/swiper component.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `images` | `string[]` | `['https://picsum.photos/seed/swiper1/750/300', ...]` | Image URLs |
| `autoplay` | `boolean` | `true` | Auto-play (disabled in design mode) |
| `interval` | `number` | `3000` | Auto-play interval (ms) |
| `showIndicator` | `boolean` | `true` | Show dot indicators |
| `height` | `number` | `180` | Swiper height (px) |
| `borderRadius` | `number` | `0` | Corner radius (px) |

**Rendering:** Shows first image + indicator dots in design mode. No actual auto-play in the designer canvas.

**Meta behavior:** None (normal widget, no special locking)

**Form schema sections:**
- Basic: images (textarea, one URL per line), autoplay, interval
- Style: showIndicator, height, borderRadius

## 2. Behavior Fields Extension

### 2.1 Type Definition

**File:** `playground/src/widgets/types.ts`

```ts
import type { WidgetMeta } from '@dragcraft/core'

/**
 * Extended widget meta with playground-specific behavior fields.
 * These fields control how widgets behave in the designer canvas.
 */
export interface PlaygroundWidgetMeta extends WidgetMeta {
  /** Prevent drag-move and delete in the canvas */
  locked?: boolean
  /** Fix widget to top or bottom of canvas via CSS sticky */
  sticky?: 'top' | 'bottom'
  /** Fixed z-index for overlapping control */
  zIndex?: number
}
```

### 2.2 Behavior Resolution

Each playground widget meta includes these fields directly. The components read their own meta to apply CSS:

- **NavbarWidget:** Renders with inline `style="position: sticky; top: 0; z-index: 100"` (derived from meta)
- **TabBarWidget:** Renders with inline `style="position: sticky; bottom: 0; z-index: 100"` (derived from meta)

This approach avoids modifying the renderer — the behavior is self-contained in the component.

## 3. Designer Integration (Locked Widgets)

### 3.1 Delete Interception

In `App.vue`, extend the `eventHooks.onBeforeDelete` handler:

```ts
const lockedTypes = new Set(
  playgroundWidgetMetas.filter(m => m.locked).map(m => m.type)
)

eventHooks: {
  onBeforeDelete: (ctx) => {
    if (lockedTypes.has(ctx.node.type)) {
      alert('该组件已锁定，无法删除')
      return Promise.resolve(false)
    }
    return Promise.resolve(confirm('确认删除该组件？'))
  },
}
```

### 3.2 Drag/Sort Restriction

For the initial implementation, locked widgets will:
- Have their delete prevented via `onBeforeDelete`
- Still show the toolbar but with delete disabled

Full drag-sort restriction (skipping locked nodes during reorder) requires deeper renderer integration and is deferred to a follow-up. The delete interception is the most important constraint.

### 3.3 Visual Indication

Locked widgets in the canvas display a small lock icon badge via CSS `::after` pseudo-element on the widget's root element (using the `.dc-widget-navbar::after` / `.dc-widget-tabbar::after` selectors). The badge renders a small lock icon in the top-right corner of the widget.

## 4. Template Updates

### 4.1 E-commerce Homepage (`ecommerce-schema.ts`)

Updated structure:
```
Navbar (title: "好物精选", locked)
  ↓
Swiper (3 banner images)
  ↓
[existing content: shop title, description, products, form, etc.]
  ↓
TabBar (tabs: 首页/分类/购物车/我的, locked)
```

### 4.2 Content Detail Page (`content-detail-schema.ts`)

Updated structure:
```
Navbar (title: "精选文章", showBack: true, locked)
  ↓
[existing content: cover, title, author, body, etc.]
```

No TabBar for detail pages.

### 4.3 Product Detail Page (`product-detail-schema.ts`)

Updated structure:
```
Navbar (title: "商品详情", showBack: true, locked)
  ↓
[existing content: product images, price, specs, buttons]
```

No TabBar for detail pages.

## 5. Widget Registration

### 5.1 Playground Widgets Index

**File:** `playground/src/widgets/index.ts`

Exports:
- `playgroundWidgetMetas: PlaygroundWidgetMeta[]` — all playground widget metas
- `playgroundComponentMap: Record<string, Component>` — type → component mapping
- `playgroundWidgetGroups: WidgetGroupConfig[]` — navigation group config
- Individual metas and components for tree-shaking

### 5.2 App.vue Integration

```ts
import {
  playgroundWidgetMetas,
  playgroundComponentMap,
  playgroundWidgetGroups,
} from './widgets'

// Merge builtin + playground
const allMetas = [...getAllWidgetMetas(), ...playgroundWidgetMetas]
const allComponentMap = { ...getDefaultComponentMap(), ...playgroundComponentMap }
const allGroups = [...widgetGroups, ...playgroundWidgetGroups]

const designer = createDesigner({
  // ...existing config
  widgetMetas: allMetas,
  componentMap: allComponentMap,
  widgetGroups: allGroups,
})
```

### 5.3 Widget Groups

Existing groups:
- `basic` — 基础展示
- `form` — 表单交互

New group:
- `navigation` — 导航容器

Assignment:
- Navbar → `navigation`
- TabBar → `navigation`
- Swiper → `basic`

## 6. Playground Styles

**File:** `playground/src/styles/playground.css`

Add styles for new widgets:

- `.dc-widget-navbar` — Navigation bar styling (status bar padding, title centering, back button)
- `.dc-widget-tabbar` — Tab bar styling (flex row, icon + label layout, safe area padding)
- `.dc-widget-swiper` — Swiper styling (image container, indicator dots, overflow hidden)
- `.playground-locked-badge` — Small lock icon overlay for locked widgets

## 7. File Changes Summary

| Action | File | Description |
|--------|------|-------------|
| Create | `playground/src/widgets/types.ts` | PlaygroundWidgetMeta extension type |
| Create | `playground/src/widgets/NavbarWidget.ts` | Navigation bar component + meta |
| Create | `playground/src/widgets/TabBarWidget.ts` | Tab bar component + meta |
| Create | `playground/src/widgets/SwiperWidget.ts` | Swiper component + meta |
| Create | `playground/src/widgets/index.ts` | Unified exports for playground widgets |
| Modify | `playground/src/App.vue` | Register playground widgets, add locked delete interception |
| Modify | `playground/src/config/templates/ecommerce-schema.ts` | Add Navbar + TabBar + Swiper |
| Modify | `playground/src/config/templates/content-detail-schema.ts` | Add Navbar |
| Modify | `playground/src/config/templates/product-detail-schema.ts` | Add Navbar |
| Modify | `playground/src/styles/playground.css` | New widget styles + locked badge |
| Unchanged | `playground/src/main.ts` | No changes needed |
| Unchanged | `playground/src/shared/*` | SchemaIOModal, use-schema-io — no changes |
| Unchanged | `packages/*` | No core/renderer/designer changes |

## 8. Success Criteria

- Navbar, TabBar, Swiper widgets appear in the material panel under correct groups
- All 3 widgets render correctly in the canvas (device frame)
- Navbar and TabBar are locked: delete is prevented with alert message
- E-commerce template shows full page structure: Navbar → Swiper → content → TabBar
- Content detail and product detail templates show Navbar at top
- Swiper shows first image + indicator dots in design mode
- `pnpm build`, `pnpm lint`, `pnpm typecheck` pass
