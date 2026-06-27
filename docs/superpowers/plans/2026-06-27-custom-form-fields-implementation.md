# 自定义表单字段实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 playground 中的 TabBarWidget 和 NavbarWidget 创建可视化配置界面，展示 form-generator 的自定义字段能力

**Architecture:** 采用混合方案：通用 ArrayField 组件处理数组类型配置，专用 NavbarTitleField 组件处理 Navbar 标题配置，通过 fieldComponentMap 注册到 form-generator

**Tech Stack:** Vue 3 Composition API, TypeScript, @dragcraft/form-generator, @dragcraft/builtin-fields

## Global Constraints

- 遵循项目现有的组件命名规范（Dc 前缀）
- 使用 h() 函数渲染，不使用模板
- 所有字段组件必须实现 modelValue + onUpdate:modelValue 的 v-model 模式
- 遵循项目的 BEM 类名规范（dc-field-xxx）
- 不使用 structuredClone
- 不使用 Unicode 字符表情

---

## 文件结构

### 新建文件

- `packages/builtin-fields/src/fields/ArrayField.ts` - 通用数组编辑器组件
- `playground/src/fields/NavbarTitleField.ts` - Navbar 标题专用配置组件
- `packages/builtin-fields/src/fields/ArrayField.test.ts` - ArrayField 单元测试

### 修改文件

- `packages/builtin-fields/src/fields/index.ts` - 导出 ArrayField
- `packages/builtin-fields/src/index.ts` - 导出 ArrayField
- `playground/src/widgets/TabBarWidget.ts` - 更新 formSchema 使用 array 组件
- `playground/src/widgets/NavbarWidget.ts` - 扩展 props 和 formSchema
- `playground/src/shared/fields.ts` - 注册新的字段组件
- `playground/src/widgets/index.ts` - 导出 NavbarTitleField

---

### Task 1: 创建 ArrayField 通用组件

**Files:**
- Create: `packages/builtin-fields/src/fields/ArrayField.ts`
- Test: `packages/builtin-fields/src/fields/ArrayField.test.ts`

**Interfaces:**
- Consumes: `FieldSchema` from `@dragcraft/form-generator`
- Produces: `ArrayField` component with `modelValue: Array<Record<string, unknown>>` prop

- [ ] **Step 1: 创建 ArrayField 组件文件**

创建文件 `packages/builtin-fields/src/fields/ArrayField.ts`，定义组件接口：

```typescript
import type { FieldSchema } from '@dragcraft/form-generator'
import type { PropType } from 'vue'
import { computed, defineComponent, h, ref } from 'vue'

interface ArrayFieldConfig {
  itemFields: FieldSchema[]
  minItems?: number
  maxItems?: number
  defaultItem?: Record<string, unknown>
  sortable?: boolean
}

export default defineComponent({
  name: 'DcArrayField',

  props: {
    modelValue: {
      type: Array as PropType<Array<Record<string, unknown>>>,
      default: () => [],
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    field: {
      type: Object as PropType<FieldSchema>,
      required: true,
    },
  },

  emits: ['update:modelValue'],

  setup(props, { emit }) {
    const config = computed(() => props.field.props as ArrayFieldConfig)
    const items = computed(() => props.modelValue || [])
    const expandedItems = ref<Set<number>>(new Set([0]))

    const canAdd = computed(() => {
      const max = config.value.maxItems
      return max === undefined || items.value.length < max
    })

    const canRemove = computed(() => {
      const min = config.value.minItems ?? 0
      return items.value.length > min
    })

    const toggleExpand = (index: number) => {
      if (expandedItems.value.has(index)) {
        expandedItems.value.delete(index)
      } else {
        expandedItems.value.add(index)
      }
    }

    const addItem = () => {
      if (!canAdd.value) return
      const newItem = config.value.defaultItem || {}
      emit('update:modelValue', [...items.value, { ...newItem }])
    }

    const removeItem = (index: number) => {
      if (!canRemove.value) return
      const newItems = items.value.filter((_, i) => i !== index)
      emit('update:modelValue', newItems)
    }

    const updateItem = (index: number, key: string, value: unknown) => {
      const newItems = [...items.value]
      newItems[index] = { ...newItems[index], [key]: value }
      emit('update:modelValue', newItems)
    }

    const moveItem = (from: number, direction: 'up' | 'down') => {
      const to = direction === 'up' ? from - 1 : from + 1
      if (to < 0 || to >= items.value.length) return
      const newItems = [...items.value]
      const [item] = newItems.splice(from, 1)
      newItems.splice(to, 0, item)
      emit('update:modelValue', newItems)
    }

    return () => {
      // 渲染逻辑将在 Step 3 实现
    }
  },
})
```

