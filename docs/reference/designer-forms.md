---
description: "通过 @dragcraft/designer 使用 FormSchema、字段 adapter、联动、验证和自定义字段接口。"
---

# 表单与字段

属性面板根据 `FormSchema` 渲染字段，并把 change 翻译成页面 `AuthoringAction`。

```ts
import type {
  FieldComponentDefinition,
  FieldComponentMap,
  FormSchema,
  TypedFormSchema,
} from '@dragcraft/designer'
import {
  resolveFieldComponentProps,
  useFormGeneratorContext,
  useFormValidation,
} from '@dragcraft/designer'
```

| 入口 | 用途 |
| --- | --- |
| `FormSchema`、`FieldSchema` | 描述 section、字段、联动与绑定位置。 |
| `FieldComponentMap` | 将稳定字段键映射为真实 Vue 控件。 |
| `FieldComponentDefinition` | 定义控件的 model prop、事件与值转换。 |
| `FieldRenderFactory` | 渲染当前表单专用的控件内容。 |
| `FieldLabelRenderer` | 为字段标签渲染任意 Vue 内容，或返回空内容省略标签。 |
| `FieldPresentationContext` | 标签与辅助说明回调可读取的只读字段状态和翻译函数。 |
| `TypedFormSchema` | 结合字段 adapter 的 props map 提供 schema 类型提示。 |
| `useFormGeneratorContext()` | 为嵌套字段读取字段映射和表单状态。 |
| `useFormValidation()` | 在独立表单中读取并触发字段验证。 |
| `resolveFieldComponentProps()` | 解析动态 props 和国际化选项。 |

函数形式的 `FieldSchema.component` 总是 render factory。可复用 Vue 组件应先注册到 `FieldComponentMap`，再通过字符串键引用。

无论控件内容来自 adapter 还是 render factory，字段都按 `label -> control -> help-message -> error` 编排。`label` 可以省略、使用空字符串，或通过 renderer 返回空内容；没有有效标签时不会生成 label 节点。`labelKey` 仅翻译静态标签，自定义标签可通过 `FieldPresentationContext.t()` 翻译。

`helpMessage` 是始终可见的纯文本说明，可直接给出字符串，或接收 `FieldPresentationContext` 后动态返回字符串；空结果不会生成节点。旧的 `tooltip` 已移除，请迁移到 `helpMessage`。

字段未声明 `bindTo` 时，Widget 表单写入 `props.{key}`，Global 表单写入 `globalConfig.{key}`。编辑节点样式、页面 surface 或容器 variant 时使用显式绑定。页面 surface 的绑定作用域是 `schema`，例如 `root.style.surface.backgroundColor`。

`ifShow`（旧别名为 `visible`）、`show`、`disabled`、`dependencies`、`parseValue`、`valueFormat` 和 `rules` 的选择标准及数据流见 [表单与字段](/guide/customization/forms-and-fields)。表单验证服务编辑体验，保存与发布服务仍需重新校验。
