# Playground Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the playground to a product-grade demo with a top header bar, three scene templates, and template switching.

**Architecture:** Replace the bottom action bar with a `PlaygroundHeader` component. Create three template schemas (e-commerce, content detail, product detail) under `config/templates/`. Add a `useTemplateSwitch` composable for template switching with modification detection via JSON.stringify comparison.

**Tech Stack:** Vue 3 (Composition API, `<script setup>`), TypeScript, Vite, `@dragcraft/designer`, `@dragcraft/builtin-widgets`, `@dragcraft/builtin-fields`, `@dragcraft/device-frames`, `@dragcraft/themes`

## Global Constraints

- No `structuredClone` usage (project rule)
- No Unicode emoji in code (project rule)
- All imports from `@dragcraft/*` packages use pnpm workspace protocol
- Must pass `pnpm build`, `pnpm lint`, `pnpm typecheck` after all changes
- Follow existing code style: `<script setup lang="ts">`, CSS variables, BEM-ish class names
- The playground has no unit tests — verification is build + lint + typecheck + manual dev server check

## File Structure

```
playground/src/
├── components/
│   └── PlaygroundHeader.vue          # NEW — top header bar
├── composables/
│   └── useTemplateSwitch.ts          # NEW — template switching logic
├── config/
│   ├── templates/
│   │   ├── index.ts                  # NEW — exports all templates + registry
│   │   ├── ecommerce-schema.ts       # NEW — moved from initial-schema.ts
│   │   ├── content-detail-schema.ts  # NEW — article detail page
│   │   └── product-detail-schema.ts  # NEW — product detail page
│   ├── global-config-schema.ts       # UNCHANGED
│   └── initial-schema.ts             # DELETE — replaced by templates/
├── shared/                           # UNCHANGED
├── styles/
│   └── playground.css                # MODIFY — add header styles
├── App.vue                           # MODIFY — replace bottom bar with header
├── main.ts                           # UNCHANGED
└── env.d.ts                          # UNCHANGED
```

---

### Task 1: Create Template Schemas

**Files:**
- Create: `playground/src/config/templates/ecommerce-schema.ts`
- Create: `playground/src/config/templates/content-detail-schema.ts`
- Create: `playground/src/config/templates/product-detail-schema.ts`
- Create: `playground/src/config/templates/index.ts`

**Interfaces:**
- Produces: `ecommerceSchema`, `contentDetailSchema`, `productDetailSchema` (all `DesignerSchema`)
- Produces: `templateRegistry` — array of `{ id: string, label: string, schema: DesignerSchema }`

- [ ] **Step 1: Create `ecommerce-schema.ts`**

Copy the content from `playground/src/config/initial-schema.ts` into the new file. Change the export name from `initialSchema` to `ecommerceSchema`.

```ts
// playground/src/config/templates/ecommerce-schema.ts
import type { DesignerSchema } from '@dragcraft/designer'

/**
 * Template 1: Mini-Program E-commerce Homepage
 * Simulates a WeChat mini-program e-commerce page layout.
 */
export const ecommerceSchema: DesignerSchema = {
  // ... exact content from initial-schema.ts, unchanged
}
```

- [ ] **Step 2: Create `content-detail-schema.ts`**