- [ ] **Step 2: 创建 ArrayField 单元测试**

创建文件 `packages/builtin-fields/src/fields/ArrayField.test.ts`：

```typescript
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ArrayField from './ArrayField'
import type { FieldSchema } from '@dragcraft/form-generator'

describe('ArrayField', () => {
  const createField = (overrides?: Partial<FieldSchema>): FieldSchema => ({
    key: 'items',
    label: 'Items',
    component: 'array',
    props: {
      itemFields: [
        { key: 'name', label: 'Name', component: 'input' },
      ],
      defaultItem: { name: '' },
      minItems: 1,
      maxItems: 5,
      sortable: true,
    },
    ...overrides,
  })

  it('should render empty state when no items', () => {
    const wrapper = mount(ArrayField, {
      props: {
        modelValue: [],
        field: createField(),
        disabled: false,
      },
    })
    expect(wrapper.find('.dc-array-field__empty').exists()).toBe(true)
  })

  it('should render items', () => {
    const wrapper = mount(ArrayField, {
      props: {
        modelValue: [{ name: 'Item 1' }, { name: 'Item 2' }],
        field: createField(),
        disabled: false,
      },
    })
    expect(wrapper.findAll('.dc-array-field__item')).toHaveLength(2)
  })

  it('should add item when clicking add button', async () => {
    const wrapper = mount(ArrayField, {
      props: {
        modelValue: [{ name: 'Item 1' }],
        field: createField(),
        disabled: false,
      },
    })
    await wrapper.find('.dc-array-field__add').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toHaveLength(2)
  })

  it('should not add item when maxItems reached', async () => {
    const wrapper = mount(ArrayField, {
      props: {
        modelValue: [{ name: '1' }, { name: '2' }, { name: '3' }, { name: '4' }, { name: '5' }],
        field: createField(),
        disabled: false,
      },
    })
    const addBtn = wrapper.find('.dc-array-field__add')
    expect(addBtn.attributes('disabled')).toBeDefined()
  })

  it('should remove item when clicking remove button', async () => {
    const wrapper = mount(ArrayField, {
      props: {
        modelValue: [{ name: 'Item 1' }, { name: 'Item 2' }],
        field: createField(),
        disabled: false,
      },
    })
    await wrapper.find('.dc-array-field__remove').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toHaveLength(1)
  })

  it('should not remove item when minItems reached', async () => {
    const wrapper = mount(ArrayField, {
      props: {
        modelValue: [{ name: 'Item 1' }],
        field: createField({ props: { minItems: 1 } }),
        disabled: false,
      },
    })
    const removeBtn = wrapper.find('.dc-array-field__remove')
    expect(removeBtn.attributes('disabled')).toBeDefined()
  })
})
```

- [ ] **Step 3: 实现 ArrayField 渲染逻辑**

完善 ArrayField 组件的 setup 函数返回值，实现完整的渲染逻辑：

