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

如果你要继续看字段组件是怎么接进来的，下一页就是更直接的入口。关于 form-generator，目前知道这些就够了。准备好之后，继续阅读 [物料与字段](/guide/materials-and-fields)。
