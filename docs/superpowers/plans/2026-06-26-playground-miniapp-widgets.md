# Playground Mini-App Widgets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Navbar, TabBar, Swiper widgets to the playground with locked/sticky/zIndex behavior, updating templates to showcase complete mini-program page structures.

**Architecture:** Three new playground-only Vue components registered alongside builtins. `locked` maps to core's `deletable: false, draggable: false, sortable: false` on WidgetMeta. `sticky`/`zIndex` are handled via inline CSS in the components. No changes to `packages/*`.

**Tech Stack:** Vue 3 (defineComponent + h), TypeScript, Vite

## Global Constraints

- All changes are playground-only (`playground/` directory)
- No modifications to `packages/core`, `packages/renderer`, `packages/designer`, or any other package
- Follow existing widget pattern: export meta object + default component from same file
- Use `@dragcraft/core`'s `WidgetMeta` type directly (no type extension needed — `locked` = `deletable:false, draggable:false, sortable:false`)
- `pnpm build`, `pnpm lint`, `pnpm typecheck` must pass after all changes

---

### Task 1: Create PlaygroundWidgetMeta Type

**Files:**
- Create: `playground/src/widgets/types.ts`

**Interfaces:**
- Produces: `PlaygroundWidgetMeta` type used by Tasks 2-5

This file documents the playground-specific behavior fields. While core's `WidgetMeta` already has `deletable`/`draggable`/`sortable`, this type adds `sticky` and `zIndex` as documentation — components hardcode these values in their rendering.

- [ ] **Step 1: Create the types file**

```ts
// playground/src/widgets/types.ts
import type { WidgetMeta } from '@dragcraft/core'

/**
 * Extended widget meta with playground-specific behavior fields.
 *
 * `locked` is a convenience concept — set deletable:false, draggable:false,
 * sortable:false on the WidgetMeta to achieve it.
 *
 * `sticky` and `zIndex` are rendering concerns handled by the component itself.
 */
export interface PlaygroundWidgetMeta extends WidgetMeta {
  /** Fix widget to top or bottom of canvas via CSS sticky */
  sticky?: 'top' | 'bottom'
  /** Fixed z-index for overlapping control */
  zIndex?: number
}
```

- [ ] **Step 2: Verify types compile**

Run: `cd D:/Workspaces/dragcraft && pnpm -F playground exec tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add playground/src/widgets/types.ts
git commit -m "feat(playground): add PlaygroundWidgetMeta type"
```

---

### Task 2: Create NavbarWidget

**Files:**
- Create: `playground/src/widgets/NavbarWidget.ts`

**Interfaces:**
- Produces: `navbarWidgetMeta` (PlaygroundWidgetMeta), `NavbarWidget` (Component)
- Used by: Task 5 (index.ts), Task 7 (templates)

- [ ] **Step 1: Create the NavbarWidget file**

