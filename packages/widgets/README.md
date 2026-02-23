# @dragcraft/widgets

`@dragcraft/widgets` 提供默认物料集合与物料协议定义。

## 目标

- 提供可直接使用的基础 widget（如 Button、Image、Text）。
- 支持分组管理，便于左栏物料区分类展示。
- 每个 widget 内置 form schema，用于右栏配置。

## 设计边界

- 不依赖 `@dragcraft/form-generator`（formSchema 保持松耦合，运行时遵循 FormSchema 结构）。
- 不依赖 `@dragcraft/renderer`（ComponentMap 由消费方桥接）。
- 仅依赖 `@dragcraft/core`（WidgetMeta 类型）和 `vue`（组件定义）。
- 所有组件使用原生 HTML 元素，不引入第三方 UI 库。
- 不内置 CSS 样式，仅应用 CSS class 名。

## 快速上手

```ts
import { createEngine } from '@dragcraft/core'
import { RootRenderer } from '@dragcraft/renderer'
import { getDefaultComponentMap, registerAllWidgets } from '@dragcraft/widgets'

// 1. 创建引擎
const engine = createEngine()

// 2. 批量注册所有默认物料元信息
registerAllWidgets(engine)

// 3. 获取组件映射给 renderer 使用
const componentMap = getDefaultComponentMap()

// 4. 在 Vue 模板中使用
// <RootRenderer :engine="engine" :component-map="componentMap" />
```

## 文件结构

```
src/
├── index.ts                       # 公共 API barrel export
├── types.ts                       # WidgetDefinition、WidgetGroup 等类型
├── helpers.ts                     # registerAllWidgets、getDefaultComponentMap 等辅助函数
└── widgets/
    ├── index.ts                   # widgets barrel export
    ├── basic/
    │   ├── index.ts
    │   ├── TextWidget.ts          # 文本 (type: 'text')
    │   ├── ButtonWidget.ts        # 按钮 (type: 'button')
    │   ├── ImageWidget.ts         # 图片 (type: 'image')
    │   ├── LinkWidget.ts          # 链接 (type: 'link')
    │   └── DividerWidget.ts       # 分割线 (type: 'divider')
    ├── form/
    │   ├── index.ts
    │   ├── FormInputWidget.ts     # 输入框 (type: 'form-input')
    │   ├── FormTextareaWidget.ts  # 多行文本 (type: 'form-textarea')
    │   ├── FormSelectWidget.ts    # 下拉选择 (type: 'form-select')
    │   ├── FormCheckboxWidget.ts  # 复选框 (type: 'form-checkbox')
    │   └── FormRadioWidget.ts     # 单选组 (type: 'form-radio')
    └── layout/
        ├── index.ts
        ├── FlexRowWidget.ts       # 横向布局 (type: 'flex-row')
        └── FlexColumnWidget.ts    # 纵向布局 (type: 'flex-column')
```

## Widget 协议

每个 widget 由两部分组成：

1. **WidgetMeta** — 注册到 core registry 的元信息
2. **Vue Component** — 画布中渲染的实际组件

```ts
interface WidgetDefinition {
  meta: WidgetMeta
  component: Component
}
```

### WidgetMeta 接口

```ts
interface WidgetMeta {
  type: string
  title: string
  group: string
  icon?: string
  defaultProps: Record<string, unknown>
  defaultStyle?: Record<string, unknown>
  formSchema: Record<string, unknown>
  canHaveChildren?: boolean
}
```

## 分组机制

| 分组 | 名称 | 说明 |
|------|------|------|
| `basic` | 基础展示 | 文本、按钮、图片、链接、分割线 |
| `form` | 表单交互 | 输入框、多行文本、下拉选择、复选框、单选组 |
| `layout` | 布局容器 | 横向布局、纵向布局（canHaveChildren: true） |

> 分组字段可由业务方扩展，designer 左栏根据 group 自动聚合。

## 内置物料一览

### Basic 组（基础展示）

| type | 标题 | 主要 Props |
|------|------|-----------|
| `text` | 文本 | content, fontSize, fontWeight, color, textAlign |
| `button` | 按钮 | text, type, disabled, size |
| `image` | 图片 | src, alt, objectFit |
| `link` | 链接 | text, href, target, color |
| `divider` | 分割线 | direction, color, thickness |

