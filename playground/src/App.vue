<script setup lang="ts">
import { createConfirmActionInterceptor, createDesigner, createI18n, DcDesigner, designerMessages } from '@dragcraft/designer'
import type { DesignerExtensions, MaterialItemIcon } from '@dragcraft/designer'
import {
  BUILT_IN_DEVICE_FRAMES,
  DevicePicker,
  IPHONE_DEVICE_FRAME,
} from '@dragcraft/device-frames'
import { Modal } from 'ant-design-vue'
import { computed, defineComponent, h, ref } from 'vue'
import PlaygroundHeader from './components/PlaygroundHeader.vue'
import { buildPlaygroundFieldComponentMap } from './components/fields'
import { IconArrowDown, IconPhone } from './components/icons'
import { playgroundWidgetMessages } from './components/widgets/messages'
import { globalConfigSchema } from './config/global-config-schema'
import { playgroundNextMaterials, playgroundNextTemplates } from './config/next-fixtures'
import { useTemplateSwitch } from './composables/useTemplateSwitch'
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
const activeContainerShell = computed(() => activeDeviceFrame.value.containerShell)

function selectDeviceFrame(id: string) {
  if (BUILT_IN_DEVICE_FRAMES.some(definition => definition.id === id))
    activeDeviceFrameId.value = id
}

// ── Mini-Program Empty State ────────────────────

const MiniProgramEmptyState = defineComponent({
  name: 'MiniProgramEmptyState',
  props: {
    isDragOver: { type: Boolean, default: false },
  },
  setup(props) {
    return () =>
      h('div', {
        class: {
          'mp-empty-state': true,
          'mp-empty-state--drag-over': props.isDragOver,
        },
        'data-dc-component': 'empty-state',
        'data-dc-state': props.isDragOver ? 'drag-over' : undefined,
      }, [
        h('div', { class: 'mp-empty-state__icon' }, [
          props.isDragOver
            ? h(IconArrowDown, { size: 56, color: 'currentColor' })
            : h(IconPhone, { size: 56, color: 'currentColor' }),
        ]),
        h('div', { class: 'mp-empty-state__text' },
          props.isDragOver ? '松开放置组件' : '从左侧拖入组件开始装修'),
      ])
  },
})

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

// ── Create designer instance ─────────────────

const actionInterceptors = [
  createConfirmActionInterceptor({
    confirm: () => confirmWithModal({
      title: '确认删除',
      content: '删除后可通过撤销恢复，是否继续？',
      okText: '删除',
      okType: 'danger',
    }),
  }),
]

const extensions: DesignerExtensions = {
  materialItemRenderer,
  rendererExtensions: {
    containerShell: activeContainerShell,
    emptyState: MiniProgramEmptyState,
  },
}

const designer = createDesigner({
  schema: playgroundNextTemplates[0].schema,
  materials: playgroundNextMaterials,
  fieldComponentMap: buildPlaygroundFieldComponentMap(),
  globalConfigSchema,
  messages: playgroundWidgetMessages,
  actionInterceptors,
  extensions,
  maxHistoryEntries: 50,
})

const confirmTemplateSwitch = () => confirmWithModal({
    title: '确认切换模板',
    content: '当前修改将丢失，是否切换？',
    okText: '切换',
  })
const templateSwitch = useTemplateSwitch({
  importSchema: designer.importSchema,
  exportSchema: designer.exportSchema,
  templates: playgroundNextTemplates,
  confirmSwitch: confirmTemplateSwitch,
})

const io = useSchemaIO({
  exportSchema: designer.exportSchema,
  importSchema: designer.importSchema,
  invalidSchemaMessage: '无效的 Schema 格式：缺少 version、globalConfig、page、nodes 或 structure 字段',
  isValidSchema: isFinalDocumentSchema,
})

function toggleLocale() {
  const next = hostI18n.locale.value === 'zh-CN' ? 'en' : 'zh-CN'
  hostI18n.setLocale(next)
  designer.setLocale(next)
}

async function handleTemplateSwitch(id: string, target: HTMLSelectElement) {
  const switched = await templateSwitch.switchTemplate(id)
  if (!switched)
    target.value = templateSwitch.activeTemplateId.value
}
</script>

<template>
  <div class="playground-root">
    <PlaygroundHeader
      :active-template-id="templateSwitch.activeTemplateId.value"
      :templates="templateSwitch.templates"
      :locale="hostI18n.locale.value"
      @template-switch="handleTemplateSwitch"
      @import-open="io.handleImportOpen()"
      @export-open="io.handleExport()"
      @toggle-locale="toggleLocale"
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

    <DcDesigner :instance="designer" />

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