```ts
// playground/src/config/templates/content-detail-schema.ts
import type { DesignerSchema } from '@dragcraft/designer'

/**
 * Template 2: Content Detail Page
 * Simulates a WeChat mini-program article/blog detail page.
 */
export const contentDetailSchema: DesignerSchema = {
  version: '1.0.0',
  globalConfig: {
    title: '精选文章',
    description: '内容详情页',
    backgroundColor: '#ffffff',
    padding: 0,
    maxWidth: 375,
  },
  root: {
    id: 'root',
    type: 'root',
    props: {},
    children: [
      // Cover image
      {
        id: 'cover-img',
        type: 'image',
        props: {
          src: 'https://picsum.photos/seed/article-cover/750/400',
          alt: '文章封面',
          objectFit: 'cover',
        },
        style: { width: '100%', height: '200px' },
      },
      // Title
      {
        id: 'article-title',
        type: 'text',
        props: {
          content: '如何用 Dragcraft 搭建小程序页面',
          fontSize: 22,
          fontWeight: 'bold',
          color: '#1a1a1a',
          textAlign: 'left',
        },
        style: { padding: '20px 16px 8px' },
      },
      // Author info
      {
        id: 'author-info',
        type: 'text',
        props: {
          content: 'Dragcraft 团队 · 2026-06-26',
          fontSize: 12,
          fontWeight: 'normal',
          color: '#999999',
          textAlign: 'left',
        },
        style: { padding: '0 16px 16px' },
      },
      // Divider
      {
        id: 'divider-1',
        type: 'divider',
        props: { direction: 'horizontal', color: '#f0f0f0', thickness: 1 },
        style: { width: '100%' },
      },
      // Body paragraph 1
      {
        id: 'body-1',
        type: 'text',
        props: {
          content: 'Dragcraft 是一个面向小程序装修场景的可视化页面搭建引擎。采用 Core Engine + UI Shell + Headless Themes 架构，构建核心与 UI 分离的页面设计引擎。',
          fontSize: 15,
          fontWeight: 'normal',
          color: '#333333',
          textAlign: 'left',
        },
        style: { padding: '16px 16px 8px', lineHeight: '1.8' },
      },
      // Inline image
      {
        id: 'inline-img',
        type: 'image',
        props: {
          src: 'https://picsum.photos/seed/dragcraft-demo/750/300',
          alt: '架构示意图',
          objectFit: 'cover',
        },
        style: { width: '100%', height: '180px', padding: '8px 16px' },
      },
      // Body paragraph 2
      {
        id: 'body-2',
        type: 'text',
        props: {
          content: '所有 UI 包仅输出语义化 BEM 类名，不捆绑任何 CSS。视觉样式由 @dragcraft/themes 独立提供，支持完全自定义样式（无头模式）。',
          fontSize: 15,
          fontWeight: 'normal',
          color: '#333333',
          textAlign: 'left',
        },
        style: { padding: '8px 16px 16px', lineHeight: '1.8' },
      },
      // Divider
      {
        id: 'divider-2',
        type: 'divider',
        props: { direction: 'horizontal', color: '#f0f0f0', thickness: 1 },
        style: { width: '100%' },
      },
      // Action buttons
      {
        id: 'follow-btn',
        type: 'button',
        props: { text: '关注作者', type: 'button', disabled: false, size: 'medium' },
        style: { padding: '16px 16px 8px', width: '100%' },
      },
      {
        id: 'share-link',
        type: 'link',
        props: { text: '分享给朋友', href: '#', target: '_self', color: '#07C160' },
        style: { padding: '8px 16px 24px' },
      },
    ],
  },
}
```

- [ ] **Step 3: Create `product-detail-schema.ts`**