```ts
// playground/src/widgets/NavbarWidget.ts
import type { PlaygroundWidgetMeta } from './types'
import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

export const navbarWidgetMeta: PlaygroundWidgetMeta = {
  type: 'navbar',
  title: '导航栏',
  group: 'navigation',
  icon: 'navbar',
  sticky: 'top',
  zIndex: 100,
  deletable: false,
  draggable: false,
  sortable: false,
  mask: false,
  defaultProps: {
    title: '页面标题',
    showBack: false,
    backgroundColor: '#ffffff',
    textColor: '#1a1a1a',
    transparent: false,
  },
  defaultStyle: {
    width: '100%',
  },
  formSchema: {
    sections: [
      {
        title: '基础设置',
        fields: [
          {
            key: 'title',
            label: '标题文字',
            component: 'input',
            defaultValue: '页面标题',
            props: { placeholder: '请输入导航栏标题' },
          },
          {
            key: 'showBack',
            label: '显示返回按钮',
            component: 'switch',
            defaultValue: false,
          },
        ],
      },
      {
        title: '样式设置',
        fields: [
          {
            key: 'backgroundColor',
            label: '背景颜色',
            component: 'color',
            defaultValue: '#ffffff',
          },
          {
            key: 'textColor',
            label: '文字颜色',
            component: 'color',
            defaultValue: '#1a1a1a',
          },
          {
            key: 'transparent',
            label: '透明背景',
            component: 'switch',
            defaultValue: false,
          },
        ],
      },
    ],
  },
}

export default defineComponent({
  name: 'DcNavbarWidget',

  props: {
    title: {
      type: String as PropType<string>,
      default: '页面标题',
    },
    showBack: {
      type: Boolean as PropType<boolean>,
      default: false,
    },
    backgroundColor: {
      type: String as PropType<string>,
      default: '#ffffff',
    },
    textColor: {
      type: String as PropType<string>,
      default: '#1a1a1a',
    },
    transparent: {
      type: Boolean as PropType<boolean>,
      default: false,
    },
  },

  setup(props) {
    return () =>
      h('div', {
        class: 'dc-widget-navbar',
        style: {
          position: 'sticky',
          top: '0',
          zIndex: '100',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '44px',
          paddingTop: '20px',
          paddingBottom: '4px',
          backgroundColor: props.transparent ? 'transparent' : props.backgroundColor,
          color: props.textColor,
          borderBottom: props.transparent ? 'none' : '1px solid #f0f0f0',
        },
      }, [
        props.showBack
          ? h('span', {
              class: 'dc-widget-navbar__back',
              style: {
                position: 'absolute',
                left: '12px',
                fontSize: '18px',
                cursor: 'pointer',
              },
            }, '←')
          : null,
        h('span', {
          class: 'dc-widget-navbar__title',
          style: {
            fontSize: '16px',
            fontWeight: '600',
            textAlign: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '200px',
          },
        }, props.title),
      ])
  },
})
```

- [ ] **Step 2: Verify types compile**

Run: `cd D:/Workspaces/dragcraft && pnpm -F playground exec tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add playground/src/widgets/NavbarWidget.ts
git commit -m "feat(playground): add NavbarWidget component"
```

---

### Task 3: Create TabBarWidget

**Files:**
- Create: `playground/src/widgets/TabBarWidget.ts`

**Interfaces:**
- Produces: `tabBarWidgetMeta` (PlaygroundWidgetMeta), `TabBarWidget` (Component)
- Used by: Task 5 (index.ts), Task 7 (templates)

- [ ] **Step 1: Create the TabBarWidget file**

