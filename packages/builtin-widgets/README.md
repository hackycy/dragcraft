# @dragcraft/builtin-widgets

`@dragcraft/builtin-widgets` 提供 10 个内置物料组件，用于 dragcraft 设计器画布渲染。

## 目标

- 提供开箱即用的基础 widget 和表单 widget。
- 用户可按需引入，也可完全不使用本包，自行实现 widget。

## 安装

```bash
pnpm add @dragcraft/builtin-widgets
```

## 快速上手

```ts
import { createDesigner } from '@dragcraft/designer'
import { getAllWidgetMetas, getDefaultComponentMap } from '@dragcraft/builtin-widgets'

const designer = createDesigner({
  widgetMetas: getAllWidgetMetas(),
  componentMap: getDefaultComponentMap(),
  // ...
})
```

也可以混合使用内置物料与自定义物料：

```ts
import { getAllWidgetMetas, getDefaultComponentMap } from '@dragcraft/builtin-widgets'

const widgetMetas = [
  ...getAllWidgetMetas(),
  myCustomWidgetMeta,
]

const componentMap = {
  ...getDefaultComponentMap(),
  'my-custom-widget': MyCustomWidget,
}
```

## 分组机制

| 分组 | 名称 | 说明 |
|------|------|------|
| `basic` | 基础展示 | 文本、按钮、图片、链接、分割线 |
| `form` | 表单交互 | 输入框、多行文本、下拉选择、复选框、单选组 |

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

## 文件结构

```
src/
├── index.ts           # 公共 API barrel export
├── helpers.ts         # allWidgetDefinitions, widgetGroups, helper functions
├── types.ts           # WidgetType (内置类型字符串联合)
└── widgets/
    ├── index.ts
    ├── basic/
    │   ├── index.ts
    │   ├── TextWidget.ts
    │   ├── ButtonWidget.ts
    │   ├── ImageWidget.ts
    │   ├── LinkWidget.ts
    │   └── DividerWidget.ts
    └── form/
        ├── index.ts
        ├── FormInputWidget.ts
        ├── FormTextareaWidget.ts
        ├── FormSelectWidget.ts
        ├── FormCheckboxWidget.ts
        └── FormRadioWidget.ts
```

## 辅助函数

| 函数 / 常量 | 说明 |
|-------------|------|
| `getAllWidgetMetas()` | 返回所有 WidgetMeta 数组 |
| `getDefaultComponentMap()` | 构建 `Record<string, Component>` 映射 |
| `registerAllWidgets(engine)` | 批量注册所有物料元信息到 engine.registry |
| `getWidgetsByGroup(group)` | 按分组过滤 WidgetDefinition |
| `allWidgetDefinitions` | 所有 WidgetDefinition 数组 |
| `widgetGroups` | 分组配置数组 |

## CSS Class 命名

```
.dc-widget-text
.dc-widget-button / .dc-widget-button--small / --medium / --large
.dc-widget-image
.dc-widget-link
.dc-widget-divider / .dc-widget-divider--horizontal / --vertical
.dc-widget-form-input / __label / __field / __required
.dc-widget-form-textarea / __label / __field / __required
.dc-widget-form-select / __label / __field / __required
.dc-widget-form-checkbox / __input / __label
.dc-widget-form-radio / __label / __group / __item
```

## 与其他包协作

- `@dragcraft/core`：依赖 WidgetMeta、DesignerEngine 类型。
- `@dragcraft/widgets`：依赖 WidgetDefinition、WidgetGroupConfig 类型。
- `@dragcraft/designer`：通过 `widgetMetas` 和 `componentMap` 选项传入。

## 约束

- 所有组件使用 `defineComponent` + `h()` render 函数。
- 不引入第三方 UI 库，全部使用原生 HTML 元素。
- formSchema 遵循 form-generator 的 FormSchema 运行时结构但不引入其类型。

## 无头设计（Headless Design）

本包采用无头组件模式：所有组件仅输出语义化 BEM CSS 类名（`dc-*`），不捆绑任何 CSS 样式文件。

视觉样式由独立的 `@dragcraft/themes` 包提供。
