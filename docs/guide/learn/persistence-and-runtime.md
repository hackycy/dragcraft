---
description: "将导出的 Schema 保存到宿主仓储、处理版本号，并在业务运行时中只读渲染页面。"
---

# 保存草稿并预览运行时

## 预期结果

编辑历史只覆盖当前浏览器会话。草稿、发布版本、审核和权限属于宿主应用，因此我们先定义一个可替换的仓储接口。

## 前置状态

你已经有可编辑的公告、业务字段和全局页面设置，并且知道要导出 Schema，而不是保存 Vue 组件实例。

## 完整文件

### 保存和加载草稿

`src/host/page-repository.ts`：

<<< ../../../examples/guide-project/src/host/page-repository.ts

`revision` 是乐观锁版本。真实服务应在保存时验证页面归属、物料白名单、资源 URL 和业务字段；内存实现只用于让教程在浏览器中完成闭环。

`src/host/use-page-draft.ts` 把保存和加载操作放在宿主层：

<<< ../../../examples/guide-project/src/host/use-page-draft.ts

保存时使用 `designer.engine.exportSchema()`，加载时使用 `designer.engine.importSchema()`。后者会用当前注册表验证导入内容；失败时不要替换编辑中的 Schema。

同一个页面被另一个会话保存后，旧 revision 会触发 `PageRevisionConflictError`。示例把它显示为“保存冲突：请先加载最新草稿。”，并保持当前编辑内容不变。真实项目通常让用户加载最新草稿、比较差异，再决定是否重新应用本地修改；不要静默覆盖较新的版本。

### 用业务运行时解释 Schema

生产运行时需要自己解释 Schema，尤其是容器的 `regions`：

`src/runtime/RuntimePage.ts`：

<<< ../../../examples/guide-project/src/runtime/RuntimePage.ts

普通节点使用 `componentMap` 渲染。容器节点把递归渲染后的 region VNode 交给业务容器组件，因此业务应用仍拥有 flex、grid 和分栏的实际 DOM 与 CSS。

运行时容器只接收 `variant` 和 `regions`，不使用 `ContainerRegionOutlet` 或 `useContainerRuntime()`：

`src/runtime/RuntimeColumnContainer.ts`：

<<< ../../../examples/guide-project/src/runtime/RuntimeColumnContainer.ts

不要在生产页面复用编辑态 `RootRenderer` 或 `ContainerRegionOutlet`。它们包含选中、拖放和编辑交互。

### 将编辑和预览组合到宿主页面

替换 `src/App.vue`。这个版本只包含已经学习过的草稿和运行时能力；设备选择留到[主题、设备与国际化](/guide/customization/theme-device-and-i18n)。

```vue
<script setup lang="ts">
import type { DesignerSchema } from '@dragcraft/designer'
import { computed, onBeforeUnmount, ref } from 'vue'
import { DcDesigner, useDesigner } from '@dragcraft/designer'
import { createActivityDesigner } from './editor/create-activity-designer'
import { usePageDraft } from './host/use-page-draft'
import {
  activityRuntimeComponentMap,
  activityRuntimeContainerMap,
  RuntimePage,
} from './runtime'

const designer = createActivityDesigner()
const { schema } = useDesigner(designer)
const draft = usePageDraft(designer, 'summer-campaign')
const showPreview = ref(false)
const runtimeSchema = computed(() => schema.value as unknown as DesignerSchema)

onBeforeUnmount(designer.dispose)
</script>

<template>
  <main>
    <button type="button" @click="draft.saveDraft">保存草稿</button>
    <button type="button" @click="draft.reloadDraft">加载草稿</button>
    <button type="button" @click="showPreview = !showPreview">
      {{ showPreview ? '返回编辑' : '查看运行时' }}
    </button>
    <p>{{ draft.status }}</p>
    <DcDesigner v-if="!showPreview" :instance="designer" />
    <RuntimePage
      v-else
      :schema="runtimeSchema"
      :component-map="activityRuntimeComponentMap"
      :container-map="activityRuntimeContainerMap"
    />
  </main>
</template>
```

## 立即可观察行为

保存后重新加载草稿，Schema 与公告状态会恢复。切换预览后，页面只渲染业务组件；草稿冲突会保留当前内容并提示先加载最新版本。

## 设计原因

编辑器负责导出、导入和校验 Schema，宿主负责仓储、revision、发布和最终运行时。这让同一份 Schema 可以在编辑器、审核流程和线上页面中流转，而不会把编辑交互带到生产页面。

## 限制与下一步

内存仓储只用于课程闭环。真实服务还需要做页面归属、物料白名单、资源和权限校验。基础闭环完成后，下一页会把同一份 Schema 的顶层节点安排到不同页面区域。

## 完成检查

保存后重新加载草稿，Schema 与公告状态恢复；使用旧 revision 保存时出现冲突提示且不会覆盖新版本；切换预览时，运行时容器只使用 `variant` 和 `regions`。

下一步：[安排内容、Chrome 和浮层](/guide/learn/page-layout)。