```typescript
return () => {
  const { itemFields, sortable } = config.value

  const renderItem = (item: Record<string, unknown>, index: number) => {
    const isExpanded = expandedItems.value.has(index)
    const title = item.label || item.name || item.title || `Item ${index + 1}`

    return h('div', {
      key: index,
      class: 'dc-array-field__item',
    }, [
      // Header
      h('div', {
        class: 'dc-array-field__item-header',
        onClick: () => toggleExpand(index),
      }, [
        h('span', { class: 'dc-array-field__item-toggle' }, isExpanded ? '▼' : '▶'),
        h('span', { class: 'dc-array-field__item-title' }, `${title}`),
        h('div', { class: 'dc-array-field__item-actions' }, [
          sortable && index > 0
            ? h('button', {
                class: 'dc-array-field__sort',
                disabled: props.disabled,
                onClick: (e: Event) => { e.stopPropagation(); moveItem(index, 'up') },
              }, '↑')
            : null,
          sortable && index < items.value.length - 1
            ? h('button', {
                class: 'dc-array-field__sort',
                disabled: props.disabled,
                onClick: (e: Event) => { e.stopPropagation(); moveItem(index, 'down') },
              }, '↓')
            : null,
          h('button', {
            class: 'dc-array-field__remove',
            disabled: props.disabled || !canRemove.value,
            onClick: (e: Event) => { e.stopPropagation(); removeItem(index) },
          }, '×'),
        ]),
      ]),
      // Body (fields)
      isExpanded
        ? h('div', { class: 'dc-array-field__item-body' },
            itemFields.map(field =>
              h('div', { class: 'dc-array-field__field', key: field.key }, [
                h('label', { class: 'dc-array-field__field-label' }, field.label),
                h('input', {
                  class: 'dc-array-field__field-input',
                  type: 'text',
                  value: item[field.key] ?? '',
                  disabled: props.disabled,
                  onInput: (e: Event) => updateItem(index, field.key, (e.target as HTMLInputElement).value),
                }),
              ]),
            ),
          )
        : null,
    ])
  }

  return h('div', { class: 'dc-array-field' }, [
    items.value.length > 0
      ? h('div', { class: 'dc-array-field__list' }, items.value.map((item, i) => renderItem(item, i)))
      : h('div', { class: 'dc-array-field__empty' }, '暂无数据'),
    h('button', {
      class: 'dc-array-field__add',
      disabled: props.disabled || !canAdd.value,
      onClick: addItem,
    }, '+ 添加'),
  ])
}
```

- [ ] **Step 4: 运行测试验证**

```bash
cd packages/builtin-fields
pnpm test src/fields/ArrayField.test.ts
```

预期：所有测试通过

- [ ] **Step 5: 提交代码**

```bash
git add packages/builtin-fields/src/fields/ArrayField.ts packages/builtin-fields/src/fields/ArrayField.test.ts
git commit -m "feat(builtin-fields): add ArrayField component for array type configuration"
```

---

### Task 2: 导出 ArrayField 组件

**Files:**
- Modify: `packages/builtin-fields/src/fields/index.ts`
- Modify: `packages/builtin-fields/src/index.ts`

**Interfaces:**
- Produces: `ArrayField` exported from `@dragcraft/builtin-fields`

- [ ] **Step 1: 更新 fields/index.ts 导出**

修改 `packages/builtin-fields/src/fields/index.ts`，添加 ArrayField 导出：

```typescript
export { default as ArrayField } from './ArrayField'
export { default as ColorField } from './ColorField'
export { default as InputField } from './InputField'
export { default as NumberField } from './NumberField'
export { default as SelectField } from './SelectField'
export { default as SliderField } from './SliderField'
export { default as SwitchField } from './SwitchField'
export { default as TextareaField } from './TextareaField'

export function buildDefaultFieldComponentMap(): Record<string, any> {
  return {
    'input': InputField,
    'number': NumberField,
    'textarea': TextareaField,
    'select': SelectField,
    'switch': SwitchField,
    'color': ColorField,
    'slider': SliderField,
    'array': ArrayField,
  }
}
```

- [ ] **Step 2: 更新 index.ts 导出**

修改 `packages/builtin-fields/src/index.ts`，添加 ArrayField 导出：

```typescript
// ── Field Components ─────────────────────
export {
  ArrayField,
  buildDefaultFieldComponentMap,
  ColorField,
  InputField,
  NumberField,
  SelectField,
  SliderField,
  SwitchField,
  TextareaField,
} from './fields'
```

- [ ] **Step 3: 验证构建**