```ts
// playground/src/config/templates/product-detail-schema.ts
import type { DesignerSchema } from '@dragcraft/designer'

/**
 * Template 3: Product Detail Page
 * Simulates a WeChat mini-program product detail page.
 */
export const productDetailSchema: DesignerSchema = {
  version: '1.0.0',
  globalConfig: {
    title: '商品详情',
    description: '商品详情页',
    backgroundColor: '#ffffff',
    padding: 0,
    maxWidth: 375,
  },
  root: {
    id: 'root',
    type: 'root',
    props: {},
    children: [
      // Product hero image
      {
        id: 'product-hero',
        type: 'image',
        props: {
          src: 'https://picsum.photos/seed/product-hero/750/750',
          alt: '商品主图',
          objectFit: 'cover',
        },
        style: { width: '100%', height: '300px' },
      },
      // Price row
      {
        id: 'price-current',
        type: 'text',
        props: {
          content: '¥ 199.00',
          fontSize: 24,
          fontWeight: 'bold',
          color: '#e64340',
          textAlign: 'left',
        },
        style: { padding: '16px 16px 0' },
      },
      {
        id: 'price-original',
        type: 'text',
        props: {
          content: '原价 ¥ 399.00',
          fontSize: 13,
          fontWeight: 'normal',
          color: '#999999',
          textAlign: 'left',
        },
        style: { padding: '4px 16px 8px', textDecoration: 'line-through' },
      },
      // Product name
      {
        id: 'product-name',
        type: 'text',
        props: {
          content: '轻奢简约真皮手提包 | 头层牛皮 手工缝制',
          fontSize: 17,
          fontWeight: 'bold',
          color: '#1a1a1a',
          textAlign: 'left',
        },
        style: { padding: '8px 16px 4px' },
      },
      // Product description
      {
        id: 'product-desc',
        type: 'text',
        props: {
          content: '精选头层牛皮，意大利进口五金，大容量内袋设计，适合通勤与日常出行。',
          fontSize: 13,
          fontWeight: 'normal',
          color: '#666666',
          textAlign: 'left',
        },
        style: { padding: '0 16px 12px' },
      },
      // Divider
      {
        id: 'divider-1',
        type: 'divider',
        props: { direction: 'horizontal', color: '#f0f0f0', thickness: 8 },
        style: { width: '100%' },
      },
      // Color spec
      {
        id: 'spec-color',
        type: 'form-select',
        props: {
          label: '颜色',
          placeholder: '请选择颜色',
          value: '',
          options: [
            { label: '经典黑', value: 'black' },
            { label: '复古棕', value: 'brown' },
            { label: '奶白色', value: 'white' },
          ],
          required: false,
          disabled: false,
        },
        style: { width: '100%', padding: '12px 16px 0' },
      },
      // Size spec
      {
        id: 'spec-size',
        type: 'form-select',
        props: {
          label: '尺寸',
          placeholder: '请选择尺寸',
          value: '',
          options: [
            { label: '小号 (20cm)', value: 'S' },
            { label: '中号 (25cm)', value: 'M' },
            { label: '大号 (30cm)', value: 'L' },
          ],
          required: false,
          disabled: false,
        },
        style: { width: '100%', padding: '8px 16px 12px' },
      },
      // Divider
      {
        id: 'divider-2',
        type: 'divider',
        props: { direction: 'horizontal', color: '#f0f0f0', thickness: 1 },
        style: { width: '100%' },
      },
      // Quantity note
      {
        id: 'quantity-note',
        type: 'text',
        props: {
          content: '库存充足，下单后 48 小时内发货',
          fontSize: 12,
          fontWeight: 'normal',
          color: '#999999',
          textAlign: 'left',
        },
        style: { padding: '12px 16px' },
      },
      // Divider
      {
        id: 'divider-3',
        type: 'divider',
        props: { direction: 'horizontal', color: '#f0f0f0', thickness: 8 },
        style: { width: '100%' },
      },
      // Action buttons
      {
        id: 'cart-btn',
        type: 'button',
        props: { text: '加入购物车', type: 'button', disabled: false, size: 'large' },
        style: { padding: '16px 16px 8px', width: '100%' },
      },
      {
        id: 'buy-btn',
        type: 'button',
        props: { text: '立即购买', type: 'button', disabled: false, size: 'large' },
        style: { padding: '8px 16px 24px', width: '100%' },
      },
    ],
  },
}
```

- [ ] **Step 4: Create `index.ts` barrel export**

```ts
// playground/src/config/templates/index.ts
import type { DesignerSchema } from '@dragcraft/designer'
import { contentDetailSchema } from './content-detail-schema'
import { ecommerceSchema } from './ecommerce-schema'
import { productDetailSchema } from './product-detail-schema'

export interface TemplateEntry {
  id: string
  label: string
  schema: DesignerSchema
}

export const templateRegistry: TemplateEntry[] = [
  { id: 'ecommerce', label: '电商首页', schema: ecommerceSchema },
  { id: 'content-detail', label: '内容详情页', schema: contentDetailSchema },
  { id: 'product-detail', label: '商品详情页', schema: productDetailSchema },
]

export { ecommerceSchema } from './ecommerce-schema'
export { contentDetailSchema } from './content-detail-schema'
export { productDetailSchema } from './product-detail-schema'
```

