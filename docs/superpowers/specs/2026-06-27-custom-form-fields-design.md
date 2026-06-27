# 自定义表单字段设计方案

**日期**: 2026-06-27
**状态**: 已批准
**作者**: dragcraft team

## 1. 背景与目标

### 1.1 问题描述

在 playground 中，`TabBarWidget` 和 `NavbarWidget` 的配置表单存在以下问题：

- **TabBarWidget**: `tabs` 配置使用 textarea 输入 JSON 字符串，用户体验极差
- **NavbarWidget**: 标题配置能力有限，无法支持副标题、字号等样式配置

### 1.2 设计目标

1. 为复杂配置（如数组类型）提供可视化编辑界面
2. 展示 form-generator 的自定义字段能力
3. 提供可复用的通用组件，同时支持专用组件定制

## 2. 设计方案

### 2.1 核心思路

采用**混合方案**：通用数组编辑器 + 声明式配置 + 专用组件

- 创建通用的 `ArrayField` 组件，支持增删改查、排序
- 通过 `fieldComponentMap` 注册到 form-generator
- 在 widget 的 `formSchema` 中声明使用哪个字段组件
- 对于特殊需求，开发专用组件（如 `NavbarTitleField`）

### 2.2 组件架构

```
┌─────────────────────────────────────────────────────────────┐
│                    FormGenerator                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              fieldComponentMap                       │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│  │  │  input  │ │  color  │ │  array  │ │ navbar- │   │   │
│  │  │         │ │         │ │ (新增)  │ │ title   │   │   │
│  │  └─────────┘ └─────────┘ └─────────┘ │ (新增)  │   │   │
│  │                                       └─────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↓                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                FormField 渲染                        │   │
│  │    根据 field.component 从 fieldComponentMap         │   │
│  │    查找对应组件并渲染                                 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 3. 组件设计

### 3.1 ArrayField 组件（通用）

**位置**: `packages/builtin-fields/src/fields/ArrayField.ts`

**接口定义**:

```typescript
interface ArrayFieldProps {
  modelValue: Array<Record<string, unknown>>
  field: FieldSchema
  disabled: boolean
}

