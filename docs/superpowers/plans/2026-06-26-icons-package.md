# @dragcraft/icons Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all 18 inline Unicode symbols and emoji with a unified `@dragcraft/icons` SVG package for cross-platform consistency.

**Architecture:** New `packages/icons` package exports 16 Vue `h()` render functions (stroke-based SVG, viewBox 0 0 16 16). Consumers in `renderer` and `device-frames` import icon functions instead of inline Unicode strings. `NodeActionDefinition.icon` already accepts `string | Component`; `DevicePreset.icon` needs its type widened.

**Tech Stack:** Vue 3 `h()`, TypeScript, tsdown, pnpm workspace

## Global Constraints

- `pnpm build`, `pnpm lint`, `pnpm typecheck` must pass after each task
- No `structuredClone`, no Unicode emoji in source
- Workspace dependencies use `workspace:*` protocol
- Catalog dependencies: `vue: catalog:shared`
- tsdown config: `entry: ['src/index.ts'], dts: true`
- Every package has `name`, `type: "module"`, `version: "0.0.0"`, matching `exports`/`main`/`module`/`types`/`files` pattern
- SVG rules: viewBox `0 0 16 16`, stroke-based, `stroke: currentColor`, `stroke-width: 1.5`, `stroke-linecap: round`, `stroke-linejoin: round`

---

### Task 1: Scaffold `@dragcraft/icons` package

**Files:**
- Create: `packages/icons/package.json`
- Create: `packages/icons/tsdown.config.ts`

**Interfaces:**
- Produces: `@dragcraft/icons` workspace package available for dependency resolution

- [ ] **Step 1: Create `packages/icons/package.json`**

```json
{
  "name": "@dragcraft/icons",
  "type": "module",
  "version": "0.0.0",
  "description": "SVG icon components for @dragcraft",
  "author": "hackycy <hackycy@outlook.com>",
  "license": "MIT",
  "homepage": "https://github.com/hackycy-collection/dragcraft#readme",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/hackycy-collection/dragcraft.git"
  },
  "bugs": "https://github.com/hackycy-collection/dragcraft/issues",
  "keywords": [],
  "sideEffects": false,
  "exports": {
    ".": "./dist/index.mjs",
    "./package.json": "./package.json"
  },
  "main": "./dist/index.mjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.mts",
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsdown",
    "dev": "tsdown --watch",
    "lint": "eslint",
    "prepublishOnly": "nr build",
    "release": "bumpp",
    "start": "tsx src/index.ts",
    "test": "vitest",
    "typecheck": "tsc"
  },
  "peerDependencies": {
    "vue": ">=3.0.0"
  },
  "devDependencies": {
    "vue": "catalog:shared"
  }
}
```

- [ ] **Step 2: Create `packages/icons/tsdown.config.ts`**

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/index.ts',
  ],
  dts: true,
})
```

- [ ] **Step 3: Verify package is recognized**

Run: `pnpm ls -r @dragcraft/icons`
Expected: package listed (may show empty until src exists)

- [ ] **Step 4: Commit**

```bash
git add packages/icons/package.json packages/icons/tsdown.config.ts
git commit -m "chore(icons): scaffold @dragcraft/icons package"
```

---

### Task 2: Create types and barrel export

**Files:**
- Create: `packages/icons/src/types.ts`
- Create: `packages/icons/src/index.ts`

**Interfaces:**
- Produces: `IconProps` type — `{ size?: number | string, color?: string, class?: string }`
- Produces: barrel export that re-exports all icon functions

- [ ] **Step 1: Create `packages/icons/src/types.ts`**

```ts
export interface IconProps {
  size?: number | string
  color?: string
  class?: string
}
```

- [ ] **Step 2: Create `packages/icons/src/index.ts`**

```ts
// ── Types ─────────────────────────────────
export type { IconProps } from './types'