```bash
cd packages/builtin-fields
pnpm build
```

预期：构建成功，ArrayField 被正确导出

- [ ] **Step 4: 提交代码**

```bash
git add packages/builtin-fields/src/fields/index.ts packages/builtin-fields/src/index.ts
git commit -m "feat(builtin-fields): export ArrayField component"
```

---

### Task 3: 创建 NavbarTitleField 专用组件

**Files:**
- Create: `playground/src/fields/NavbarTitleField.ts`

**Interfaces:**
- Consumes: `FieldSchema` from `@dragcraft/form-generator`
- Produces: `NavbarTitleField` component with `modelValue: { title, subtitle, titleFontSize, titleFontWeight }` prop

- [ ] **Step 1: 创建 NavbarTitleField 组件**

创建文件 `playground/src/fields/NavbarTitleField.ts`：

```typescript
import type { FieldSchema } from '@dragcraft/form-generator'
import type { PropType } from 'vue'
import { computed, defineComponent, h } from 'vue'

interface NavbarTitleConfig {
  title: string
  subtitle?: string
  titleFontSize?: number
  titleFontWeight?: string
}

export default defineComponent({
  name: 'NavbarTitleField',

  props: {
    modelValue: {
      type: Object as PropType<NavbarTitleConfig>,
      default: () => ({ title: '页面标题', subtitle: '', titleFontSize: 16, titleFontWeight: '600' }),
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    field: {
      type: Object as PropType<FieldSchema>,
      required: true,
    },
  },

  emits: ['update:modelValue'],

  setup(props, { emit }) {
    const config = computed(() => props.modelValue as NavbarTitleConfig)

    const updateField = (key: string, value: unknown) => {
      emit('update:modelValue', {
        ...config.value,
        [key]: value,
      })
    }

    return () => {
      const { title, subtitle, titleFontSize = 16, titleFontWeight = '600' } = config.value

      return h('div', { class: 'dc-navbar-title-field' }, [
        // Preview
        h('div', { class: 'dc-navbar-title-field__preview' }, [
          h('div', {
            class: 'dc-navbar-title-field__preview-title',
            style: {
              fontSize: `${titleFontSize}px`,
              fontWeight: titleFontWeight,
            },
          }, title || '页面标题'),
          subtitle
            ? h('div', {
                class: 'dc-navbar-title-field__preview-subtitle',
              }, subtitle)
            : null,
        ]),

        // Fields
        h('div', { class: 'dc-navbar-title-field__fields' }, [
          // Title
          h('div', { class: 'dc-navbar-title-field__field' }, [
            h('label', { class: 'dc-navbar-title-field__label' }, '主标题'),
            h('input', {
              class: 'dc-navbar-title-field__input',
              type: 'text',
              value: title,
              disabled: props.disabled,
              placeholder: '请输入标题',
              onInput: (e: Event) => updateField('title', (e.target as HTMLInputElement).value),
            }),
          ]),

          // Subtitle
          h('div', { class: 'dc-navbar-title-field__field' }, [
            h('label', { class: 'dc-navbar-title-field__label' }, '副标题'),
            h('input', {
              class: 'dc-navbar-title-field__input',
              type: 'text',
              value: subtitle || '',
              disabled: props.disabled,
              placeholder: '请输入副标题（可选）',
              onInput: (e: Event) => updateField('subtitle', (e.target as HTMLInputElement).value),
            }),
          ]),

          // Font Size
          h('div', { class: 'dc-navbar-title-field__field' }, [
            h('label', { class: 'dc-navbar-title-field__label' }, `字号: ${titleFontSize}px`),
            h('input', {
              class: 'dc-navbar-title-field__slider',
              type: 'range',
              min: 12,
              max: 24,
              value: titleFontSize,
              disabled: props.disabled,
              onInput: (e: Event) => updateField('titleFontSize', Number((e.target as HTMLInputElement).value)),
            }),
          ]),

          // Font Weight
          h('div', { class: 'dc-navbar-title-field__field' }, [
            h('label', { class: 'dc-navbar-title-field__label' }, '字重'),
            h('select', {
              class: 'dc-navbar-title-field__select',
              value: titleFontWeight,
              disabled: props.disabled,
              onChange: (e: Event) => updateField('titleFontWeight', (e.target as HTMLSelectElement).value),
            }, [
              h('option', { value: '400' }, '常规'),
              h('option', { value: '500' }, '中等'),
              h('option', { value: '600' }, '粗体'),
            ]),
          ]),
        ]),
      ])
    }
  },
})
```

