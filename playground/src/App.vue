<script setup lang="ts">
import { CommandType, createConfirmActionInterceptor, createDesigner, DcDesigner, resolveCreatable, useDesigner } from '@dragcraft/designer'
import { IconArrowDown, IconCopy, IconPhone } from '@dragcraft/icons'
import type { DesignerExtensions, MaterialItemIcon, NodeActionContext } from '@dragcraft/designer'
import { cloneDeep, generateShortId } from '@dragcraft/utils'
import {
  createDeviceFrameContext,
  DEVICE_FRAME_CONTEXT_KEY,
  DeviceFrameShell,
  DevicePicker,
} from '@dragcraft/device-frames'
import { Modal } from 'ant-design-vue'
import { defineComponent, h, provide } from 'vue'
import PlaygroundHeader from './components/PlaygroundHeader.vue'
import { buildPlaygroundFieldComponentMap } from './components/fields'
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

// ── Device Frame Context ────────────────────

const deviceCtx = createDeviceFrameContext({ initialDevice: 'iphone' })
provide(DEVICE_FRAME_CONTEXT_KEY, deviceCtx)

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
          schema: ctx.engine.store.getRawSchema(),
        }, true).allowed
      },
      command: (ctx: NodeActionContext) => {
        const clonedNode = cloneDeep(ctx.node)
        delete clonedNode.children
        clonedNode.id = generateShortId()
        return {
          type: CommandType.ADD_NODE,
          payload: {
            node: clonedNode,
            destination: { ...ctx.owner, index: ctx.index + 1 },
          },
        }
      },
    },
  ],
  extensions: {
    materialItemRenderer,
    rendererExtensions: {
      containerShell: DeviceFrameShell,
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
</script>

<template>
  <div class="playground-root">
    <PlaygroundHeader
      :active-template-id="templateSwitch.activeTemplateId.value"
      :templates="templateSwitch.templates"
      :locale="designer.i18n.locale.value"
      @template-switch="templateSwitch.switchTemplate"
      @import-open="io.handleImportOpen()"
      @export-open="io.handleExport()"
      @toggle-locale="toggleLocale"
    >
      <template #preview-controls>
        <DevicePicker
          :context="deviceCtx"
          :translate="designer.i18n.t"
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
