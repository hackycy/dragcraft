<script setup lang="ts">
import type { DesignerSchema } from '@dragcraft/designer'
import {
  DcDesigner,
  useDesigner,
} from '@dragcraft/designer'
import {
  BUILT_IN_DEVICE_FRAMES,
  DevicePicker,
  IPHONE_DEVICE_FRAME,
} from '@dragcraft/device-frames'
import { computed, onBeforeUnmount, ref } from 'vue'
import { guideComponentMap } from './domain/widgets'
import { createPageDesigner } from './editor/create-page-designer'
import { createMemoryPageRepository } from './host/page-repository'
import { guideRuntimeContainerMap, RuntimePage } from './runtime'

const pageId = 'summer-campaign'
// #region tutorial-device-frame
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
// #endregion tutorial-device-frame
const designer = createPageDesigner({ containerShell: activeContainerShell })
const { exportSchema, schema } = useDesigner(designer)
// #region tutorial-save-and-preview
const repository = createMemoryPageRepository()
const revision = ref(0)
const status = ref('尚未保存')
const showPreview = ref(false)
const runtimeSchema = computed(() => schema.value as unknown as DesignerSchema)

async function saveDraft() {
  const page = await repository.save({
    id: pageId,
    revision: revision.value,
    schema: exportSchema(),
  })
  revision.value = page.revision
  status.value = `已保存版本 ${page.revision}`
}

async function reloadDraft() {
  const page = await repository.load(pageId)
  if (!page) {
    status.value = '还没有可加载的草稿'
    return
  }

  const result = designer.engine.importSchema(page.schema)
  if (!result.ok) {
    status.value = '草稿没有通过当前物料注册表校验'
    return
  }

  revision.value = page.revision
  status.value = `已加载版本 ${page.revision}`
}

onBeforeUnmount(() => designer.dispose())
// #endregion tutorial-save-and-preview
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
        <button type="button" @click="showPreview = !showPreview">
          {{ showPreview ? '返回编辑' : '查看运行时' }}
        </button>
      </div>
    </header>

    <!-- #region tutorial-designer-mount -->
    <DcDesigner v-if="!showPreview" :instance="designer" />
    <!-- #endregion tutorial-designer-mount -->
    <section v-else class="guide-project__preview">
      <RuntimePage
        :schema="runtimeSchema"
        :component-map="guideComponentMap"
        :container-map="guideRuntimeContainerMap"
      />
    </section>
  </div>
</template>
