<script setup lang="ts">
import type { DesignerSchema } from '@dragcraft/designer'
import {
  DcDesigner,
  useDesigner,
} from '@dragcraft/designer'
import {
  DevicePicker,
} from '@dragcraft/device-frames'
import { computed, onBeforeUnmount, ref } from 'vue'
import { guideComponentMap } from './domain/widgets'
import { createPageDesigner } from './editor/create-page-designer'
import { useDeviceFrame } from './host/use-device-frame'
import { usePageDraft } from './host/use-page-draft'
import { guideRuntimeContainerMap, RuntimePage } from './runtime'

const pageId = 'summer-campaign'
const deviceFrame = useDeviceFrame()
const designer = createPageDesigner({ containerShell: deviceFrame.activeContainerShell })
const { schema } = useDesigner(designer)
const draft = usePageDraft(designer, pageId)
const showPreview = ref(false)
const runtimeSchema = computed(() => schema.value as unknown as DesignerSchema)

onBeforeUnmount(designer.dispose)
</script>

<template>
  <div class="guide-project">
    <header class="guide-project__header">
      <div>
        <strong>活动页编辑器</strong>
        <span>{{ draft.status }}</span>
      </div>
      <div class="guide-project__controls">
        <DevicePicker
          :definitions="deviceFrame.definitions"
          :model-value="deviceFrame.activeDeviceFrameId.value"
          :translate="designer.i18n.t"
          @update:model-value="deviceFrame.selectDeviceFrame"
        />
        <button type="button" @click="draft.saveDraft">保存草稿</button>
        <button type="button" @click="draft.reloadDraft">加载草稿</button>
        <button type="button" @click="showPreview = !showPreview">
          {{ showPreview ? '返回编辑' : '查看运行时' }}
        </button>
      </div>
    </header>

    <DcDesigner v-if="!showPreview" :instance="designer" />
    <section v-else class="guide-project__preview">
      <RuntimePage
        :schema="runtimeSchema"
        :component-map="guideComponentMap"
        :container-map="guideRuntimeContainerMap"
      />
    </section>
  </div>
</template>
