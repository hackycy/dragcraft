# 物料、字段与工具包

本章覆盖 `@dragcraft/widgets`、字段组件契约、`@dragcraft/icons` 和 `@dragcraft/utils`。

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

Widget 定义由元信息和 Vue 组件组成：

```ts
interface WidgetDefinition {
  meta: WidgetMeta
  component: Component
}
```

工具函数：

| 函数 | 说明 |
| --- | --- |
| `registerWidgets(engine, definitions)` | 批量注册 widget meta 到 engine registry |
| `buildComponentMap(definitions)` | 从 definitions 构建组件映射 |
| `getWidgetMetas(definitions)` | 提取所有 WidgetMeta |
| `filterByGroup(definitions, group)` | 按分组过滤 WidgetDefinition |

## 物料实现位置

仓库不再提供可发布的默认物料实现包。业务应用直接维护自己的 `WidgetDefinition[]`，并通过 `@dragcraft/widgets` 的工具函数生成注册数据。

```ts
import { buildComponentMap, getWidgetMetas } from '@dragcraft/widgets'

const designer = createDesigner({
  widgetMetas: getWidgetMetas(myWidgetDefinitions),
  componentMap: buildComponentMap(myWidgetDefinitions),
})
```

playground 作为本仓库的产品级示例，在 `playground/src/components/widgets` 中维护面向小程序装修场景的本地物料：

- 基础展示：文本、按钮、图片、链接、分割线、轮播。
- 表单交互：输入框、多行文本、下拉选择、复选框、单选组。
- 小程序框架：导航栏、Tab 栏、浮动按钮。

实现约束：

- package 层只定义协议与工具，不承载具体物料。
- 物料 `formSchema` 遵循 form-generator 的运行时结构。
- 业务应用负责维护物料组件、样式和多语言文案。

## 字段组件契约

`@dragcraft/form-generator` 不内置字段组件。业务应用传入 `FieldComponentMap`，每个字段组件实现统一契约：

| Prop / Event | 说明 |
| --- | --- |
| `modelValue` | 当前字段值 |
| `disabled` | 字段禁用态 |
| `field` | 完整 FieldSchema，包含解析后的 `field.props` |
| `update:modelValue` | 字段值变更事件 |

playground 在 `playground/src/components/fields` 中用 Ant Design Vue 维护本地字段适配器，覆盖 `input`、`number`、`textarea`、`select`、`switch`、`color`、`slider`、`array` 和业务字段。

字段组件可以读取：

- `field.props`：控件配置，例如 placeholder、options、min、max、rows。
- `field.placeholderKey`：placeholder 多语言 key。
- `field.optionKeyPrefix`：选项多语言 key 前缀。

## Icons 包

`@dragcraft/icons` 提供 Vue render function 形式的 SVG 图标组件，供 designer 和 device-frames 等包消费。

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
