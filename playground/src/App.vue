<script setup lang="ts">
import { createI18n, DcDesigner, designerMessages } from '@dragcraft/designer'
import type { DesignerExtensions, MaterialItemIcon } from '@dragcraft/designer'
import {
  BUILT_IN_DEVICE_FRAMES,
  DevicePicker,
  IPHONE_DEVICE_FRAME,
} from '@dragcraft/device-frames'
import { computed, h, ref } from 'vue'
import PlaygroundHeader from './components/PlaygroundHeader.vue'
import { DECORATION_DEMO_SCHEMA } from './decoration/demo-schema'
import { createDecorationDesigner } from './decoration/designer'
import { createPageBackgroundCssVars } from './decoration/page-background'
import SchemaIOModal from './shared/SchemaIOModal.vue'
import { isFinalDocumentSchema } from './shared/schema-validation'
import { useSchemaIO } from './shared/use-schema-io'

// ── Host-owned Active Device Frame ──────────

const activeDeviceFrameId = ref(IPHONE_DEVICE_FRAME.id)
const hostI18n = createI18n('zh-CN', designerMessages)
const activeDeviceFrame = computed(() =>
  BUILT_IN_DEVICE_FRAMES.find(definition => definition.id === activeDeviceFrameId.value)
  ?? IPHONE_DEVICE_FRAME,
)

function selectDeviceFrame(id: string) {
  if (BUILT_IN_DEVICE_FRAMES.some(definition => definition.id === id))
    activeDeviceFrameId.value = id
}

function renderMaterialIcon(icon: MaterialItemIcon | undefined) {
  if (!icon)
    return null

  return h('span', { class: 'pg-material-card__icon' }, [
    typeof icon === 'string'
      ? icon
      : h(icon, { size: 18, color: 'currentColor' }),
  ])
}

const materialItemRenderer: DesignerExtensions['materialItemRenderer'] = ({
  material,
}) =>
  h('div', {
    class: 'pg-material-card',
  }, [
    renderMaterialIcon(material.icon),
    h('span', { class: 'pg-material-card__title' }, material.title),
  ])

// ── Create designer instance ─────────────────

// 初始画布用示例装修 schema（14 个物料各出现一次）；空画布仍由 createEmptyDocumentSchema() 提供，
// 见 decoration/designer.ts 的默认参数。
const designer = createDecorationDesigner(DECORATION_DEMO_SCHEMA)

/**
 * 页面背景：prod 在它的 `index.vue` 里把 `globalConfig.background` 翻译成 CSS 自定义属性，
 * 再由样式覆盖画布的 surface 元素（**不写 `page.style.surface`**，保持 `globalConfig` 为唯一真源）。
 * 这里搬的是同一套做法，覆盖规则见 `styles/playground.css`。
 *
 * `designer.document` 是设计器公开的响应式文档状态，所以改全局配置会即时反映到画布。
 */
const pageBackgroundStyle = computed(() => {
  const state = designer.document.value

  return createPageBackgroundCssVars(
    state.status === 'rejected' ? undefined : state.schema.globalConfig.background,
  )
})

const io = useSchemaIO({
  exportSchema: designer.exportSchema,
  importSchema: designer.importSchema,
  invalidSchemaMessage: '无效的 Schema 格式：缺少 version、globalConfig、page、nodes 或 structure 字段',
  isValidSchema: isFinalDocumentSchema,
})
</script>

<template>
  <div class="playground-root" :style="pageBackgroundStyle">
    <PlaygroundHeader
      @import-open="io.handleImportOpen()"
      @export-open="io.handleExport()"
    >
      <template #preview-controls>
        <DevicePicker
          :definitions="BUILT_IN_DEVICE_FRAMES"
          :model-value="activeDeviceFrameId"
          :translate="hostI18n.t"
          @update:model-value="selectDeviceFrame"
        />
      </template>
    </PlaygroundHeader>

    <DcDesigner :instance="designer" :device-frame="activeDeviceFrame" />

    <!-- Import / Export Modals -->
    <SchemaIOModal
      :show-export-modal="io.showExportModal.value"
      :show-import-modal="io.showImportModal.value"
      :export-json="io.exportJson.value"
      :import-json="io.importJson.value"
      :import-error="io.importError.value"
      @update:show-export-modal="io.showExportModal.value = $event"
      @update:show-import-modal="io.showImportModal.value = $event"
      @update:import-json="io.importJson.value = $event"
      @copy="io.handleCopyExport()"
      @import-confirm="io.handleImportConfirm()"
    />
  </div>
</template>

<style scoped>
.playground-root {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  container-type: inline-size;
}
</style>
