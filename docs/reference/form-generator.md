---
description: "@dragcraft/form-generator 的 FormSchema、字段 adapter、联动、验证和 render factory 公开 API。"
---

# @dragcraft/form-generator

Form Generator 根据 `FormSchema` 渲染字段并发出 change 事件。它不依赖 Core，也不直接修改页面。

```vue
<FormGenerator
  :schema="schema"
  :values="values"
  :field-component-map="fieldComponentMap"
  @change="handleChange"
/>
```

## 公开入口

| 入口 | 用途 |
| --- | --- |
| `FormSchema`、`FieldSchema` | 描述 section、字段与绑定提示。 |
| `FieldComponentMap` | 将稳定字段键映射为真实 Vue 控件。 |
| `FieldRenderFactory` | 渲染当前表单专用的内容或操作区。 |
| `useFormValidation()` | 在独立表单中读取和触发校验。 |
| `resolveFieldComponentProps()` | 解析 adapter 与字段 props。 |

函数形式的 `FieldSchema.component` 总是 render factory。要使用函数式 Vue 组件，先把它注册到 `FieldComponentMap`，再用字符串键引用。

字段的 `bindTo` 由使用它的宿主解释；在标准 Designer 中，它会翻译成内置命令。继续阅读 [表单与字段](/guide/customization/forms-and-fields)。
