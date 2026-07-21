---
description: "@dragcraft/form-generator 的 FormSchema 渲染、字段 adapter、render factory 和变更事件 API 参考。"
---

# @dragcraft/form-generator

`@dragcraft/form-generator` 负责根据 `FormSchema` 渲染配置表单。

先看一个最小示例：

```vue
<script setup lang="ts">
import { FormGenerator } from '@dragcraft/form-generator'

const schema = {
  sections: [
    {
      title: '基础信息',
      fields: [
        { key: 'title', label: '标题', component: 'Input' },
      ],
    },
  ],
}

const values = { title: '首页' }

function handleFieldChange(payload: unknown) {
  console.log(payload)
}
</script>

<template>
  <FormGenerator
    :schema="schema"
    :values="values"
    :field-component-map="fieldComponentMap"
    @change="handleFieldChange"
  />
</template>
```

这段代码说明它只做一件事: 根据 schema 渲染字段，并把值变化通过事件抛出来。它不直接依赖 core，也不提交命令；在 dragcraft 的标准接入里，designer 会接住这些变化，再翻译成对应的 `engine.execute()`。

## `FieldSchema.component`

`component` 接受字符串键或 `FieldRenderFactory`：

```ts
type FieldRenderFactory = (ctx: FieldRenderContext) => () => VNodeChild

interface FieldSchema {
  component: string | FieldRenderFactory
}
```

字符串会从 `fieldComponentMap` 解析，并使用对应 adapter 的 model prop、更新事件与值转换。factory 不需要注册，适合只在当前表单出现的标题、分割线、只读说明和轻量操作区。

下面的字段直接渲染一条分割线，不会生成默认 label 和 control：

```ts
import { h } from 'vue'

{
  key: '__basic-divider',
  label: '',
  component: ({ t }) => () =>
    h('div', { class: 'my-form-divider' }, t('form.basic', '基础设置')),
}
```

factory 自己负责完整字段内容，外层仍保留 `visible`、`ifShow`、`show`、`disabled`、`span`、tooltip 和校验错误等字段语义。

::: warning 函数值的解释规则
`component` 中的函数始终按 `FieldRenderFactory` 解释。Vue 函数式组件必须先注册到 `fieldComponentMap`，再通过字符串键使用；需要 JSON 序列化的 FormSchema 也应使用字符串键。
:::

## `FieldRenderContext`

factory 在字段 `setup()` 中执行一次。它收到的计算引用和 `values` 保持响应式，返回的 render 函数可以在每次渲染时读取最新状态。

```ts
interface FieldRenderContext {
  field: ComputedRef<FieldSchema>
  values: Record<string, unknown>
  value: ComputedRef<unknown>
  disabled: ComputedRef<boolean>
  componentProps: ComputedRef<Record<string, unknown>>
  t: (key: string, fallback?: string) => string
  setValue: (value: unknown) => void
  validate: () => void
}
```

| 成员 | 含义 |
| --- | --- |
| `field` | 应用 `dependencies` 覆盖后的当前字段 Schema |
| `values` | 表单当前的响应式值记录 |
| `value` | 应用 `defaultValue` 和 `valueFormat` 后的字段值 |
| `disabled` | 合并表单全局禁用与字段 `disabled` 后的状态 |
| `componentProps` | 解析动态 props、placeholder 和选项国际化后的结果 |
| `t` | 当前表单的国际化函数 |
| `setValue` | 依次执行 `parseValue`、更新本地值、触发 change，并校验当前字段 |
| `validate` | 使用当前字段 Schema 主动执行一次校验 |

具体选择和交互示例见 [配置表单与字段](/guide/forms-and-fields#直接渲染一次性字段内容)。

字段 adapter、Schema 绑定范围和字段联动的接入方式见 [配置表单与字段](/guide/forms-and-fields)。