```ts
// playground/src/widgets/TabBarWidget.ts
import type { PlaygroundWidgetMeta } from './types'
import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

interface TabItem {
  label: string
  icon: string
}

const DEFAULT_TABS: TabItem[] = [
  { label: '首页', icon: 'home' },
  { label: '我的', icon: 'user' },
]

const ICON_MAP: Record<string, string> = {
  home: '⌂',
  category: '☷',
  cart: '\u{1F6D2}',
  user: '\u{1F464}',
  search: '\u{1F50D}',
  heart: '♡',
  star: '☆',
  settings: '⚙',
}

export const tabBarWidgetMeta: PlaygroundWidgetMeta = {
  type: 'tab-bar',
  title: 'Tab 栏',
  group: 'navigation',
  icon: 'tabbar',
  sticky: 'bottom',
  zIndex: 100,
  deletable: false,
  draggable: false,
  sortable: false,
  mask: false,
  defaultProps: {
    tabs: DEFAULT_TABS,
    activeIndex: 0,
    backgroundColor: '#ffffff',
    activeColor: '#07C160',
    inactiveColor: '#999999',
  },
  defaultStyle: {
    width: '100%',
  },
  formSchema: {
    sections: [
      {
        title: '基础设置',
        fields: [
          {
            key: 'tabs',
            label: 'Tab 配置 (JSON)',
            component: 'textarea',
            defaultValue: DEFAULT_TABS,
            props: { rows: 4, placeholder: 'JSON 数组，每项包含 label 和 icon' },
          },
          {
            key: 'activeIndex',
            label: '当前选中',
            component: 'number',
            defaultValue: 0,
            props: { min: 0, max: 10 },
          },
        ],
      },
      {
        title: '样式设置',
        fields: [
          {
            key: 'backgroundColor',
            label: '背景颜色',
            component: 'color',
            defaultValue: '#ffffff',
          },
          {
            key: 'activeColor',
            label: '选中颜色',
            component: 'color',
            defaultValue: '#07C160',
          },
          {
            key: 'inactiveColor',
            label: '未选中颜色',
            component: 'color',
            defaultValue: '#999999',
          },
        ],
      },
    ],
  },
}

export default defineComponent({
  name: 'DcTabBarWidget',

  props: {
    tabs: {
      type: Array as PropType<TabItem[]>,
      default: () => DEFAULT_TABS,
    },
    activeIndex: {
      type: Number as PropType<number>,
      default: 0,
    },
    backgroundColor: {
      type: String as PropType<string>,
      default: '#ffffff',
    },
    activeColor: {
      type: String as PropType<string>,
      default: '#07C160',
    },
    inactiveColor: {
      type: String as PropType<string>,
      default: '#999999',
    },
  },

  setup(props) {
    return () =>
      h('div', {
        class: 'dc-widget-tabbar',
        style: {
          position: 'sticky',
          bottom: '0',
          zIndex: '100',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          height: '50px',
          paddingBottom: '8px',
          backgroundColor: props.backgroundColor,
          borderTop: '1px solid #f0f0f0',
        },
      },
      props.tabs.map((tab, i) =>
        h('div', {
          key: i,
          class: 'dc-widget-tabbar__item',
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            color: i === props.activeIndex ? props.activeColor : props.inactiveColor,
            fontSize: '10px',
          },
        }, [
          h('span', { style: { fontSize: '18px' } }, ICON_MAP[tab.icon] || tab.icon),
          h('span', null, tab.label),
        ]),
      ))
  },
})
```

- [ ] **Step 2: Verify types compile**

Run: `cd D:/Workspaces/dragcraft && pnpm -F playground exec tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add playground/src/widgets/TabBarWidget.ts
git commit -m "feat(playground): add TabBarWidget component"
```

---

### Task 4: Create SwiperWidget

**Files:**
- Create: `playground/src/widgets/SwiperWidget.ts`

**Interfaces:**
- Produces: `swiperWidgetMeta` (PlaygroundWidgetMeta), `SwiperWidget` (Component)
- Used by: Task 5 (index.ts), Task 7 (templates)

- [ ] **Step 1: Create the SwiperWidget file**

