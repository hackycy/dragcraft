# @dragcraft/icons Package Design

**Date:** 2026-06-26
**Status:** Approved

## Problem

The project uses 18 Unicode symbols and emoji characters across source code as UI icons. These render differently (or not at all) across operating systems, browsers, and font configurations. Examples:

- `☰` (hamburger) renders as a thick or thin trigram depending on the OS
- `📱🤖💻🖥️` (device emoji) have wildly different styles on iOS vs Windows vs Linux
- `◐▬◁○□` (Android frame chrome) may not render at all on systems missing the geometric shapes font

## Solution

Create a dedicated `@dragcraft/icons` package that exports each icon as a Vue `h()` render function. Replace all 18 inline Unicode symbols with imported SVG components.

## Package Structure

```
packages/icons/
  src/
    types.ts              # IconProps interface
    icons/
      drag.ts             # ☰  hamburger drag handle
      arrow-up.ts         # ↑  move up
      arrow-down.ts       # ↓  move down
      delete.ts           # ✕  delete/close
      undo.ts             # ↩  undo
      redo.ts             # ↪  redo
      phone.ts            # 📱 iPhone device
      robot.ts            # 🤖 Android device
      laptop.ts           # 💻 Tablet device
      desktop.ts          # 🖥️ Desktop device
      signal.ts           # ◐  signal indicator
      signal-bar.ts       # ▬  signal bar
      nav-back.ts         # ◁  Android back
      nav-home.ts         # ○  Android home
      nav-recent.ts       # □  Android recent apps
      plus.ts             # ✚  empty state plus
    index.ts              # barrel export
  package.json
  tsconfig.json
```

## API Design

### IconProps

```ts
export interface IconProps {
  size?: number | string   // default: 16
  color?: string           // default: 'currentColor'
  class?: string
}
```

### Single Icon Component

Each icon is a function that returns a VNode:

```ts
// src/icons/drag.ts
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
    'stroke-linejoin': 'round',
    class: cls,
  }, [
    h('path', { d: '...' }),
  ])
}
```

### SVG Design Rules

- viewBox: `0 0 16 16` (all icons)
- Stroke-based (not fill) for visual consistency
- `stroke: currentColor` to inherit parent text color
- Default `stroke-width: 1.5`, adjustable via SVG attributes
- No external dependencies, pure inline SVG paths

### Naming Convention

`Icon` + PascalCase semantic name:
`IconDrag`, `IconArrowUp`, `IconArrowDown`, `IconDelete`, `IconUndo`, `IconRedo`, `IconPhone`, `IconRobot`, `IconLaptop`, `IconDesktop`, `IconSignal`, `IconSignalBar`, `IconNavBack`, `IconNavHome`, `IconNavRecent`, `IconPlus`

## Type Changes

### NodeActionDefinition.icon (renderer)

**No change needed.** Already typed as `string | Component`. Existing rendering logic already handles both:

```ts
typeof action.icon === 'string' ? action.icon : (action.icon ? h(action.icon) : undefined)
```

### DevicePreset.icon (device-frames)

**Change required.** Currently `string`, needs to become `string | Component`.

```ts
// Before (packages/device-frames/src/types.ts)
icon: string

// After
import type { Component } from 'vue'
icon: string | Component
```

### Device Toolbar Rendering (device-frames)

The device picker button currently uses string concatenation. Needs to handle component icons:

```ts
// Before
}, `${preset.icon} ${preset.label}`)

// After
}, [
  typeof preset.icon === 'function' ? h(preset.icon, { size: 14 }) : preset.icon,
  ` ${preset.label}`,
])
```

## Migration Checklist

### New files (packages/icons/)

- `package.json` - workspace package with `@dragcraft/icons` name
- `tsconfig.json` - extends base config
- `src/types.ts` - IconProps interface
- `src/icons/*.ts` - 16 icon components
- `src/index.ts` - barrel export

### Modified files

| File | Change |
|------|--------|
| `packages/renderer/src/action-registry.ts` | Import IconDrag, IconArrowUp, IconArrowDown, IconDelete; replace 4 string icons |
| `packages/renderer/src/components/DefaultEmptyState.ts` | Import IconPlus; replace `'✚'` |
| `packages/device-frames/src/types.ts` | `icon: string` -> `icon: string \| Component` |
| `packages/device-frames/src/presets.ts` | Import IconPhone, IconRobot, IconLaptop, IconDesktop; replace 4 emoji strings |
| `packages/device-frames/src/toolbar/createDeviceToolbarRenderer.ts` | Import IconUndo, IconRedo; replace 2 string icons; update device picker rendering |
| `packages/device-frames/src/components/frames/AndroidFrame.ts` | Import IconSignal, IconSignalBar, IconNavBack, IconNavHome, IconNavRecent; replace 5 symbols |
| `packages/device-frames/src/components/frames/TabletFrame.ts` | Import IconSignal, IconSignalBar; replace 2 symbols |
| `packages/device-frames/package.json` | Add `@dragcraft/icons` dependency |
| `packages/renderer/package.json` | Add `@dragcraft/icons` dependency |

### Workspace root

- `pnpm-workspace.yaml` - already includes `packages/*`, no change needed
- Root `package.json` - no change needed

## Verification

After implementation:
1. `pnpm build` passes
2. `pnpm lint` passes
3. `pnpm typecheck` passes
4. Visual check: toolbar icons, device frames, empty state render correctly
5. Cross-platform: icons look identical on Windows, macOS, Linux