- [ ] **Step 2: 验证组件创建**

确认文件创建成功，没有语法错误。

- [ ] **Step 3: 提交代码**

```bash
git add playground/src/fields/NavbarTitleField.ts
git commit -m "feat(playground): add NavbarTitleField component for enhanced title configuration"
```

---

### Task 4: 更新 TabBarWidget 使用 ArrayField

**Files:**
- Modify: `playground/src/widgets/TabBarWidget.ts`

**Interfaces:**
- Consumes: `ArrayField` component registered as 'array' in fieldComponentMap
- Produces: Updated `formSchema` with array component configuration

- [ ] **Step 1: 更新 TabBarWidget 的 formSchema**

修改 `playground/src/widgets/TabBarWidget.ts`，更新 formSchema：

```typescript
export const tabBarWidgetMeta: WidgetMeta = {
  type: 'tab-bar',
  title: 'Tab 栏',
  group: 'navigation',
  icon: 'tabbar',
  draggable: false,
  sortable: false,
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
        title: 'Tab 配置',
        fields: [
          {
            key: 'tabs',
            label: 'Tab 列表',
            component: 'array',
            props: {
              itemFields: [
                {
                  key: 'label',
                  label: '标签文字',
                  component: 'input',
                  props: { placeholder: '请输入标签文字' },
                },
                {
                  key: 'icon',
                  label: '图标',
                  component: 'input',
                  props: { placeholder: '请输入图标名称' },
                },
              ],
              defaultItem: { label: '新标签', icon: 'home' },
              sortable: true,
              minItems: 2,
              maxItems: 5,
            },
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
```

- [ ] **Step 2: 验证 TypeScript 类型**

```bash
cd playground
pnpm typecheck
```

预期：没有类型错误

- [ ] **Step 3: 提交代码**

```bash
git add playground/src/widgets/TabBarWidget.ts
git commit -m "refactor(playground): update TabBarWidget to use ArrayField for tabs configuration"
```

---

### Task 5: 更新 NavbarWidget 支持标题样式增强

**Files:**
- Modify: `playground/src/widgets/NavbarWidget.ts`

**Interfaces:**
- Produces: Extended `NavbarWidget` with subtitle, titleFontSize, titleFontWeight props
- Produces: Updated `formSchema` using NavbarTitleField component

- [ ] **Step 1: 更新 NavbarWidget 的 defaultProps**

修改 `playground/src/widgets/NavbarWidget.ts`，扩展 defaultProps：

```typescript
export const navbarWidgetMeta: WidgetMeta = {
  type: 'navbar',
  title: '导航栏',
  group: 'navigation',
  icon: 'navbar',
  draggable: false,
  sortable: false,
  defaultProps: {
    title: '页面标题',
    subtitle: '',
    titleFontSize: 16,
    titleFontWeight: '600',
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
        title: '标题设置',
        fields: [
          {
            key: 'titleConfig',
            label: '标题配置',
            component: 'navbar-title',
            parseValue: (config: Record<string, unknown>) => ({
              title: config.title,
              subtitle: config.subtitle,
              titleFontSize: config.titleFontSize,
              titleFontWeight: config.titleFontWeight,
            }),
            valueFormat: (_value: unknown, ctx: { values: Record<string, unknown> }) => ({
              title: ctx.values.title,
              subtitle: ctx.values.subtitle,
              titleFontSize: ctx.values.titleFontSize,
              titleFontWeight: ctx.values.titleFontWeight,
            }),
          },
        ],
      },
      {
        title: '基础设置',
        fields: [
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
```