```ts
// playground/src/widgets/SwiperWidget.ts
import type { PlaygroundWidgetMeta } from './types'
import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

const DEFAULT_IMAGES = [
  'https://picsum.photos/seed/swiper1/750/300',
  'https://picsum.photos/seed/swiper2/750/300',
  'https://picsum.photos/seed/swiper3/750/300',
]

export const swiperWidgetMeta: PlaygroundWidgetMeta = {
  type: 'swiper',
  title: '轮播',
  group: 'basic',
  icon: 'swiper',
  defaultProps: {
    images: DEFAULT_IMAGES,
    autoplay: true,
    interval: 3000,
    showIndicator: true,
    height: 180,
    borderRadius: 0,
  },
  defaultStyle: {
    width: '100%',
  },
  formSchema: {
    sections: [
      {
        title: '基础设置',
        fields: [
          {
            key: 'images',
            label: '图片列表 (每行一个 URL)',
            component: 'textarea',
            defaultValue: DEFAULT_IMAGES,
            props: { rows: 4, placeholder: '每行一个图片 URL' },
          },
          {
            key: 'autoplay',
            label: '自动播放',
            component: 'switch',
            defaultValue: true,
          },
          {
            key: 'interval',
            label: '播放间隔 (ms)',
            component: 'number',
            defaultValue: 3000,
            props: { min: 1000, max: 10000 },
          },
        ],
      },
      {
        title: '样式设置',
        fields: [
          {
            key: 'showIndicator',
            label: '显示指示器',
            component: 'switch',
            defaultValue: true,
          },
          {
            key: 'height',
            label: '高度 (px)',
            component: 'number',
            defaultValue: 180,
            props: { min: 80, max: 500 },
          },
          {
            key: 'borderRadius',
            label: '圆角 (px)',
            component: 'number',
            defaultValue: 0,
            props: { min: 0, max: 50 },
          },
        ],
      },
    ],
  },
}

export default defineComponent({
  name: 'DcSwiperWidget',

  props: {
    images: {
      type: Array as PropType<string[]>,
      default: () => DEFAULT_IMAGES,
    },
    autoplay: {
      type: Boolean as PropType<boolean>,
      default: true,
    },
    interval: {
      type: Number as PropType<number>,
      default: 3000,
    },
    showIndicator: {
      type: Boolean as PropType<boolean>,
      default: true,
    },
    height: {
      type: Number as PropType<number>,
      default: 180,
    },
    borderRadius: {
      type: Number as PropType<number>,
      default: 0,
    },
  },

  setup(props) {
    return () => {
      const imgSrc = props.images.length > 0
        ? props.images[0]
        : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="750" height="300"%3E%3Crect fill="%23f0f0f0" width="750" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="16"%3ESwiper%3C/text%3E%3C/svg%3E'

      return h('div', {
        class: 'dc-widget-swiper',
        style: {
          position: 'relative',
          width: '100%',
          height: `${props.height}px`,
          overflow: 'hidden',
          borderRadius: `${props.borderRadius}px`,
        },
      }, [
        h('img', {
          src: imgSrc,
          alt: 'swiper',
          style: {
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          },
        }),
        props.showIndicator && props.images.length > 1
          ? h('div', {
              class: 'dc-widget-swiper__indicators',
              style: {
                position: 'absolute',
                bottom: '8px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '6px',
              },
            },
            props.images.map((_, i) =>
              h('span', {
                key: i,
                class: 'dc-widget-swiper__dot',
                style: {
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: i === 0 ? '#ffffff' : 'rgba(255,255,255,0.5)',
                },
              }),
            ))
          : null,
      ])
    }
  },
})
```

- [ ] **Step 2: Verify types compile**

Run: `cd D:/Workspaces/dragcraft && pnpm -F playground exec tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add playground/src/widgets/SwiperWidget.ts
git commit -m "feat(playground): add SwiperWidget component"
```

---

### Task 5: Create Playground Widgets Index

**Files:**
- Create: `playground/src/widgets/index.ts`

**Interfaces:**
- Consumes: `navbarWidgetMeta`, `NavbarWidget` (Task 2), `tabBarWidgetMeta`, `TabBarWidget` (Task 3), `swiperWidgetMeta`, `SwiperWidget` (Task 4)
- Produces: `playgroundWidgetMetas`, `playgroundComponentMap`, `playgroundWidgetGroups` — used by Task 6 (App.vue)

- [ ] **Step 1: Create the index file**

```ts
// playground/src/widgets/index.ts
import type { WidgetGroupConfig } from '@dragcraft/widgets'
import type { Component } from 'vue'
import type { PlaygroundWidgetMeta } from './types'
import { NavbarWidget, navbarWidgetMeta } from './NavbarWidget'
import { SwiperWidget, swiperWidgetMeta } from './SwiperWidget'
import { TabBarWidget, tabBarWidgetMeta } from './TabBarWidget'

export type { PlaygroundWidgetMeta } from './types'

// ── Widget metas ────────────────────────────

export const playgroundWidgetMetas: PlaygroundWidgetMeta[] = [
  navbarWidgetMeta,
  tabBarWidgetMeta,
  swiperWidgetMeta,
]

// ── Component map ───────────────────────────

export const playgroundComponentMap: Record<string, Component> = {
  navbar: NavbarWidget,
  'tab-bar': TabBarWidget,
  swiper: SwiperWidget,
}

// ── Widget groups ───────────────────────────

export const playgroundWidgetGroups: WidgetGroupConfig[] = [
  { name: 'navigation', title: '导航容器' },
]

// ── Individual exports ──────────────────────

export { NavbarWidget, navbarWidgetMeta }
export { SwiperWidget, swiperWidgetMeta }
export { TabBarWidget, tabBarWidgetMeta }
```