// field.props 配置
interface ArrayFieldConfig {
  // 每项的字段定义（复用 FieldSchema）
  itemFields: FieldSchema[]
  // 最小项数
  minItems?: number
  // 最大项数
  maxItems?: number
  // 新增项的默认值
  defaultItem?: Record<string, unknown>
  // 是否显示排序按钮
  sortable?: boolean
}
```

**UI 交互**:

```
┌─────────────────────────────────────────────────────────┐
│ Tab 列表                                    [+ 添加]   │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ▼ Tab 1                              [↑] [↓] [×]  │ │
│ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ │ 标签文字: [首页        ]                        │ │ │
│ │ │ 图标:     [⌂] [☷] [#] [*] [~] [♡] [☆] [⚙]   │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ▶ Tab 2                              [↑] [↓] [×]  │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**功能特性**:

1. **列表展示**
   - 每个数组项显示为可折叠的卡片
   - 展开时显示该项的所有子字段
   - 折叠时只显示标题（如 "Tab 1: 首页"）

2. **增删操作**
   - 底部"添加"按钮，点击新增一项
   - 每项右侧有删除按钮
   - 支持 `minItems`/`maxItems` 限制

3. **排序功能**
   - 可选的上下排序按钮
   - 通过 `sortable` 配置控制是否显示

4. **子字段渲染**
   - 使用 `FormField` 组件渲染每个子字段
   - 子字段配置通过 `itemFields` 声明

**实现要点**:

```typescript
// ArrayField.ts 核心逻辑
export default defineComponent({
  name: 'ArrayField',
  props: {
    modelValue: { type: Array, default: () => [] },
    field: { type: Object, required: true },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const config = computed(() => props.field.props as ArrayFieldConfig)
    const items = computed(() => props.modelValue || [])

    // 添加新项
    const addItem = () => {
      const newItem = config.value.defaultItem || {}
      emit('update:modelValue', [...items.value, { ...newItem }])
    }

    // 删除项
    const removeItem = (index: number) => {
      const newItems = items.value.filter((_, i) => i !== index)
      emit('update:modelValue', newItems)
    }

    // 更新项
    const updateItem = (index: number, key: string, value: unknown) => {
      const newItems = [...items.value]
      newItems[index] = { ...newItems[index], [key]: value }
      emit('update:modelValue', newItems)
    }

    // 移动项
    const moveItem = (from: number, to: number) => {
      const newItems = [...items.value]
      const [item] = newItems.splice(from, 1)
      newItems.splice(to, 0, item)
      emit('update:modelValue', newItems)
    }

    return () => {
      // 渲染逻辑
    }
  },
})
```

### 3.2 NavbarTitleField 组件（专用）

**位置**: `playground/src/fields/NavbarTitleField.ts`

**接口定义**:

```typescript
interface NavbarTitleConfig {
  title: string
  subtitle?: string
  titleFontSize?: number
  titleFontWeight?: string
}
```

**UI 交互**:

```
┌─────────────────────────────────────────────────────────┐
│ 标题配置                                                │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │              [预览区域]                              │ │
│ │              页面标题                                │ │
│ │              副标题文字                              │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ 主标题: [页面标题          ]                            │
│ 副标题: [                  ]                            │
│ 字号:   [16] [- ───────── +]                            │
│ 字重:   [常规 ▼]                                        │
└─────────────────────────────────────────────────────────┘
```

**功能特性**:

1. **实时预览**
   - 顶部显示标题的实时预览效果
   - 随配置变化实时更新

2. **配置项**
   - 主标题输入框
   - 副标题输入框（可选）
   - 字号滑块（12-24px）
   - 字重下拉选择（常规/中等/粗体）

**实现要点**:

```typescript
// NavbarTitleField.ts 核心逻辑
export default defineComponent({
  name: 'NavbarTitleField',
  props: {
    modelValue: { type: Object, default: () => ({}) },
    field: { type: Object, required: true },
    disabled: { type: Boolean, default: false },
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
      // 渲染预览 + 表单
    }
  },
})
```

## 4. 数据结构设计

### 4.1 TabBarWidget 的 tabs 配置

**TabItem 接口**:

```typescript
interface TabItem {
  label: string      // 标签文字
  icon: string       // 图标名称
  link?: string      // 链接地址（可选，暂不实现）
}
```

**formSchema 声明**:

```typescript
// TabBarWidget.ts
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
                props: { placeholder: '请输入标签文字' }
              },
              {
                key: 'icon',
                label: '图标',
                component: 'icon-picker',
              }
            ],
            defaultItem: { label: '新标签', icon: 'home' },
            sortable: true,
            minItems: 2,
            maxItems: 5
          }
        }
      ]
    },
    {
      title: '样式设置',
      fields: [
        // ... 现有的颜色配置
      ]
    }
  ]
}
```

### 4.2 NavbarWidget 的标题配置

**扩展后的 defaultProps**:

```typescript
// NavbarWidget.ts
defaultProps: {
  title: '页面标题',
  subtitle: '',           // 新增：副标题
  titleFontSize: 16,      // 新增：标题字号
  titleFontWeight: '600', // 新增：字重
  showBack: false,
  backgroundColor: '#ffffff',
  textColor: '#1a1a1a',
  transparent: false,
}
```

**formSchema 声明**:

```typescript
// NavbarWidget.ts
formSchema: {
  sections: [
    {
      title: '标题设置',
      fields: [
        {
          key: 'titleConfig',
          label: '标题配置',
          component: 'navbar-title',
          // 数据转换
          parseValue: (config: NavbarTitleConfig) => ({
            title: config.title,
            subtitle: config.subtitle,
            titleFontSize: config.titleFontSize,
            titleFontWeight: config.titleFontWeight
          }),
          valueFormat: (values: Record<string, unknown>) => ({
            title: values.title,
            subtitle: values.subtitle,
            titleFontSize: values.titleFontSize,
            titleFontWeight: values.titleFontWeight
          })
        }
      ]
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
      ]
    },
    {
      title: '样式设置',
      fields: [
        // ... 现有的颜色配置
      ]
    }
  ]
}
```

## 5. 注册与集成

### 5.1 注册自定义字段组件

**文件**: `playground/src/shared/fields.ts`

```typescript
import ArrayField from '@dragcraft/builtin-fields/src/fields/ArrayField'
import NavbarTitleField from '../fields/NavbarTitleField'

export const playgroundFieldMap = {
  'input': InputField,
  'number': NumberField,
  'color': ColorField,
  'slider': SliderField,
  'switch': SwitchField,
  'icon-picker': IconPickerField,
  'array': ArrayField,              // 新增：通用数组编辑器
  'navbar-title': NavbarTitleField,  // 新增：Navbar 标题专用组件
}
```

### 5.2 在 App.vue 中使用

**文件**: `playground/src/App.vue`

```typescript
import { playgroundFieldMap } from './shared/fields'
import { buildDefaultFieldComponentMap } from '@dragcraft/builtin-fields'

const designer = createDesigner({
  // ... 其他配置
  fieldComponentMap: {
    ...buildDefaultFieldComponentMap(),
    ...playgroundFieldMap  // 合并 playground 自定义字段
  },
})
```

### 5.3 NavbarWidget 组件更新

**文件**: `playground/src/widgets/NavbarWidget.ts`

```typescript
export default defineComponent({
  name: 'DcNavbarWidget',
  props: {
    // ... 现有 props
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
  },
  setup(props) {
    return () =>
      h('div', {
        class: 'dc-widget-navbar',
        style: {
          // ... 现有样式
        },
      }, [
        // ... 返回按钮
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
              // ... 其他样式
            },
          }, props.title),
          props.subtitle
            ? h('span', {
                class: 'dc-widget-navbar__subtitle',
                style: {
                  fontSize: '12px',
                  color: '#999',
                  marginTop: '2px',
                },
              }, props.subtitle)
            : null,
        ]),
      ])
  },
})
```

## 6. 实现阶段

### Phase 1: 通用 ArrayField 组件

**目标**: 创建可复用的数组编辑器组件

**任务**:
1. 创建 `ArrayField.ts` 组件
2. 实现增删改查功能
3. 实现排序功能（可选）
4. 集成到 `builtin-fields` 包
5. 编写单元测试

**验收标准**:
- [ ] 能够添加、删除、编辑数组项
- [ ] 能够对数组项进行排序
- [ ] 支持 `minItems`/`maxItems` 限制
- [ ] 子字段能够正确渲染和交互
- [ ] 单元测试通过

### Phase 2: TabBarWidget 配置优化

**目标**: 使用 ArrayField 优化 TabBarWidget 的配置体验

**任务**:
1. 修改 `TabBarWidget` 的 `formSchema`
2. 测试交互效果
3. 优化 UI 细节

**验收标准**:
- [ ] Tab 配置使用可视化编辑器，不再需要输入 JSON
- [ ] 能够添加、删除、排序 tab 项
- [ ] 每个 tab 项可以配置标签和图标
- [ ] 配置变更能够实时反映到画布

### Phase 3: NavbarTitleField 专用组件

**目标**: 为 NavbarWidget 创建专用的标题配置组件

**任务**:
1. 创建 `NavbarTitleField.ts` 组件
2. 实现实时预览功能
3. 扩展 `NavbarWidget` 的 props
4. 更新 `NavbarWidget` 的渲染逻辑
5. 集成到 playground

**验收标准**:
- [ ] 能够配置主标题、副标题、字号、字重
- [ ] 预览区域能够实时显示配置效果
- [ ] 配置变更能够正确反映到 Navbar 组件
- [ ] 与现有配置项（颜色、返回按钮等）兼容

### Phase 4: 测试与优化

**目标**: 全面测试并优化用户体验

**任务**:
1. 测试所有交互场景
2. 优化 UI/UX 细节
3. 更新文档
4. 提交代码

**验收标准**:
- [ ] 所有功能正常工作
- [ ] UI 交互流畅
- [ ] 文档完整
- [ ] 代码通过 lint 和 typecheck

## 7. 技术细节

### 7.1 数据转换

对于 `NavbarTitleField`，需要使用 `parseValue` 和 `valueFormat` 进行数据转换：

- **parseValue**: 将组件输出的数据转换为 widget props
- **valueFormat**: 将 widget props 转换为组件输入的数据

这样可以将多个 props（title, subtitle, titleFontSize, titleFontWeight）聚合为一个配置对象。

### 7.2 表单验证

`ArrayField` 需要支持以下验证：

- `minItems`: 最小项数
- `maxItems`: 最大项数
- 子字段的验证规则（通过 `itemFields` 中的 `rules` 配置）

### 7.3 性能优化

- 使用 `computed` 缓存配置和列表数据
- 避免不必要的重新渲染
- 使用 `v-memo` 或 `shallowRef` 优化大列表

## 8. 未来扩展

### 8.1 更多通用组件

- `ObjectField`: 通用对象编辑器
- `KeyValueField`: 键值对编辑器
- `ColorSchemeField`: 配色方案编辑器

### 8.2 更多专用组件

- `SwiperSlideField`: 轮播图幻灯片配置
- `GridLayoutField`: 网格布局配置
- `AnimationField`: 动画配置

### 8.3 增强功能

- 拖拽排序
- 复制粘贴
- 导入导出配置
- 预设模板

## 9. 总结

本设计方案通过混合方案（通用组件 + 专用组件）解决了 playground 中复杂配置的 UI 问题：

1. **通用性**: `ArrayField` 组件可复用于任何数组类型配置
2. **定制化**: `NavbarTitleField` 组件提供专用的配置体验
3. **可扩展**: 设计支持未来添加更多通用和专用组件
4. **用户友好**: 可视化编辑替代 JSON 输入，降低使用门槛

通过这个方案，playground 将能够更好地展示 form-generator 的自定义字段能力，为用户提供更丰富的配置体验。