- [ ] **Step 5: Verify templates build**

Run: `cd D:/Workspaces/dragcraft && pnpm -F playground build`
Expected: Build succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
git add playground/src/config/templates/
git commit -m "feat(playground): add three scene template schemas"
```

---

### Task 2: Create `useTemplateSwitch` Composable

**Files:**
- Create: `playground/src/composables/useTemplateSwitch.ts`

**Interfaces:**
- Consumes: `templateRegistry` from `../config/templates`, `importSchema`/`exportSchema` from `useDesigner()`
- Produces: `useTemplateSwitch(options)` returning `{ activeTemplateId, templates, switchTemplate, resetTemplate }`

- [ ] **Step 1: Create the composable**

```ts
// playground/src/composables/useTemplateSwitch.ts
import type { DesignerSchema } from '@dragcraft/designer'
import { ref } from 'vue'
import { templateRegistry, type TemplateEntry } from '../config/templates'

export interface UseTemplateSwitchOptions {
  importSchema: (schema: DesignerSchema) => void
  exportSchema: () => DesignerSchema
}

export function useTemplateSwitch(options: UseTemplateSwitchOptions) {
  const { importSchema, exportSchema } = options

  const activeTemplateId = ref(templateRegistry[0].id)
  const templates: TemplateEntry[] = templateRegistry

  function getActiveTemplate(): TemplateEntry {
    return templates.find(t => t.id === activeTemplateId.value) ?? templates[0]
  }

  function isModified(): boolean {
    const current = JSON.stringify(exportSchema())
    const baseline = JSON.stringify(getActiveTemplate().schema)
    return current !== baseline
  }

  function switchTemplate(id: string) {
    if (id === activeTemplateId.value)
      return

    const target = templates.find(t => t.id === id)
    if (!target)
      return

    if (isModified()) {
      const confirmed = confirm('当前修改将丢失，是否切换？')
      if (!confirmed)
        return
    }

    importSchema(target.schema)
    activeTemplateId.value = id
  }

  function resetTemplate() {
    const template = getActiveTemplate()
    importSchema(template.schema)
  }

  return {
    activeTemplateId,
    templates,
    switchTemplate,
    resetTemplate,
  }
}
```

- [ ] **Step 2: Verify build**

Run: `cd D:/Workspaces/dragcraft && pnpm -F playground build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add playground/src/composables/useTemplateSwitch.ts
git commit -m "feat(playground): add useTemplateSwitch composable"
```

---

### Task 3: Create PlaygroundHeader Component

**Files:**
- Create: `playground/src/components/PlaygroundHeader.vue`

**Interfaces:**
- Consumes: `TemplateEntry` type from `../config/templates`
- Props: `activeTemplateId: string`, `templates: TemplateEntry[]`, `canUndo: boolean`, `canRedo: boolean`
- Emits: `templateSwitch(id: string)`, `undo`, `redo`, `importOpen`, `exportOpen`, `toggleLocale`
- Produces: `PlaygroundHeader.vue` component

- [ ] **Step 1: Create PlaygroundHeader.vue**

```vue
<!-- playground/src/components/PlaygroundHeader.vue -->
<script setup lang="ts">
import type { TemplateEntry } from '../config/templates'

defineProps<{
  activeTemplateId: string
  templates: TemplateEntry[]
  canUndo: boolean
  canRedo: boolean
  locale: string
}>()

const emit = defineEmits<{
  templateSwitch: [id: string]
  undo: []
  redo: []
  importOpen: []
  exportOpen: []
  toggleLocale: []
}>()
</script>

