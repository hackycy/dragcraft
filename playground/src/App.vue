<script setup lang="ts">
import type { DesignerExtensions, DesignerInstance, MaterialDefinition } from '@dragcraft/designer'
import type { Component } from 'vue'
import { createDesigner, DcDesigner } from '@dragcraft/designer'
import {
  BUILT_IN_DEVICE_FRAMES,
  DevicePicker,
  IPHONE_DEVICE_FRAME,
} from '@dragcraft/device-frames'
import { Modal } from 'ant-design-vue'
import { computed, h, onBeforeUnmount, ref } from 'vue'
import { buildPlaygroundFieldComponentMap } from './components/fields'
import PlaygroundHeader from './components/PlaygroundHeader.vue'
import { playgroundMaterials } from './components/widgets'
import { playgroundWidgetMessages } from './components/widgets/messages'
import { globalConfigSchema } from './config/global-config-schema'
import { templateRegistry } from './config/templates'
import { useTemplateSwitch } from './composables/useTemplateSwitch'
import SchemaIOModal from './shared/SchemaIOModal.vue'
import { useSchemaIO } from './shared/use-schema-io'

const activeDeviceFrameId = ref(IPHONE_DEVICE_FRAME.id)
const activeDeviceFrame = computed(() => BUILT_IN_DEVICE_FRAMES.find(
  definition => definition.id === activeDeviceFrameId.value,
) ?? IPHONE_DEVICE_FRAME)
const activeContainerShell = computed(() => activeDeviceFrame.value.containerShell)

function selectDeviceFrame(id: string) {
  if (BUILT_IN_DEVICE_FRAMES.some(definition => definition.id === id))
    activeDeviceFrameId.value = id
}

function renderMaterialIcon(icon: Component | string | undefined) {
  if (!icon)
    return null
  return h('span', { class: 'pg-material-card__icon' }, [
    typeof icon === 'string' ? icon : h(icon, { size: 18, color: 'currentColor' }),
  ])
}

let translatePlayground = (key: string, fallback?: string) => fallback ?? key

const materialItemRenderer: DesignerExtensions['materialItemRenderer'] = ({ material }) => h('div', {
  class: 'pg-material-card',
}, [
  renderMaterialIcon(material.panel?.icon),
  h('span', { class: 'pg-material-card__title' }, material.panel?.titleKey
    ? translatePlayground(material.panel.titleKey, material.panel.title ?? material.type)
    : material.panel?.title ?? material.type),
])

interface ConfirmModalOptions {
  title: string
  content: string
  okText?: string
  okType?: 'primary' | 'danger'
}

function confirmWithModal(options: ConfirmModalOptions): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false
    const settle = (value: boolean) => {
      if (settled)
        return
      settled = true
      resolve(value)
    }
    Modal.confirm({
      title: options.title,
      content: options.content,
      okText: options.okText ?? '确定',
      cancelText: '取消',
      okType: options.okType,
      onOk: () => settle(true),
      onCancel: () => settle(false),
      afterClose: () => settle(false),
    })
  })
}

function createPlaygroundDesigner(schema: unknown): DesignerInstance {
  return createDesigner({
    schema,
    materials: playgroundMaterials as readonly MaterialDefinition[],
    containerShell: activeContainerShell,
    fieldComponentMap: buildPlaygroundFieldComponentMap((key, fallback) => translatePlayground(key, fallback)),
    globalConfigSchema,
    maxHistoryEntries: 50,
    messages: playgroundWidgetMessages,
    confirmAuthoringAction: request => confirmWithModal({
      title: request.action === 'remove' ? '确认删除' : '确认操作',
      content: request.action === 'remove'
        ? '删除后可通过撤销恢复，是否继续？'
        : '此操作需要确认，是否继续？',
      okText: request.action === 'remove' ? '删除' : '继续',
      okType: request.action === 'remove' ? 'danger' : 'primary',
    }),
    extensions: { materialItemRenderer },
  })
}

const designer = createPlaygroundDesigner(templateRegistry[0].schema)
translatePlayground = designer.localization.translate
const exportSchema = () => designer.exportSchema()
const importSchema = (schema: unknown) => designer.importSchema(schema)

const templateSwitch = useTemplateSwitch({
  importSchema,
  exportSchema,
  confirmSwitch: () => confirmWithModal({
    title: '确认切换模板',
    content: '当前修改将丢失，是否切换？',
    okText: '切换',
  }),
})
const io = useSchemaIO(exportSchema, importSchema)

function toggleLocale() {
  const locale = designer.localization.locale.value
  designer.localization.setLocale(locale === 'zh-CN' ? 'en' : 'zh-CN')
}

onBeforeUnmount(() => designer.dispose())
</script>

<template>
  <div class="playground-root">
    <PlaygroundHeader
      :active-template-id="templateSwitch.activeTemplateId.value"
      :templates="templateSwitch.templates"
      :locale="designer.localization.locale.value"
      @template-switch="templateSwitch.switchTemplate"
      @import-open="io.handleImportOpen()"
      @export-open="io.handleExport()"
      @toggle-locale="toggleLocale"
    >
      <template #preview-controls>
        <DevicePicker
          :definitions="BUILT_IN_DEVICE_FRAMES"
          :model-value="activeDeviceFrameId"
          :translate="designer.localization.translate"
          @update:model-value="selectDeviceFrame"
        />
      </template>
    </PlaygroundHeader>

    <DcDesigner :instance="designer" />

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
