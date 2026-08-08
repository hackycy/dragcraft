<script setup lang="ts">
import { CommandType, createConfirmActionInterceptor, createDesigner, DcDesigner, resolveCreatable, useDesigner } from '@dragcraft/designer'
import type { DesignerExtensions, MaterialItemIcon, NodeActionContext } from '@dragcraft/designer'
import {
  BUILT_IN_DEVICE_FRAMES,
  DevicePicker,
  IPHONE_DEVICE_FRAME,
} from '@dragcraft/device-frames'
import { Modal } from 'ant-design-vue'
import { computed, defineComponent, h, ref } from 'vue'
import PlaygroundHeader from './components/PlaygroundHeader.vue'
import { buildPlaygroundFieldComponentMap } from './components/fields'
import { IconArrowDown, IconCopy, IconPhone } from './components/icons'
import {
  playgroundComponentMap,
  playgroundWidgetGroups,
  playgroundWidgetMessages,
  playgroundWidgetMetas,
} from './components/widgets'
import { globalConfigSchema } from './config/global-config-schema'
import { templateRegistry } from './config/templates'
import { useTemplateSwitch } from './composables/useTemplateSwitch'
import SchemaIOModal from './shared/SchemaIOModal.vue'
import { useSchemaIO } from './shared/use-schema-io'

// ── Host-owned Active Device Frame ──────────

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

const designer = createDesigner({
  engineOptions: {
    initialSchema: templateRegistry[0].schema,
    maxHistorySize: 50,
  },
  widgetMetas: playgroundWidgetMetas,
  componentMap: playgroundComponentMap,
  fieldComponentMap: buildPlaygroundFieldComponentMap(),
  widgetGroups: playgroundWidgetGroups,
  globalConfigSchema,
  messages: playgroundWidgetMessages,
  actionInterceptors: [
    createConfirmActionInterceptor({
      confirm: () => confirmWithModal({
        title: '确认删除',
        content: '删除后可通过撤销恢复，是否继续？',
        okText: '删除',
        okType: 'danger',
      }),
    }),
  ],
  customActions: [
    {
      key: 'duplicate',
      label: '复制',
      icon: IconCopy,
      type: 'button',
      order: 350,
      available: (ctx: NodeActionContext) => {
        if (!ctx.meta)
          return true
        return resolveCreatable(ctx.meta.creatable, {
          widgetType: ctx.node.type,
          schema: ctx.schema,
        }, true).allowed
      },
      command: (ctx: NodeActionContext) => {
        return {
          type: CommandType.DUPLICATE_NODE,
          payload: {
            nodeId: ctx.node.id,
          },
        }
      },
    },
  ],
  extensions: {
    materialItemRenderer,
    rendererExtensions: {
      containerShell: activeContainerShell,
      emptyState: MiniProgramEmptyState,
    },
  },
})

const { exportSchema, importSchema } = useDesigner(designer)

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
  const next = designer.i18n.locale.value === 'zh-CN' ? 'en' : 'zh-CN'
  designer.i18n.setLocale(next)
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
      :locale="designer.i18n.locale.value"
      @template-switch="handleTemplateSwitch"
      @import-open="io.handleImportOpen()"
      @export-open="io.handleExport()"
      @toggle-locale="toggleLocale"
    >
      <template #preview-controls>
        <DevicePicker
          :definitions="BUILT_IN_DEVICE_FRAMES"
          :model-value="activeDeviceFrameId"
          :translate="designer.i18n.t"
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