<template>
  <header class="playground-header">
    <span class="playground-header__brand">Dragcraft Playground</span>

    <select
      class="playground-header__select"
      :value="activeTemplateId"
      @change="emit('templateSwitch', ($event.target as HTMLSelectElement).value)"
    >
      <option
        v-for="t in templates"
        :key="t.id"
        :value="t.id"
      >
        {{ t.label }}
      </option>
    </select>

    <div class="playground-header__spacer" />

    <button
      class="playground-header__btn playground-header__btn--icon"
      :disabled="!canUndo"
      title="Undo"
      @click="emit('undo')"
    >
      &#x21A9;
    </button>
    <button
      class="playground-header__btn playground-header__btn--icon"
      :disabled="!canRedo"
      title="Redo"
      @click="emit('redo')"
    >
      &#x21AA;
    </button>

    <div class="playground-header__divider" />

    <button class="playground-header__btn" @click="emit('importOpen')">
      Import
    </button>
    <button
      class="playground-header__btn playground-header__btn--primary"
      @click="emit('exportOpen')"
    >
      Export
    </button>

    <div class="playground-header__divider" />

    <button class="playground-header__btn" @click="emit('toggleLocale')">
      {{ locale === 'zh-CN' ? 'English' : '中文' }}
    </button>
  </header>
</template>
```

- [ ] **Step 2: Verify build**

Run: `cd D:/Workspaces/dragcraft && pnpm -F playground build`
Expected: Build succeeds (component is not yet imported anywhere, so just needs to compile).

- [ ] **Step 3: Commit**

```bash
git add playground/src/components/PlaygroundHeader.vue
git commit -m "feat(playground): add PlaygroundHeader component"
```

---

### Task 4: Add Header Styles to playground.css

**Files:**
- Modify: `playground/src/styles/playground.css`

**Interfaces:**
- Consumes: BEM class names from `PlaygroundHeader.vue` (`.playground-header`, `.playground-header__brand`, etc.)
- Produces: Styled header bar

- [ ] **Step 1: Append header styles**

Append the following to the end of `playground/src/styles/playground.css`:

```css
/* ── Playground Header ───────────────────── */

.playground-header {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 48px;
  padding: 0 16px;
  background: var(--dc-bg);
  border-bottom: 1px solid var(--dc-border-light);
  flex-shrink: 0;
}

.playground-header__brand {
  font-size: 14px;
  font-weight: 600;
  color: var(--dc-text);
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.playground-header__select {
  height: 32px;
  padding: 0 28px 0 12px;
  font-size: 13px;
  font-family: var(--dc-font-family);
  border: 1px solid var(--dc-border);
  border-radius: 6px;
  background: var(--dc-bg);
  color: var(--dc-text);
  cursor: pointer;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23999'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  transition: border-color 0.2s;
}

.playground-header__select:hover {
  border-color: var(--dc-primary);
}

.playground-header__select:focus {
  border-color: var(--dc-primary);
  box-shadow: 0 0 0 2px var(--dc-primary-shadow);
}

.playground-header__spacer {
  flex: 1;
}

.playground-header__divider {
  width: 1px;
  height: 20px;
  background: var(--dc-border-light);
  flex-shrink: 0;
}

.playground-header__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px;
  font-size: 13px;
  font-family: var(--dc-font-family);
  border: 1px solid var(--dc-border);
  border-radius: 6px;
  background: var(--dc-bg);
  color: var(--dc-text);
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  white-space: nowrap;
}

.playground-header__btn:hover:not(:disabled) {
  border-color: var(--dc-primary);
  color: var(--dc-primary);
}

.playground-header__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.playground-header__btn--icon {
  width: 32px;
  padding: 0;
  font-size: 16px;
}

.playground-header__btn--primary {
  background: var(--dc-primary);
  border-color: var(--dc-primary);
  color: #ffffff;
}