- [ ] **Step 2: 更新 NavbarWidget 组件 props**

修改 NavbarWidget 组件定义，添加新的 props：

```typescript
export default defineComponent({
  name: 'DcNavbarWidget',

  props: {
    title: {
      type: String as PropType<string>,
      default: '页面标题',
    },
    subtitle: {
      type: String as PropType<string>,
      default: '',
    },
    titleFontSize: {
      type: Number as PropType<number>,
      default: 16,
    },
    titleFontWeight: {
      type: String as PropType<string>,
      default: '600',
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
          boxSizing: 'border-box',
          height: '44px',
          paddingTop: '12px',
          paddingBottom: '12px',
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
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '18px',
                cursor: 'pointer',
              },
            }, '←')
          : null,
        h('div', {
          class: 'dc-widget-navbar__title-wrapper',
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          },
        }, [
          h('span', {
            class: 'dc-widget-navbar__title',
            style: {
              fontSize: `${props.titleFontSize}px`,
              fontWeight: props.titleFontWeight,
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '200px',
            },
          }, props.title),
          props.subtitle
            ? h('span', {
                class: 'dc-widget-navbar__subtitle',
                style: {
                  fontSize: '12px',
                  color: props.textColor,
                  opacity: 0.7,
                  marginTop: '2px',
                },
              }, props.subtitle)
            : null,
        ]),
      ])
  },
})
```

- [ ] **Step 3: 验证 TypeScript 类型**

```bash
cd playground
pnpm typecheck
```

预期：没有类型错误

- [ ] **Step 4: 提交代码**

```bash
git add playground/src/widgets/NavbarWidget.ts
git commit -m "feat(playground): enhance NavbarWidget with subtitle and title style configuration"
```

---

### Task 6: 注册自定义字段组件

**Files:**
- Modify: `playground/src/shared/fields.ts`
- Modify: `playground/src/widgets/index.ts`

**Interfaces:**
- Consumes: `ArrayField` from `@dragcraft/builtin-fields`
- Consumes: `NavbarTitleField` from `../fields/NavbarTitleField`
- Produces: Updated `playgroundFieldMap` with new field components

- [ ] **Step 1: 更新 fields.ts 注册新组件**

修改 `playground/src/shared/fields.ts`，添加新的字段组件：

```typescript
import ArrayField from '@dragcraft/builtin-fields/src/fields/ArrayField'
import NavbarTitleField from '../fields/NavbarTitleField'

export const InputField = defineComponent({
  // ... 现有代码保持不变
})

export const NumberField = defineComponent({
  // ... 现有代码保持不变
})

export const ColorField = defineComponent({
  // ... 现有代码保持不变
})

export const SliderField = defineComponent({
  // ... 现有代码保持不变
})

export const SwitchField = defineComponent({
  // ... 现有代码保持不变
})

export const IconPickerField = defineComponent({
  // ... 现有代码保持不变
})

export const playgroundFieldMap = {
  'input': InputField,
  'number': NumberField,
  'color': ColorField,
  'slider': SliderField,
  'switch': SwitchField,
  'icon-picker': IconPickerField,
  'array': ArrayField,
  'navbar-title': NavbarTitleField,
}
```

- [ ] **Step 2: 更新 widgets/index.ts 导出 NavbarTitleField**

修改 `playground/src/widgets/index.ts`，添加 NavbarTitleField 导出：

