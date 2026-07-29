---
description: "通过 @dragcraft/designer 使用 FormSchema、字段 adapter、联动、验证和自定义字段接口。"
---

# 表单与字段

属性面板根据 `FormSchema` 渲染字段，并把 change 翻译成页面命令。

字段、默认绑定和 `bindTo` 的完整接入过程见 [添加物料、字段和页面设置](/guide/learn/material-and-property-panel)。

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
| `FieldRenderFactory` | 渲染当前表单专用的内容或操作区。 |
| `TypedFormSchema` | 结合字段 adapter 的 props map 提供 schema 类型提示。 |
| `useFormGeneratorContext()` | 为嵌套字段读取字段映射和表单状态。 |
| `useFormValidation()` | 在独立表单中读取并触发字段验证。 |
| `resolveFieldComponentProps()` | 解析动态 props 和国际化选项。 |

函数形式的 `FieldSchema.component` 总是 render factory。可复用 Vue 组件应先注册到 `FieldComponentMap`，再通过字符串键引用。
