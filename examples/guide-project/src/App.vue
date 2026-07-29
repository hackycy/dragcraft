<script setup lang="ts">
import type { DesignerSchema } from '@dragcraft/designer'
import {
  DcDesigner,
  EventName,
  useDesigner,
} from '@dragcraft/designer'
import {
  BUILT_IN_DEVICE_FRAMES,
  DevicePicker,
  IPHONE_DEVICE_FRAME,
} from '@dragcraft/device-frames'
import { computed, onBeforeUnmount, ref } from 'vue'
import { createPageDesigner } from './editor/create-page-designer'
import { createMemoryPageRepository, PageRevisionConflictError } from './host/page-repository'
import { guideRuntimeRegistry, RuntimePage } from './runtime'

const pageId = 'summer-campaign'
const activeDeviceFrameId = ref(IPHONE_DEVICE_FRAME.id)
const activeDeviceFrame = computed(() =>
  BUILT_IN_DEVICE_FRAMES.find(definition => definition.id === activeDeviceFrameId.value)
  ?? IPHONE_DEVICE_FRAME,
)
const activeContainerShell = computed(() => activeDeviceFrame.value.containerShell)

function selectDeviceFrame(id: string) {
  if (BUILT_IN_DEVICE_FRAMES.some(definition => definition.id === id))
    activeDeviceFrameId.value = id
}
const designer = createPageDesigner({ containerShell: activeContainerShell })
const { canRedo, canUndo, exportSchema, redo, schema, undo } = useDesigner(designer)
const repository = createMemoryPageRepository()
const revision = ref(0)
const status = ref('尚未保存')
const showPreview = ref(false)
const runtimeSchema = computed(() => schema.value as unknown as DesignerSchema)

async function saveDraft() {
  try {
    const page = await repository.save({
      id: pageId,
      revision: revision.value,
      schema: exportSchema(),
    })
    revision.value = page.revision
    status.value = `草稿修订号 ${page.revision} 已保存`
  }
  catch (error) {
    status.value = error instanceof PageRevisionConflictError
      ? '草稿已被其他编辑会话更新，请重新加载'
      : '保存草稿失败'
  }
}

async function reloadDraft() {
  const page = await repository.load(pageId)
  if (!page) {
    status.value = '还没有可加载的草稿'
    return
  }

  const result = designer.engine.importSchema(page.schema)
  if (!result.ok) {
    status.value = `草稿校验失败：${result.diagnostics.map(item => item.code).join(', ')}`
    return
  }

  revision.value = page.revision
  status.value = `已加载草稿修订号 ${page.revision}`
}

function markDraftChanged() {
  status.value = '有未保存的更改'
}

designer.engine.eventHub.on(EventName.SCHEMA_CHANGED, markDraftChanged)
onBeforeUnmount(() => {
  designer.engine.eventHub.off(EventName.SCHEMA_CHANGED, markDraftChanged)
  designer.dispose()
})
</script>

<template>
  <div class="guide-project">
    <header class="guide-project__header">
      <div>
        <strong>活动页编辑器</strong>
        <span>{{ status }}</span>
      </div>
      <div class="guide-project__controls">
        <DevicePicker
          :definitions="BUILT_IN_DEVICE_FRAMES"
          :model-value="activeDeviceFrameId"
          :translate="designer.i18n.t"
          @update:model-value="selectDeviceFrame"
        />
        <button type="button" @click="saveDraft">保存草稿</button>
        <button type="button" @click="reloadDraft">加载草稿</button>
        <button type="button" :disabled="!canUndo()" @click="undo">撤销</button>
        <button type="button" :disabled="!canRedo()" @click="redo">重做</button>
        <button type="button" @click="showPreview = !showPreview">
          {{ showPreview ? '返回编辑' : '查看运行时' }}
        </button>
      </div>
    </header>

    <DcDesigner v-if="!showPreview" :instance="designer" />
    <section v-else class="guide-project__preview">
      <RuntimePage
        :schema="runtimeSchema"
        :registry="guideRuntimeRegistry"
      />
    </section>
  </div>
</template>
