---
description: "@dragcraft/ui 提供的共享滚动区域组件 API。"
---

# @dragcraft/ui

`@dragcraft/ui` 当前公开 `DcScrollArea`。它用于需要统一原生滚动 viewport 和主题 token 的 Designer、Device Frame 或宿主扩展。

```vue
<script setup lang="ts">
import { DcScrollArea } from '@dragcraft/ui'
</script>

<template>
  <DcScrollArea class="my-panel">
    <slot />
  </DcScrollArea>
</template>
```

## 公开入口

| 入口 | 用途 |
| --- | --- |
| `DcScrollArea` | 提供纵向原生滚动 viewport 与覆盖层滚动条。 |
| `ScrollAreaProps` | 描述滚动显示策略、隐藏延迟和事件。 |
| `ScrollAreaType` | 限定 `hover`、`scroll`、`auto`、`always` 四种显示策略。 |

`ScrollAreaProps` 和 `ScrollAreaType` 描述可用 props。默认主题与 Device Frame 样式已经消费相同的 `--dc-scroll-area-*` token。

它不是 Designer 状态管理入口。自定义面板仍应通过 `useDesignerContext()` 读取工作台上下文，并通过公开命令或字段绑定写入页面。

继续阅读 [面板与画布](/guide/customization/panels-and-canvas)。