- [ ] **Step 2: Verify types compile**

Run: `cd D:/Workspaces/dragcraft && pnpm -F playground exec tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add playground/src/widgets/index.ts
git commit -m "feat(playground): add playground widgets index"
```

---

### Task 6: Update App.vue — Register Playground Widgets + Locked Interception

**Files:**
- Modify: `playground/src/App.vue`

**Interfaces:**
- Consumes: `playgroundWidgetMetas`, `playgroundComponentMap`, `playgroundWidgetGroups` (Task 5)

- [ ] **Step 1: Add playground widget imports**

Add after the existing imports in `App.vue`:

```ts
import {
  playgroundWidgetMetas,
  playgroundComponentMap,
  playgroundWidgetGroups,
} from './widgets'
```

- [ ] **Step 2: Build merged registration arrays**

Replace the `createDesigner` call's `widgetMetas`, `componentMap`, and `widgetGroups` arguments:

```ts
// Merge builtin + playground widgets
const allMetas = [...getAllWidgetMetas(), ...playgroundWidgetMetas]
const allComponentMap = { ...getDefaultComponentMap(), ...playgroundComponentMap }
const allGroups = [...widgetGroups, ...playgroundWidgetGroups]
```

Update `createDesigner` to use the merged arrays:

```ts
const designer = createDesigner({
  engineOptions: {
    initialSchema: templateRegistry[0].schema,
    maxHistorySize: 50,
  },
  widgetMetas: allMetas,
  componentMap: allComponentMap,
  fieldComponentMap: buildDefaultFieldComponentMap(),
  widgetGroups: allGroups,
  globalConfigSchema,
  builtinMessages: builtinWidgetsMessages,
  eventHooks: {
    onBeforeDelete: (ctx: { node: { type: string } }) => {
      const isLocked = playgroundWidgetMetas.some(
        m => m.type === ctx.node.type && m.deletable === false,
      )
      if (isLocked) {
        alert('该组件已锁定，无法删除')
        return Promise.resolve(false)
      }
      return new Promise<boolean>((resolve) => {
        resolve(confirm('确认删除该组件？'))
      })
    },
  },
  // ...rest stays the same
```

- [ ] **Step 3: Verify build passes**

Run: `cd D:/Workspaces/dragcraft && pnpm -F playground build`
Expected: Build succeeds

- [ ] **Step 4: Verify typecheck passes**

Run: `cd D:/Workspaces/dragcraft && pnpm typecheck`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add playground/src/App.vue
git commit -m "feat(playground): register playground widgets with locked delete interception"
```

---

### Task 7: Update Templates

**Files:**
- Modify: `playground/src/config/templates/ecommerce-schema.ts`
- Modify: `playground/src/config/templates/content-detail-schema.ts`
- Modify: `playground/src/config/templates/product-detail-schema.ts`

**Interfaces:**
- Consumes: Widget type strings `'navbar'`, `'tab-bar'`, `'swiper'` (from Tasks 2-4)

- [ ] **Step 1: Update ecommerce-schema.ts**

Add Navbar at the top, Swiper after Navbar, and TabBar at the bottom of `children`:

```ts
// At the start of children array, add:
{
  id: 'nav-ecommerce',
  type: 'navbar',
  props: {
    title: '好物精选',
    showBack: false,
    backgroundColor: '#ffffff',
    textColor: '#1a1a1a',
    transparent: false,
  },
  style: { width: '100%' },
},
{
  id: 'swiper-banner',
  type: 'swiper',
  props: {
    images: [
      'https://picsum.photos/seed/store-banner/750/300',
      'https://picsum.photos/seed/store-banner2/750/300',
      'https://picsum.photos/seed/store-banner3/750/300',
    ],
    autoplay: true,
    interval: 3000,
    showIndicator: true,
    height: 180,
    borderRadius: 0,
  },
  style: { width: '100%' },
},