.playground-header__btn--primary:hover {
  background: var(--dc-primary-dark);
  border-color: var(--dc-primary-dark);
  color: #ffffff;
}
```

- [ ] **Step 2: Verify build**

Run: `cd D:/Workspaces/dragcraft && pnpm -F playground build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add playground/src/styles/playground.css
git commit -m "feat(playground): add PlaygroundHeader styles"
```

---

### Task 5: Wire App.vue and Clean Up

**Files:**
- Modify: `playground/src/App.vue`
- Delete: `playground/src/config/initial-schema.ts`

**Interfaces:**
- Consumes: `PlaygroundHeader` component, `useTemplateSwitch` composable, `templateRegistry`
- Consumes: `useDesigner()`, `useSchemaIO()` (existing)
- Produces: Updated `App.vue` with header-driven layout

- [ ] **Step 1: Update App.vue**

Replace the entire `<script setup>` block and `<template>` block. The key changes:

1. Remove `import { initialSchema }` and replace with template imports
2. Remove `MiniProgramEmptyState` (no longer needed — keep only if desired for empty canvas)
3. Import `PlaygroundHeader` and `useTemplateSwitch`
4. Use `templateRegistry[0].schema` as `initialSchema` for `createDesigner()`
5. Wire `useTemplateSwitch` with `exportSchema`/`importSchema` from `useDesigner()`
6. Replace the bottom action bar with `<PlaygroundHeader>` at the top
7. Keep `SchemaIOModal` as-is

New `<script setup>`:

```vue
<script setup lang="ts">
import { CommandType, createDesigner, DcDesigner, useDesigner } from '@dragcraft/designer'
import type { NodeActionContext } from '@dragcraft/designer'
import { buildDefaultFieldComponentMap } from '@dragcraft/builtin-fields'
import { builtinWidgetsMessages, getAllWidgetMetas, getDefaultComponentMap, widgetGroups } from '@dragcraft/builtin-widgets'
import {
  createDeviceFrameContext,
  createDeviceToolbarRenderer,
  DEVICE_FRAME_CONTEXT_KEY,
  DeviceFrameShell,
} from '@dragcraft/device-frames'
import { defineComponent, h, provide } from 'vue'
import PlaygroundHeader from './components/PlaygroundHeader.vue'
import { globalConfigSchema } from './config/global-config-schema'
import { templateRegistry } from './config/templates'
import { useTemplateSwitch } from './composables/useTemplateSwitch'
import SchemaIOModal from './shared/SchemaIOModal.vue'
import { useSchemaIO } from './shared/use-schema-io'

// ── Device Frame Context ────────────────────

const deviceCtx = createDeviceFrameContext({ initialDevice: 'iphone' })
provide(DEVICE_FRAME_CONTEXT_KEY, deviceCtx)

// ── Mini-Program Empty State ────────────────────

const MiniProgramEmptyState = defineComponent({
  name: 'MiniProgramEmptyState',
  props: {
    isDragOver: { type: Boolean, default: false },
  },
  setup(props) {
    return () =>
      h('div', {
        class: {
          'mp-empty-state': true,
          'mp-empty-state--drag-over': props.isDragOver,
        },
      }, [
        h('div', { class: 'mp-empty-state__icon' }, props.isDragOver ? '⬇' : '\u{1F4F1}'),
        h('div', { class: 'mp-empty-state__text' },
          props.isDragOver ? '松开放置组件' : '从左侧拖入组件开始装修'),
      ])
  },
})

// ── Create designer instance ─────────────────

const designer = createDesigner({
  engineOptions: {
    initialSchema: templateRegistry[0].schema,
    maxHistorySize: 50,
  },
  widgetMetas: getAllWidgetMetas(),
  componentMap: getDefaultComponentMap(),
  fieldComponentMap: buildDefaultFieldComponentMap(),
  widgetGroups: [...widgetGroups],
  globalConfigSchema,
  builtinMessages: builtinWidgetsMessages,
  eventHooks: {
    onBeforeDelete: () => {
      return new Promise<boolean>((resolve) => {
        resolve(confirm('确认删除该组件？'))
      })
    },
  },
  customActions: [
    {
      key: 'duplicate',
      label: '复制',
      icon: '⧉',
      type: 'button',
      order: 350,
      handler: (ctx: NodeActionContext) => {
        const node = ctx.node
        ctx.engine.execute({
          type: CommandType.ADD_NODE,
          payload: {
            node: {
              id: `${node.type}-${Date.now()}`,
              type: node.type,
              props: { ...node.props },
              style: node.style ? { ...node.style } : undefined,
            },
            index: ctx.index + 1,
          },
        })
      },
    },
  ],
  extensions: {
    rendererExtensions: {
      containerShell: DeviceFrameShell,
      emptyState: MiniProgramEmptyState,
    },
    toolbarRenderer: createDeviceToolbarRenderer(deviceCtx),
  },
})