// ── Icons ─────────────────────────────────
export { IconDrag } from './icons/drag'
export { IconArrowUp } from './icons/arrow-up'
export { IconArrowDown } from './icons/arrow-down'
export { IconDelete } from './icons/delete'
export { IconUndo } from './icons/undo'
export { IconRedo } from './icons/redo'
export { IconPhone } from './icons/phone'
export { IconRobot } from './icons/robot'
export { IconLaptop } from './icons/laptop'
export { IconDesktop } from './icons/desktop'
export { IconSignal } from './icons/signal'
export { IconSignalBar } from './icons/signal-bar'
export { IconNavBack } from './icons/nav-back'
export { IconNavHome } from './icons/nav-home'
export { IconNavRecent } from './icons/nav-recent'
export { IconPlus } from './icons/plus'
```

- [ ] **Step 3: Commit**

```bash
git add packages/icons/src/types.ts packages/icons/src/index.ts
git commit -m "feat(icons): add types and barrel export"
```

---

### Task 3: Implement action toolbar icons (IconDrag, IconArrowUp, IconArrowDown, IconDelete)

**Files:**
- Create: `packages/icons/src/icons/drag.ts`
- Create: `packages/icons/src/icons/arrow-up.ts`
- Create: `packages/icons/src/icons/arrow-down.ts`
- Create: `packages/icons/src/icons/delete.ts`

**Interfaces:**
- Consumes: `IconProps` from `../types`
- Produces: `IconDrag`, `IconArrowUp`, `IconArrowDown`, `IconDelete` — each `(props?: IconProps) => VNode`

- [ ] **Step 1: Create `packages/icons/src/icons/drag.ts`**

Hamburger drag handle (three horizontal lines):

```ts
import { h } from 'vue'
import type { IconProps } from '../types'

export function IconDrag(props: IconProps = {}) {
  const { size = 16, color = 'currentColor', class: cls } = props
  return h('svg', {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: color,
    'stroke-width': 1.5,
    'stroke-linecap': 'round',
    class: cls,
  }, [
    h('line', { x1: 3, y1: 4, x2: 13, y2: 4 }),
    h('line', { x1: 3, y1: 8, x2: 13, y2: 8 }),
    h('line', { x1: 3, y1: 12, x2: 13, y2: 12 }),
  ])
}
```

- [ ] **Step 2: Create `packages/icons/src/icons/arrow-up.ts`**

Upward arrow:

```ts
import { h } from 'vue'
import type { IconProps } from '../types'

export function IconArrowUp(props: IconProps = {}) {
  const { size = 16, color = 'currentColor', class: cls } = props
  return h('svg', {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: color,
    'stroke-width': 1.5,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    class: cls,
  }, [
    h('path', { d: 'M8 12V4M4 7l4-4 4 4' }),
  ])
}
```

- [ ] **Step 3: Create `packages/icons/src/icons/arrow-down.ts`**

Downward arrow:

```ts
import { h } from 'vue'
import type { IconProps } from '../types'

export function IconArrowDown(props: IconProps = {}) {
  const { size = 16, color = 'currentColor', class: cls } = props
  return h('svg', {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: color,
    'stroke-width': 1.5,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    class: cls,
  }, [
    h('path', { d: 'M8 4v8M4 9l4 4 4-4' }),
  ])
}
```

- [ ] **Step 4: Create `packages/icons/src/icons/delete.ts`**

Close/X mark:

```ts
import { h } from 'vue'
import type { IconProps } from '../types'

export function IconDelete(props: IconProps = {}) {
  const { size = 16, color = 'currentColor', class: cls } = props
  return h('svg', {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: color,
    'stroke-width': 1.5,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    class: cls,
  }, [
    h('path', { d: 'M4 4l8 8M12 4l-8 8' }),
  ])
}
```

- [ ] **Step 5: Commit**

```bash
git add packages/icons/src/icons/drag.ts packages/icons/src/icons/arrow-up.ts packages/icons/src/icons/arrow-down.ts packages/icons/src/icons/delete.ts
git commit -m "feat(icons): add action toolbar icons (drag, arrow-up, arrow-down, delete)"
```

---

### Task 4: Implement undo/redo icons (IconUndo, IconRedo)

**Files:**
- Create: `packages/icons/src/icons/undo.ts`
- Create: `packages/icons/src/icons/redo.ts`

**Interfaces:**
- Consumes: `IconProps` from `../types`
- Produces: `IconUndo`, `IconRedo` — each `(props?: IconProps) => VNode`

- [ ] **Step 1: Create `packages/icons/src/icons/undo.ts`**

Leftward arrow with hook (undo):

```ts
import { h } from 'vue'
import type { IconProps } from '../types'