// Remove the old banner-img entry (replaced by swiper)

// At the end of children array, add:
{
  id: 'tabbar-main',
  type: 'tab-bar',
  props: {
    tabs: [
      { label: '首页', icon: 'home' },
      { label: '分类', icon: 'category' },
      { label: '购物车', icon: 'cart' },
      { label: '我的', icon: 'user' },
    ],
    activeIndex: 0,
    backgroundColor: '#ffffff',
    activeColor: '#07C160',
    inactiveColor: '#999999',
  },
  style: { width: '100%' },
},
```

- [ ] **Step 2: Update content-detail-schema.ts**

Add Navbar at the top of `children`:

```ts
// At the start of children array, add:
{
  id: 'nav-content',
  type: 'navbar',
  props: {
    title: '精选文章',
    showBack: true,
    backgroundColor: '#ffffff',
    textColor: '#1a1a1a',
    transparent: false,
  },
  style: { width: '100%' },
},
```

- [ ] **Step 3: Update product-detail-schema.ts**

Add Navbar at the top of `children`:

```ts
// At the start of children array, add:
{
  id: 'nav-product',
  type: 'navbar',
  props: {
    title: '商品详情',
    showBack: true,
    backgroundColor: '#ffffff',
    textColor: '#1a1a1a',
    transparent: false,
  },
  style: { width: '100%' },
},
```

- [ ] **Step 4: Verify build passes**

Run: `cd D:/Workspaces/dragcraft && pnpm -F playground build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add playground/src/config/templates/
git commit -m "feat(playground): update templates with navbar, swiper, tabbar"
```

---

### Task 8: Update Playground Styles

**Files:**
- Modify: `playground/src/styles/playground.css`

- [ ] **Step 1: Add new widget styles**

Append to `playground/src/styles/playground.css`:

```css
/* ── Navbar Widget ──────────────────────────── */

.dc-widget-navbar {
  position: relative;
}

.dc-widget-navbar::after {
  content: '\1F512';
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: 10px;
  opacity: 0.4;
  pointer-events: none;
}

/* ── TabBar Widget ──────────────────────────── */

.dc-widget-tabbar {
  position: relative;
}

.dc-widget-tabbar::after {
  content: '\1F512';
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: 10px;
  opacity: 0.4;
  pointer-events: none;
}

/* ── Swiper Widget ──────────────────────────── */

.dc-widget-swiper {
  background: #f5f5f5;
}

.dc-widget-swiper img {
  border-radius: 0;
}
```

- [ ] **Step 2: Verify build passes**

Run: `cd D:/Workspaces/dragcraft && pnpm -F playground build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add playground/src/styles/playground.css
git commit -m "feat(playground): add styles for navbar, tabbar, swiper widgets"
```

---

### Task 9: Final Verification

- [ ] **Step 1: Run full build**

Run: `cd D:/Workspaces/dragcraft && pnpm build`
Expected: All packages build successfully

- [ ] **Step 2: Run lint**

Run: `cd D:/Workspaces/dragcraft && pnpm lint`
Expected: No errors

- [ ] **Step 3: Run typecheck**

Run: `cd D:/Workspaces/dragcraft && pnpm typecheck`
Expected: No errors

- [ ] **Step 4: Run playground dev server and verify manually**

Run: `cd D:/Workspaces/dragcraft && pnpm play`

Verify:
- Material panel shows "导航容器" group with Navbar and TabBar
- Material panel shows Swiper in "基础展示" group
- Dragging Navbar/TabBar/Swiper to canvas works
- Navbar shows lock badge, cannot be deleted
- TabBar shows lock badge, cannot be deleted
- Swiper renders first image + indicator dots
- E-commerce template has Navbar + Swiper + content + TabBar
- Content detail template has Navbar at top
- Product detail template has Navbar at top

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(playground): address review feedback"
```