### Form 组（表单交互）

| type | 标题 | 主要 Props |
|------|------|-----------|
| `form-input` | 输入框 | label, placeholder, value, required, disabled |
| `form-textarea` | 多行文本 | label, placeholder, value, rows, required, disabled |
| `form-select` | 下拉选择 | label, placeholder, value, options, required, disabled |
| `form-checkbox` | 复选框 | label, checked, disabled |
| `form-radio` | 单选组 | label, value, options, direction, disabled |

### Layout 组（布局容器）

| type | 标题 | 主要 Props | 说明 |
|------|------|-----------|------|
| `flex-row` | 横向布局 | gap, justifyContent, alignItems, wrap | canHaveChildren: true |
| `flex-column` | 纵向布局 | gap, justifyContent, alignItems | canHaveChildren: true |

## Layout 物料与普通物料的区别

| 区别点 | 普通物料 | Layout 物料 |
|--------|---------|------------|
| `canHaveChildren` | `false` | `true` |
| Schema `nodeType` | `'widget'` | `'container'`（由 designer 设置） |
| 渲染路径 | `WidgetRenderer` | `ContainerRenderer` → 自定义布局组件 |
| 子节点 | 无 | 通过 `slots.default?.()` 接收 |

Layout 组件通过 Vue 的 default slot 接收子节点，由 renderer 的 ContainerRenderer 负责传入。

## 辅助函数

| 函数 | 说明 |
|------|------|
| `registerAllWidgets(engine)` | 批量注册所有物料元信息到 engine.registry |
| `getDefaultComponentMap()` | 构建 `Record<string, Component>` 映射给 renderer 使用 |
| `getAllWidgetMetas()` | 返回所有 WidgetMeta 数组 |
| `getWidgetsByGroup(group)` | 按分组过滤 WidgetDefinition |
| `allWidgetDefinitions` | 所有 WidgetDefinition 数组（可直接读取） |
| `widgetGroups` | 分组配置数组 |

## CSS Class 命名

```
.dc-widget-text
.dc-widget-button / .dc-widget-button--small / .dc-widget-button--medium / .dc-widget-button--large
.dc-widget-image
.dc-widget-link
.dc-widget-divider / .dc-widget-divider--horizontal / .dc-widget-divider--vertical
.dc-widget-form-input / .dc-widget-form-input__label / .dc-widget-form-input__field / .dc-widget-form-input__required
.dc-widget-form-textarea / .dc-widget-form-textarea__label / .dc-widget-form-textarea__field / .dc-widget-form-textarea__required
.dc-widget-form-select / .dc-widget-form-select__label / .dc-widget-form-select__field / .dc-widget-form-select__required
.dc-widget-form-checkbox / .dc-widget-form-checkbox__input / .dc-widget-form-checkbox__label
.dc-widget-form-radio / .dc-widget-form-radio__label / .dc-widget-form-radio__group / .dc-widget-form-radio__item
.dc-widget-flex-row
.dc-widget-flex-column
```

widgets 不内置样式，仅应用 class 名，由使用方或 designer 提供样式。

## 与其他包协作

- `@dragcraft/core`：向 registry 注入 widget 元信息，通过 `type` 保持 schema 与渲染映射一致。
- `@dragcraft/renderer`：widgets 提供 Vue 组件，由 designer 收集到 componentMap 中传给 RootRenderer。
- `@dragcraft/form-generator`：widget 的 `formSchema` 字段遵循 `FormSchema` 结构（运行时契约，无编译时依赖）。
- `@dragcraft/designer`：调用 `registerAllWidgets` 和 `getDefaultComponentMap` 完成初始化。

## 约束

- 所有组件使用 `defineComponent` + `h()` render 函数。
- 不引入第三方 UI 库，全部使用原生 HTML 元素。
- formSchema 遵循 form-generator 的 FormSchema 运行时结构但不引入其类型。
- Layout 物料必须通过 slot 接收子节点，不直接操作 schema 树。

## 里程碑

1. ~~完成类型定义与辅助函数。~~ ✅
2. ~~完成 basic 组物料（5 个）。~~ ✅
3. ~~完成 form 组物料（5 个）。~~ ✅
4. ~~完成 layout 组物料（2 个）。~~ ✅
5. 补齐单元测试。