export function IconUndo(props: IconProps = {}) {
  const { size = 16, color = 'currentColor', class: cls } = props
  return h('svg', {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: color,
    'stroke-width': 1.5,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    class: cls,
  }, [
    h('path', { d: 'M3 7h7a3 3 0 0 1 0 6H9M3 7l3-3M3 7l3 3' }),
  ])
}
```

- [ ] **Step 2: Create `packages/icons/src/icons/redo.ts`**

Rightward arrow with hook (redo):

```ts
import { h } from 'vue'
import type { IconProps } from '../types'

export function IconRedo(props: IconProps = {}) {
  const { size = 16, color = 'currentColor', class: cls } = props
  return h('svg', {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: color,
    'stroke-width': 1.5,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    class: cls,
  }, [
    h('path', { d: 'M13 7H6a3 3 0 0 0 0 6h1M13 7l-3-3M13 7l-3 3' }),
  ])
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/icons/src/icons/undo.ts packages/icons/src/icons/redo.ts
git commit -m "feat(icons): add undo/redo icons"
```

---

### Task 5: Implement device preset icons (IconPhone, IconRobot, IconLaptop, IconDesktop)

**Files:**
- Create: `packages/icons/src/icons/phone.ts`
- Create: `packages/icons/src/icons/robot.ts`
- Create: `packages/icons/src/icons/laptop.ts`
- Create: `packages/icons/src/icons/desktop.ts`

**Interfaces:**
- Consumes: `IconProps` from `../types`
- Produces: `IconPhone`, `IconRobot`, `IconLaptop`, `IconDesktop` — each `(props?: IconProps) => VNode`

- [ ] **Step 1: Create `packages/icons/src/icons/phone.ts`**

Mobile phone outline:

```ts
import { h } from 'vue'
import type { IconProps } from '../types'

export function IconPhone(props: IconProps = {}) {
  const { size = 16, color = 'currentColor', class: cls } = props
  return h('svg', {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: color,
    'stroke-width': 1.5,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    class: cls,
  }, [
    h('rect', { x: 4, y: 1, width: 8, height: 14, rx: 1.5 }),
    h('line', { x1: 7, y1: 12.5, x2: 9, y2: 12.5 }),
  ])
}
```

- [ ] **Step 2: Create `packages/icons/src/icons/robot.ts`**

Robot face (for Android):

```ts
import { h } from 'vue'
import type { IconProps } from '../types'

export function IconRobot(props: IconProps = {}) {
  const { size = 16, color = 'currentColor', class: cls } = props
  return h('svg', {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: color,
    'stroke-width': 1.5,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    class: cls,
  }, [
    h('rect', { x: 3, y: 5, width: 10, height: 9, rx: 1.5 }),
    h('line', { x1: 5.5, y1: 2, x2: 5.5, y2: 5 }),
    h('line', { x1: 10.5, y1: 2, x2: 10.5, y2: 5 }),
    h('line', { x1: 2, y1: 8, x2: 3, y2: 8 }),
    h('line', { x1: 13, y1: 8, x2: 14, y2: 8 }),
    h('circle', { cx: 6, cy: 9, r: 0.5, fill: color, stroke: 'none' }),
    h('circle', { cx: 10, cy: 9, r: 0.5, fill: color, stroke: 'none' }),
    h('path', { d: 'M6 11.5h4' }),
  ])
}
```

- [ ] **Step 3: Create `packages/icons/src/icons/laptop.ts`**

Laptop computer:

```ts
import { h } from 'vue'
import type { IconProps } from '../types'

export function IconLaptop(props: IconProps = {}) {
  const { size = 16, color = 'currentColor', class: cls } = props
  return h('svg', {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: color,
    'stroke-width': 1.5,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    class: cls,
  }, [
    h('rect', { x: 2, y: 2, width: 12, height: 9, rx: 1 }),
    h('path', { d: 'M1 13h14' }),
  ])
}
```

- [ ] **Step 4: Create `packages/icons/src/icons/desktop.ts`**

Desktop computer:

```ts
import { h } from 'vue'
import type { IconProps } from '../types'

export function IconDesktop(props: IconProps = {}) {
  const { size = 16, color = 'currentColor', class: cls } = props
  return h('svg', {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: color,
    'stroke-width': 1.5,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    class: cls,
  }, [
    h('rect', { x: 1, y: 2, width: 14, height: 9, rx: 1 }),
    h('line', { x1: 5, y1: 14, x2: 11, y2: 14 }),
    h('line', { x1: 8, y1: 11, x2: 8, y2: 14 }),
  ])
}
```

- [ ] **Step 5: Commit**

```bash
git add packages/icons/src/icons/phone.ts packages/icons/src/icons/robot.ts packages/icons/src/icons/laptop.ts packages/icons/src/icons/desktop.ts
git commit -m "feat(icons): add device preset icons (phone, robot, laptop, desktop)"
```

---

### Task 6: Implement device frame chrome icons (signal, nav bar, plus)

**Files:**
- Create: `packages/icons/src/icons/signal.ts`
- Create: `packages/icons/src/icons/signal-bar.ts`
- Create: `packages/icons/src/icons/nav-back.ts`
- Create: `packages/icons/src/icons/nav-home.ts`
- Create: `packages/icons/src/icons/nav-recent.ts`
- Create: `packages/icons/src/icons/plus.ts`

**Interfaces:**
- Consumes: `IconProps` from `../types`
- Produces: `IconSignal`, `IconSignalBar`, `IconNavBack`, `IconNavHome`, `IconNavRecent`, `IconPlus`

- [ ] **Step 1: Create `packages/icons/src/icons/signal.ts`**

Half-filled circle (signal/WiFi indicator):

```ts
import { h } from 'vue'
import type { IconProps } from '../types'

export function IconSignal(props: IconProps = {}) {
  const { size = 16, color = 'currentColor', class: cls } = props
  return h('svg', {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: color,
    'stroke-width': 1.5,
    class: cls,
  }, [
    h('circle', { cx: 8, cy: 8, r: 5 }),
    h('path', { d: 'M8 3v10A5 5 0 0 0 8 3', fill: color, stroke: 'none' }),
  ])
}
```

- [ ] **Step 2: Create `packages/icons/src/icons/signal-bar.ts`**

Black rectangle (signal bar):

```ts
import { h } from 'vue'
import type { IconProps } from '../types'

export function IconSignalBar(props: IconProps = {}) {
  const { size = 16, color = 'currentColor', class: cls } = props
  return h('svg', {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    class: cls,
  }, [
    h('rect', { x: 2, y: 5, width: 12, height: 6, rx: 1, fill: color }),
  ])
}
```

- [ ] **Step 3: Create `packages/icons/src/icons/nav-back.ts`**

Left-pointing triangle (Android back):

```ts
import { h } from 'vue'
import type { IconProps } from '../types'

export function IconNavBack(props: IconProps = {}) {
  const { size = 16, color = 'currentColor', class: cls } = props
  return h('svg', {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: color,
    'stroke-width': 1.5,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    class: cls,
  }, [
    h('path', { d: 'M10 3L5 8l5 5' }),
  ])
}
```

- [ ] **Step 4: Create `packages/icons/src/icons/nav-home.ts`**

Circle (Android home):

```ts
import { h } from 'vue'
import type { IconProps } from '../types'

export function IconNavHome(props: IconProps = {}) {
  const { size = 16, color = 'currentColor', class: cls } = props
  return h('svg', {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: color,
    'stroke-width': 1.5,
    class: cls,
  }, [
    h('circle', { cx: 8, cy: 8, r: 5 }),
  ])
}
```

- [ ] **Step 5: Create `packages/icons/src/icons/nav-recent.ts`**

Square (Android recent apps):

```ts
import { h } from 'vue'
import type { IconProps } from '../types'

export function IconNavRecent(props: IconProps = {}) {
  const { size = 16, color = 'currentColor', class: cls } = props
  return h('svg', {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: color,
    'stroke-width': 1.5,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    class: cls,
  }, [
    h('rect', { x: 3, y: 3, width: 10, height: 10, rx: 1 }),
  ])
}
```

- [ ] **Step 6: Create `packages/icons/src/icons/plus.ts`**

Plus sign (empty state):

```ts
import { h } from 'vue'
import type { IconProps } from '../types'

export function IconPlus(props: IconProps = {}) {
  const { size = 16, color = 'currentColor', class: cls } = props
  return h('svg', {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: color,
    'stroke-width': 1.5,
    'stroke-linecap': 'round',
    class: cls,
  }, [
    h('line', { x1: 8, y1: 3, x2: 8, y2: 13 }),
    h('line', { x1: 3, y1: 8, x2: 13, y2: 8 }),
  ])
}
```

- [ ] **Step 7: Verify icons package builds**

Run: `cd packages/icons && pnpm build`
Expected: build succeeds, `dist/index.mjs` and `dist/index.d.mts` exist

- [ ] **Step 8: Verify typecheck**

Run: `cd packages/icons && pnpm typecheck`
Expected: no errors

- [ ] **Step 9: Commit**

```bash
git add packages/icons/src/icons/
git commit -m "feat(icons): add device frame chrome icons (signal, nav, plus)"
```

---

### Task 7: Migrate renderer to use @dragcraft/icons

**Files:**
- Modify: `packages/renderer/package.json` — add `@dragcraft/icons` dependency
- Modify: `packages/renderer/src/action-registry.ts` — replace 4 string icons
- Modify: `packages/renderer/src/components/DefaultEmptyState.ts` — replace `✚`

**Interfaces:**
- Consumes: `IconDrag`, `IconArrowUp`, `IconArrowDown`, `IconDelete`, `IconPlus` from `@dragcraft/icons`
- Consumes: `NodeActionDefinition.icon` already typed as `string | Component` (no type change needed)

- [ ] **Step 1: Add dependency to `packages/renderer/package.json`**

In the `dependencies` section, add:

```json
"@dragcraft/icons": "workspace:*"
```

Final dependencies block:

```json
"dependencies": {
  "@dragcraft/core": "workspace:*",
  "@dragcraft/icons": "workspace:*",
  "@dragcraft/utils": "workspace:*"
}
```

- [ ] **Step 2: Update `packages/renderer/src/action-registry.ts`**

Add import at top of file:

```ts
import { IconArrowDown, IconArrowUp, IconDelete, IconDrag } from '@dragcraft/icons'
```

Replace icon values (line 179, 191, 221, 251):

```ts
// Line 179: icon: '☰',
icon: IconDrag,

// Line 191: icon: '↑',
icon: IconArrowUp,

// Line 221: icon: '↓',
icon: IconArrowDown,

// Line 251: icon: '✕',
icon: IconDelete,
```

- [ ] **Step 3: Update `packages/renderer/src/components/DefaultEmptyState.ts`**

Add import:

```ts
import { IconPlus } from '@dragcraft/icons'
```

Replace line 28:

```ts
// Before
h('div', { class: 'dc-empty-state__icon' }, '✚')

// After
h('div', { class: 'dc-empty-state__icon' }, h(IconPlus, { size: 32 }))
```

- [ ] **Step 4: Verify renderer builds**

Run: `cd packages/renderer && pnpm build`
Expected: build succeeds

- [ ] **Step 5: Verify typecheck**

Run: `cd packages/renderer && pnpm typecheck`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add packages/renderer/package.json packages/renderer/src/action-registry.ts packages/renderer/src/components/DefaultEmptyState.ts
git commit -m "feat(renderer): migrate to @dragcraft/icons"
```

---

### Task 8: Migrate device-frames to use @dragcraft/icons

**Files:**
- Modify: `packages/device-frames/package.json` — add `@dragcraft/icons` dependency
- Modify: `packages/device-frames/src/types.ts` — widen `DevicePreset.icon` type
- Modify: `packages/device-frames/src/presets.ts` — replace 4 emoji strings
- Modify: `packages/device-frames/src/toolbar/createDeviceToolbarRenderer.ts` — replace undo/redo + update device picker rendering
- Modify: `packages/device-frames/src/components/frames/AndroidFrame.ts` — replace 5 symbols
- Modify: `packages/device-frames/src/components/frames/TabletFrame.ts` — replace 2 symbols

**Interfaces:**
- Consumes: all 12 device-related icons from `@dragcraft/icons`
- Produces: `DevicePreset.icon` type changed from `string` to `string | Component`

- [ ] **Step 1: Add dependency to `packages/device-frames/package.json`**

Add to `devDependencies` (icons are peer-resolved, no runtime dep needed since device-frames already has `vue` as peerDep):

Actually, icons are used at runtime in the rendered output. Add to `dependencies` — but device-frames currently has no `dependencies` block. Add one:

```json
"dependencies": {
  "@dragcraft/icons": "workspace:*"
}
```

- [ ] **Step 2: Update `packages/device-frames/src/types.ts`**

Add import and widen the icon type. The current `icon` field is at line 25:

```ts
// Before
icon: string

// After
import type { Component } from 'vue'
// ...
icon: string | Component
```

- [ ] **Step 3: Update `packages/device-frames/src/presets.ts`**

Add imports at top:

```ts
import { IconDesktop, IconLaptop, IconPhone, IconRobot } from '@dragcraft/icons'
```

Replace icon values:

```ts
// Line 10: icon: '📱',
icon: IconPhone,

// Line 19: icon: '🤖',
icon: IconRobot,

// Line 28: icon: '💻',
icon: IconLaptop,

// Line 37: icon: '🖥️',
icon: IconDesktop,
```

- [ ] **Step 4: Update `packages/device-frames/src/toolbar/createDeviceToolbarRenderer.ts`**

Add imports at top:

```ts
import { IconRedo, IconUndo } from '@dragcraft/icons'
```

Replace undo button (line 56):

```ts
// Before
}, '↩'),

// After
}, h(IconUndo, { size: 14 })),
```

Replace redo button (line 62):

```ts
// Before
}, '↪'),

// After
}, h(IconRedo, { size: 14 })),
```

Update device picker rendering (line 79). The current code uses string concatenation:

```ts
// Before
}, `${preset.icon} ${preset.label}`),

// After
}, [
  typeof preset.icon === 'function' ? h(preset.icon, { size: 14 }) : preset.icon,
  ` ${preset.label}`,
]),
```

- [ ] **Step 5: Update `packages/device-frames/src/components/frames/AndroidFrame.ts`**

Add imports at top:

```ts
import { IconNavBack, IconNavHome, IconNavRecent, IconSignal, IconSignalBar } from '@dragcraft/icons'
```

Replace status bar icons (lines 17-18):

```ts
// Before
h('span', null, '◐'),
h('span', null, '▬'),

// After
h('span', null, h(IconSignal, { size: 10 })),
h('span', null, h(IconSignalBar, { size: 10 })),
```

Replace nav bar icons (lines 25-27):

```ts
// Before
h('span', { class: 'dc-device-frame__nav-btn' }, '◁'),
h('span', { class: 'dc-device-frame__nav-btn dc-device-frame__nav-btn--home' }, '○'),
h('span', { class: 'dc-device-frame__nav-btn' }, '□'),

// After
h('span', { class: 'dc-device-frame__nav-btn' }, h(IconNavBack, { size: 12 })),
h('span', { class: 'dc-device-frame__nav-btn dc-device-frame__nav-btn--home' }, h(IconNavHome, { size: 12 })),
h('span', { class: 'dc-device-frame__nav-btn' }, h(IconNavRecent, { size: 12 })),
```

- [ ] **Step 6: Update `packages/device-frames/src/components/frames/TabletFrame.ts`**

Add imports at top:

```ts
import { IconSignal, IconSignalBar } from '@dragcraft/icons'
```

Replace status bar icons (lines 17-18):

```ts
// Before
h('span', null, '◐'),
h('span', null, '▬'),

// After
h('span', null, h(IconSignal, { size: 10 })),
h('span', null, h(IconSignalBar, { size: 10 })),
```

- [ ] **Step 7: Verify device-frames builds**

Run: `cd packages/device-frames && pnpm build`
Expected: build succeeds

- [ ] **Step 8: Verify typecheck**

Run: `cd packages/device-frames && pnpm typecheck`
Expected: no errors

- [ ] **Step 9: Commit**

```bash
git add packages/device-frames/
git commit -m "feat(device-frames): migrate to @dragcraft/icons"
```

---

### Task 9: Final verification

**Files:** None (verification only)

- [ ] **Step 1: Run full build**

Run: `pnpm build`
Expected: all packages build successfully

- [ ] **Step 2: Run lint**

Run: `pnpm lint`
Expected: no errors

- [ ] **Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: no errors

- [ ] **Step 4: Verify no remaining Unicode symbols**

Run: search for `☰`, `↑`, `↓`, `✕`, `↩`, `↪`, `\uD83D`, `\uD83E`, `◐`, `▬`, `◁`, `○`, `□`, `✚` in `packages/` source files (excluding comments and this plan).
Expected: zero matches

- [ ] **Step 5: Commit (if any fixups needed)**

```bash
git add -A
git commit -m "chore: verify icons migration completeness"
```