```typescript
import type { WidgetMeta } from '@dragcraft/core'
import type { WidgetGroupConfig } from '@dragcraft/widgets'
import type { Component } from 'vue'
import NavbarWidget, { navbarWidgetMeta } from './NavbarWidget'
import SwiperWidget, { swiperWidgetMeta } from './SwiperWidget'
import TabBarWidget, { tabBarWidgetMeta } from './TabBarWidget'
import NavbarTitleField from '../fields/NavbarTitleField'

// ── Widget metas ────────────────────────────

export const playgroundWidgetMetas: WidgetMeta[] = [
  navbarWidgetMeta,
  tabBarWidgetMeta,
  swiperWidgetMeta,
]

// ── Component map ───────────────────────────

export const playgroundComponentMap: Record<string, Component> = {
  'navbar': NavbarWidget,
  'tab-bar': TabBarWidget,
  'swiper': SwiperWidget,
}

// ── Widget groups ───────────────────────────

export const playgroundWidgetGroups: WidgetGroupConfig[] = [
  { name: 'navigation', title: '导航容器' },
]

// ── Field components ────────────────────────

export const playgroundFieldComponents = {
  'navbar-title': NavbarTitleField,
}

// ── Individual exports ──────────────────────

export { NavbarWidget, navbarWidgetMeta }
export { SwiperWidget, swiperWidgetMeta }
export { TabBarWidget, tabBarWidgetMeta }
export { NavbarTitleField }
```

- [ ] **Step 3: 验证 TypeScript 类型**

```bash
cd playground
pnpm typecheck
```

预期：没有类型错误

- [ ] **Step 4: 提交代码**

```bash
git add playground/src/shared/fields.ts playground/src/widgets/index.ts
git commit -m "feat(playground): register ArrayField and NavbarTitleField components"
```

---

### Task 7: 集成测试与验证

**Files:**
- None (testing only)

**Interfaces:**
- Consumes: All components created in previous tasks

- [ ] **Step 1: 运行全量测试**

```bash
pnpm test
```

预期：所有测试通过

- [ ] **Step 2: 运行类型检查**

```bash
pnpm typecheck
```

预期：没有类型错误

- [ ] **Step 3: 运行 lint 检查**

```bash
pnpm lint
```

预期：没有 lint 错误

- [ ] **Step 4: 启动 playground 验证**

```bash
cd playground
pnpm dev
```

在浏览器中验证：
1. 拖入 TabBarWidget，点击配置面板，验证 tabs 配置使用可视化编辑器
2. 拖入 NavbarWidget，点击配置面板，验证标题配置支持副标题和样式调整
3. 测试添加、删除、排序 tab 项
4. 测试修改标题样式后预览效果

- [ ] **Step 5: 提交最终代码**

```bash
git add .
git commit -m "feat: complete custom form fields implementation

- Add ArrayField component for array type configuration
- Add NavbarTitleField component for enhanced title configuration
- Update TabBarWidget to use ArrayField for tabs
- Update NavbarWidget with subtitle and title style support
- Register all new field components in playground"
```

---

## 验收标准

### ArrayField 组件

- [ ] 能够添加、删除、编辑数组项
- [ ] 能够对数组项进行排序
- [ ] 支持 `minItems`/`maxItems` 限制
- [ ] 子字段能够正确渲染和交互
- [ ] 单元测试通过

### NavbarTitleField 组件

- [ ] 能够配置主标题、副标题、字号、字重
- [ ] 预览区域能够实时显示配置效果
- [ ] 配置变更能够正确反映到 Navbar 组件
- [ ] 与现有配置项（颜色、返回按钮等）兼容

### TabBarWidget 配置优化

- [ ] Tab 配置使用可视化编辑器，不再需要输入 JSON
- [ ] 能够添加、删除、排序 tab 项
- [ ] 每个 tab 项可以配置标签和图标
- [ ] 配置变更能够实时反映到画布

### NavbarWidget 配置增强

- [ ] 支持副标题配置
- [ ] 支持标题字号调整（12-24px）
- [ ] 支持字重选择（常规/中等/粗体）
- [ ] 预览区域能够实时显示配置效果

### 整体集成

- [ ] 所有功能正常工作
- [ ] UI 交互流畅
- [ ] 代码通过 lint 和 typecheck
- [ ] 文档完整

---

## 执行选项

计划完成并保存到 `docs/superpowers/plans/2026-06-27-custom-form-fields-implementation.md`。两种执行方式：

**1. Subagent-Driven（推荐）** - 我为每个任务分发独立的子代理，任务间进行审查，快速迭代

**2. Inline Execution** - 在本会话中使用 executing-plans 执行任务，批量执行并设置检查点

你选择哪种方式？