const { exportSchema, importSchema, undo, redo, canUndo, canRedo } = useDesigner(designer)

const templateSwitch = useTemplateSwitch({ importSchema, exportSchema })

const io = useSchemaIO(exportSchema, importSchema)

function toggleLocale() {
  const next = designer.i18n.locale.value === 'zh-CN' ? 'en' : 'zh-CN'
  designer.i18n.setLocale(next)
}
</script>
```

New `<template>`:

```vue
<template>
  <div class="playground-root">
    <PlaygroundHeader
      :active-template-id="templateSwitch.activeTemplateId.value"
      :templates="templateSwitch.templates"
      :can-undo="canUndo()"
      :can-redo="canRedo()"
      :locale="designer.i18n.locale.value"
      @template-switch="templateSwitch.switchTemplate"
      @undo="undo()"
      @redo="redo()"
      @import-open="io.handleImportOpen()"
      @export-open="io.handleExport()"
      @toggle-locale="toggleLocale"
    />

    <DcDesigner :instance="designer" />

    <!-- Import / Export Modals -->
    <SchemaIOModal
      :show-export-modal="io.showExportModal.value"
      :show-import-modal="io.showImportModal.value"
      :export-json="io.exportJson.value"
      :import-json="io.importJson.value"
      :import-error="io.importError.value"
      @update:show-export-modal="io.showExportModal.value = $event"
      @update:show-import-modal="io.showImportModal.value = $event"
      @update:import-json="io.importJson.value = $event"
      @copy="io.handleCopyExport()"
      @import-confirm="io.handleImportConfirm()"
    />
  </div>
</template>

<style scoped>
.playground-root {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}
</style>
```

- [ ] **Step 2: Delete old initial-schema.ts**

```bash
rm playground/src/config/initial-schema.ts
```

- [ ] **Step 3: Remove old bottom bar styles from playground.css**

Remove the `/* ── Playground Action Bar ───────────────── */` section (lines 137-193) from `playground/src/styles/playground.css`. This covers `.playground-actions`, `.playground-actions__label`, `.playground-actions__spacer`, `.playground-actions__btn`, `.playground-actions__btn--primary` and their hover states. These classes are no longer used.

- [ ] **Step 4: Verify full build + lint + typecheck**

Run:
```bash
cd D:/Workspaces/dragcraft
pnpm -F playground build
pnpm lint
pnpm typecheck
```
Expected: All three pass with no errors.

- [ ] **Step 5: Commit**

```bash
git add playground/src/App.vue playground/src/styles/playground.css
git rm playground/src/config/initial-schema.ts
git commit -m "feat(playground): wire PlaygroundHeader with template switching, remove bottom action bar"
```

---

### Task 6: Final Verification

- [ ] **Step 1: Run the full verification suite**

```bash
cd D:/Workspaces/dragcraft
pnpm build
pnpm lint
pnpm typecheck
```
Expected: All pass.

- [ ] **Step 2: Start dev server and verify manually**

```bash
cd D:/Workspaces/dragcraft
pnpm play
```

Verify in browser:
- Header renders at top with brand, template dropdown, undo/redo, import/export, locale
- Default template is "电商首页" with the existing e-commerce page content
- Switching to "内容详情页" loads the article detail layout
- Switching to "商品详情页" loads the product detail layout
- Making a change then switching templates triggers confirm dialog
- Undo/Redo buttons enable/disable correctly
- Import/Export modals work from header buttons
- Locale toggle switches between zh-CN and en

- [ ] **Step 3: Final commit (if any fixes needed)**

If any issues were found during manual verification, fix and commit.
