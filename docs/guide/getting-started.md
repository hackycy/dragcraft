# 快速开始

你会在这一页完成一件事：把 `@dragcraft/designer` 渲染出来。

先看一个最小示例：

```ts
import '@dragcraft/themes/antd'
import { createDesigner, DcDesigner } from '@dragcraft/designer'
import { createAntDesignVueFields } from '@dragcraft/fields-ant-design-vue'

const designer = createDesigner({
  widgetMetas: myWidgetMetas,
  componentMap: myComponentMap,
  fieldComponentMap: createAntDesignVueFields(),
  globalConfigSchema: myGlobalConfigSchema,
})
```

上面的 `createDesigner()` 负责把 core、renderer 和 form-generator 组装起来。`DcDesigner` 是最终挂载到页面上的 Vue 组件。

## 安装依赖

```bash
pnpm add @dragcraft/designer @dragcraft/themes @dragcraft/fields-ant-design-vue ant-design-vue vue
```

如果你想直接得到完整视觉样式，导入 `@dragcraft/themes`。如果你准备完全自定义样式，也可以先不导入主题。

## 挂载设计器

```vue
<script setup lang="ts">
import '@dragcraft/themes/antd'
import { createDesigner, DcDesigner } from '@dragcraft/designer'
import { createAntDesignVueFields } from '@dragcraft/fields-ant-design-vue'

const designer = createDesigner({
  widgetMetas: myWidgetMetas,
  componentMap: myComponentMap,
  fieldComponentMap: createAntDesignVueFields(),
  globalConfigSchema: myGlobalConfigSchema,
})
</script>

<template>
  <DcDesigner :instance="designer" />
</template>
```

关于最小接入，现在知道这些就够了。准备好之后，继续阅读 [核心心智模型](/guide/mental-model)。
