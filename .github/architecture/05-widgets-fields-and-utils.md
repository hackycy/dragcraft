# 物料、字段与工具包

本章覆盖 `@dragcraft/widgets`、`@dragcraft/builtin-widgets`、`@dragcraft/builtin-fields`、`@dragcraft/icons` 和 `@dragcraft/utils`。

## 物料协议包

`@dragcraft/widgets` 提供物料协议定义与通用工具函数。

目标：

- 定义 `WidgetDefinition`、`WidgetGroupConfig` 等物料协议类型。
- 提供批量注册、构建 ComponentMap、按分组过滤等工具。
- 不包含任何具体物料实现。

设计边界：

- 不依赖 `@dragcraft/form-generator`，`formSchema` 运行时遵循 FormSchema 结构。
- 不依赖 `@dragcraft/renderer`，ComponentMap 由消费方桥接。
- 仅依赖 `@dragcraft/core` 的 `WidgetMeta` 类型和 Vue 的 `Component` 类型。
- 纯协议包，不包含 Vue 组件实现。

文件结构：

```plaintext
src/
├── index.ts
├── types.ts
└── helpers.ts
```

Widget 定义由元信息和 Vue 组件组成：

```ts
interface WidgetDefinition {
  meta: WidgetMeta
  component: Component
}
```

分组由字符串标识，designer 左栏按 `group` 自动聚合：

```ts
type WidgetGroup = string

interface WidgetGroupConfig {
  name: string
  title: string
}
```

工具函数：

| 函数 | 说明 |
| --- | --- |
| `registerWidgets(engine, definitions)` | 批量注册 widget meta 到 engine registry |
| `buildComponentMap(definitions)` | 从 definitions 构建组件映射 |
| `getWidgetMetas(definitions)` | 提取所有 WidgetMeta |
| `filterByGroup(definitions, group)` | 按分组过滤 WidgetDefinition |

## 内置物料包

`@dragcraft/builtin-widgets` 提供 10 个可选内置物料组件。

使用方式：

```ts
import { getAllWidgetMetas, getDefaultComponentMap } from '@dragcraft/builtin-widgets'

const designer = createDesigner({
  widgetMetas: getAllWidgetMetas(),
  componentMap: getDefaultComponentMap(),
})
```

也可以与业务自定义物料混用：

```ts
const widgetMetas = [
  ...getAllWidgetMetas(),
  myCustomWidgetMeta,
]

const componentMap = {
  ...getDefaultComponentMap(),
  'my-custom-widget': MyCustomWidget,
}
```

分组：

| 分组 | 名称 | 说明 |
| --- | --- | --- |
| `basic` | 基础展示 | 文本、按钮、图片、链接、分割线 |
| `form` | 表单交互 | 输入框、多行文本、下拉选择、复选框、单选组 |

内置物料：

| type | 标题 | 主要 props |
| --- | --- | --- |
| `text` | 文本 | `content`, `fontSize`, `fontWeight`, `color`, `textAlign` |
| `button` | 按钮 | `text`, `type`, `disabled`, `size` |
| `image` | 图片 | `src`, `alt`, `objectFit` |
| `link` | 链接 | `text`, `href`, `target`, `color` |
| `divider` | 分割线 | `direction`, `color`, `thickness` |
| `form-input` | 输入框 | `label`, `placeholder`, `value`, `required`, `disabled` |
| `form-textarea` | 多行文本 | `label`, `placeholder`, `value`, `rows`, `required`, `disabled` |
| `form-select` | 下拉选择 | `label`, `placeholder`, `value`, `options`, `required`, `disabled` |
| `form-checkbox` | 复选框 | `label`, `checked`, `disabled` |
| `form-radio` | 单选组 | `label`, `value`, `options`, `direction`, `disabled` |

主要导出：

| 导出 | 说明 |
| --- | --- |
| `getAllWidgetMetas()` | 返回所有内置 WidgetMeta |
| `getDefaultComponentMap()` | 构建默认组件映射 |
| `registerAllWidgets(engine)` | 批量注册所有内置物料 |
| `getWidgetsByGroup(group)` | 按分组过滤内置物料 |
| `allWidgetDefinitions` | 所有内置 WidgetDefinition |
| `widgetGroups` | 内置分组配置 |

实现约束：

- 所有组件使用 `defineComponent` 和 `h()` render function。
- 不引入第三方 UI 库。
- `formSchema` 遵循 form-generator 的运行时结构，但不引入其类型。
- 只输出 BEM class，不捆绑 CSS。

## 内置字段包

`@dragcraft/builtin-fields` 提供 7 个可选内置表单字段组件。

使用方式：

```ts
import { buildDefaultFieldComponentMap } from '@dragcraft/builtin-fields'

const designer = createDesigner({
  fieldComponentMap: buildDefaultFieldComponentMap(),
})
```

也可以混合自定义字段：

```ts
const fieldComponentMap = {
  ...buildDefaultFieldComponentMap(),
  'icon-picker': MyIconPickerField,
  input: MyCustomInput,
}
```

内置字段：

| 组件 | type 字符串 | HTML 元素 | field.props |
| --- | --- | --- | --- |
| `InputField` | `input` | `<input type="text">` | `placeholder` |
| `NumberField` | `number` | `<input type="number">` | `min`, `max`, `step`, `placeholder` |
| `TextareaField` | `textarea` | `<textarea>` | `placeholder`, `rows` |
| `SelectField` | `select` | `<select>` | `options`, `placeholder` |
| `SwitchField` | `switch` | `<input type="checkbox">` | 无 |
| `ColorField` | `color` | `<input type="color">` | 无 |
| `SliderField` | `slider` | `<input type="range">` | `min`, `max`, `step` |

主要导出：

- `buildDefaultFieldComponentMap()`。
- `InputField`。
- `NumberField`。
- `TextareaField`。
- `SelectField`。
- `SwitchField`。
- `ColorField`。
- `SliderField`。

## Icons 包

`@dragcraft/icons` 提供 Vue render function 形式的 SVG 图标组件，供 designer 和 device-frames 等包消费。

当前图标源文件位于：

```plaintext
src/
├── icons/
│   ├── arrow-down.ts
│   ├── arrow-up.ts
│   ├── delete.ts
│   ├── desktop.ts
│   ├── drag.ts
│   ├── laptop.ts
│   ├── nav-back.ts
│   ├── nav-home.ts
│   ├── nav-recent.ts
│   ├── phone.ts
│   ├── plus.ts
│   ├── redo.ts
│   ├── robot.ts
│   ├── signal-bar.ts
│   ├── signal.ts
│   └── undo.ts
├── types.ts
└── index.ts
```

设计约束：

- 组件通过 render function 输出 SVG。
- 支持 size、color、class 等通用属性。
- 不承载业务状态。

## Utils 包

`@dragcraft/utils` 提供跨包复用的纯函数工具。

设计原则：

- 纯函数优先、无副作用。
- 与 UI 框架无关。
- 小而稳定，避免引入领域耦合。

当前能力：

- `clone`：深拷贝工具。
- `event-emitter`：轻量事件分发器。
- `uuid`：节点 ID 生成。

使用约束：

- 可被 core、designer、renderer、form-generator、widgets 等包共同复用。
- 不承载业务语义逻辑，业务逻辑应留在上层包。
