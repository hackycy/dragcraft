# 物料、字段与工具包

本章覆盖 `@dragcraft/widgets`、字段 adapter、内置字段包、`@dragcraft/icons` 和 `@dragcraft/utils`。

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
interface WidgetDefinition<Meta extends WidgetMeta = WidgetMeta> {
  meta: Meta
  component: Component
}
```

`WidgetMeta.defaultStyle` 使用 core 的 scoped style DSL：

```ts
const meta: WidgetMeta = {
  type: 'banner',
  title: 'Banner',
  group: 'basic',
  defaultProps: {},
  defaultStyle: {
    container: { marginTop: 0 },
    content: { color: '#1f1f1f' },
  },
  formSchema: { sections: [] },
}
```

物料希望暴露外层盒子样式时，表单字段应通过 `bindTo: { scope: 'node', path: 'style.container.*' }` 写入 schema，而不是把这些值塞进业务 props 后再由组件自行模拟。

工具函数：

| 函数 | 说明 |
| --- | --- |
| `registerWidgets(engine, definitions)` | 批量注册 widget meta 到 engine registry |
| `buildComponentMap(definitions)` | 从 definitions 构建组件映射 |
| `getWidgetMetas(definitions)` | 提取所有 WidgetMeta |
| `filterByGroup(definitions, group)` | 按分组过滤 WidgetDefinition |
| `defineContainerWidget(definition)` | 保留带 `ContainerDefinition` 的外部容器 meta 类型推断 |

## 外部容器物料

容器不是框架内置 flex/grid 协议。外部物料使用 `defineContainerWidget()` 注册 variants、regions、constraints、`canPlace`、`migrateVariant` 和 renderer drop adapter，并在自己的组件与 CSS 中实现 DOM 和几何。框架 package 不定义 flex/grid geometry。

变体表单字段使用容器作用域绑定：

```ts
{
  key: 'variant',
  label: '布局变体',
  component: 'Select',
  bindTo: { scope: 'container', path: 'variant' },
}
```

当前 playground 的 `container.ts` 同时展示单区域 flex 和三 region/双 variant 异形容器；迁移函数由物料负责重新分配普通子节点，插入索引函数由物料根据自己的轴和 DOM 几何计算。

## 物料实现位置

仓库不再提供可发布的默认物料实现包。业务应用直接维护自己的 `WidgetDefinition[]`，并通过 `@dragcraft/widgets` 的工具函数生成注册数据。

```ts
import { buildComponentMap, getWidgetMetas } from '@dragcraft/widgets'

const designer = createDesigner({
  widgetMetas: getWidgetMetas(myWidgetDefinitions),
  componentMap: buildComponentMap(myWidgetDefinitions),
})
```

接入设计器时，业务物料可以把 meta 声明为 `DesignerWidgetMeta`，通过 `material` 字段描述物料栏展示形态与搜索语义；该字段不会进入 core schema：

```ts
const meta: DesignerWidgetMeta = {
  type: 'banner',
  title: 'Banner',
  group: 'basic',
  material: {
    icon: BannerIcon,
    description: '活动、商品或内容横幅',
    tags: ['营销'],
    keywords: ['campaign', 'hero'],
  },
  defaultProps: {},
  formSchema: { sections: [] },
}
```

playground 作为本仓库的产品级示例，在 `playground/src/components/widgets` 中维护面向小程序装修场景的本地物料：

- 布局容器：外部单区域 flex、三分区双变体异形容器。
- 基础展示：文本、按钮、图片、链接、分割线、轮播。
- 表单交互：输入框、多行文本、下拉选择、复选框、单选组。
- 小程序框架：导航栏、Tab 栏、浮动按钮。

实现约束：

- package 层只定义协议与工具，不承载具体物料。
- 物料 `formSchema` 遵循 form-generator 的运行时结构。
- 业务应用负责维护物料组件、样式和多语言文案。

## 字段 Adapter 与内置字段包

`@dragcraft/form-generator` 不直接依赖具体 UI 库。业务应用传入 `FieldComponentMap`，其中每一项是一个 `FieldComponentDefinition`，用于声明真实 UI 组件和值绑定方式：

| 字段 | 说明 |
| --- | --- |
| `component` | 真实 Vue UI 组件 |
| `modelPropName` | UI 组件接收当前值的 prop，默认 `modelValue` |
| `updateEventName` | UI 组件更新值的事件 prop，默认 `onUpdate:modelValue` |
| `defaultProps` | adapter 默认 props |
| `formatValue` | model 到 UI 组件值的转换 |
| `normalizeValue` | UI 组件值到 model 的转换 |

字段 schema 使用 `componentProps` 传递 UI 库原始 props：

```ts
{
  key: 'title',
  label: '标题',
  component: 'Input',
  componentProps: {
    placeholder: '请输入标题',
    allowClear: true,
  },
}
```

### @dragcraft/fields-ant-design-vue

`@dragcraft/fields-ant-design-vue` 提供 Ant Design Vue 字段 adapter：

- 导出 `createAntDesignVueFields()` 与 `antDesignVueFieldComponents`。
- 内置 `Input`、`InputNumber`、`Textarea`、`Select`、`Switch`、`Slider`、`Radio`、`RadioGroup`、`Checkbox`、`CheckboxGroup`、`Cascader`、`DatePicker`、`RangePicker`、`TimePicker`、`TreeSelect`、`Rate`、`AutoComplete`、`Mentions`。
- 导出 `AntDesignVueFieldComponentPropsMap`，可与 `TypedFormSchema<PropsMap>` 联动获得 `componentProps` 类型提示。

playground 在 `playground/src/components/fields` 中组合 `createAntDesignVueFields()` 与本地业务字段，业务字段包括 `Color`、`Spacing`、`Array`、`NavbarTitle`。`Spacing` 通过 `bindTo` 直接编辑节点容器的四边 margin 或 padding，并支持四边值联动。

字段多语言辅助仍由 form-generator 处理：

- `field.placeholderKey`：覆盖 `componentProps.placeholder` 的多语言 key。
- `field.optionKeyPrefix`：覆盖 `componentProps.options[].label` 的多语言 key 前缀。

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
