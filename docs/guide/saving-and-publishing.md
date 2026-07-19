# 保存草稿与发布

dragcraft 管理编辑会话中的 Schema；草稿、发布和权限由业务宿主负责。先监听 Schema 变化并保存草稿：

```ts
import { EventName, useDesigner } from '@dragcraft/designer'
import { onBeforeUnmount, ref } from 'vue'

const { exportSchema, on, off } = useDesigner(designer)
const dirty = ref(false)
const saving = ref(false)
let revision = initialPage.revision

const markDirty = () => { dirty.value = true }
on(EventName.SCHEMA_CHANGED, markDirty)
onBeforeUnmount(() => off(EventName.SCHEMA_CHANGED, markDirty))

async function saveDraft() {
  saving.value = true
  try {
    const result = await pageApi.saveDraft({
      id: initialPage.id,
      revision,
      schema: exportSchema(),
    })
    revision = result.revision
    dirty.value = false
  }
  finally {
    saving.value = false
  }
}
```

`schema:changed` 只在命令成功写入 Schema 后触发，因此它适合驱动保存按钮、脏状态和离开页面提醒。`exportSchema()` 返回快照，保存过程不会持有或修改设计器内部状态。

## 把保存状态放在宿主页面

保存按钮通常属于业务应用的页面头部，而不是 dragcraft 的默认三栏 shell：

```vue
<template>
  <PageHeader>
    <span v-if="dirty">未保存</span>
    <button :disabled="saving || !dirty" @click="saveDraft">保存草稿</button>
    <button :disabled="saving || dirty" @click="publish">发布</button>
  </PageHeader>
  <DcDesigner :instance="designer" />
</template>
```

这让页面 ID、权限、保存提示和路由离开确认保持在业务路由层。画布悬浮区只服务编辑交互，保存和发布按钮始终由宿主顶栏持有。

## 处理冲突和发布

服务端应把 `revision` 当作乐观锁。请求返回冲突时，不要静默覆盖他人的草稿；提示用户重新加载或显式比较后再保存。

```ts
async function publish() {
  await saveDraft()
  await pageApi.publish({ id: initialPage.id, revision })
}
```

推荐由服务端从已保存的草稿创建不可变发布版本，而不是让浏览器直接写入线上版本。发布前的字段校验、物料白名单、资源可访问性、审核与权限检查也必须在服务端完成。

> [!WARNING]
> 不要在每次 `schema:changed` 时无节流地直接请求 API。自动保存时应由宿主加防抖、单请求队列与失败重试策略，并保留用户可见的“未保存”状态。

发布后的 Schema 如何由生产运行时消费，见 [运行时集成边界](/guide/runtime-integration)。
