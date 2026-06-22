<script setup lang="ts">
import { CommandType, createDesigner, DcDesigner, useDesigner } from '@dragcraft/designer'
import type { NodeActionContext } from '@dragcraft/designer'
import { buildDefaultFieldComponentMap } from '@dragcraft/builtin-fields'
import { builtinWidgetsMessages, getAllWidgetMetas, getDefaultComponentMap, widgetGroups } from '@dragcraft/builtin-widgets'
import {
  createDeviceFrameContext,
  createDeviceToolbarRenderer,
  DEVICE_FRAME_CONTEXT_KEY,
  DeviceFrameShell,
} from '@dragcraft/device-frames'
import { defineComponent, h, provide } from 'vue'
import { globalConfigSchema } from './config/global-config-schema'
import { initialSchema } from './config/initial-schema'
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
        h('div', { class: 'mp-empty-state__icon' }, props.isDragOver ? '⬇' : '\u{1F4F1}'),
        h('div', { class: 'mp-empty-state__text' },
          props.isDragOver ? '松开放置组件' : '从左侧拖入组件开始装修'),
      ])
  },
})

// ── Create designer instance ─────────────────

const designer = createDesigner({
  engineOptions: {
    initialSchema,
    maxHistorySize: 50,
  },
  widgetMetas: getAllWidgetMetas(),
  componentMap: getDefaultComponentMap(),
  fieldComponentMap: buildDefaultFieldComponentMap(),
  widgetGroups: [...widgetGroups],
  globalConfigSchema,
  builtinMessages: builtinWidgetsMessages,
  eventHooks: {
    onBeforeDelete: () => {
      return new Promise<boolean>((resolve) => {
        resolve(confirm('确认删除该组件？'))
      })
    },
  },
  customActions: [
    {
      key: 'duplicate',
      label: '复制',
      icon: '⧉',
      type: 'button',
      order: 350,
      handler: (ctx: NodeActionContext) => {
        const node = ctx.node
        ctx.engine.execute({
          type: CommandType.ADD_NODE,
          payload: {
            node: {
              id: `${node.type}-${Date.now()}`,
              type: node.type,
              props: { ...node.props },
              style: node.style ? { ...node.style } : undefined,
            },
            index: ctx.index + 1,
          },
        })
      },
    },
  ],
  extensions: {
    rendererExtensions: {
      containerShell: DeviceFrameShell,
      emptyState: MiniProgramEmptyState,
    },
    toolbarRenderer: createDeviceToolbarRenderer(deviceCtx),
  },
})

const { exportSchema, importSchema } = useDesigner(designer)

const io = useSchemaIO(exportSchema, importSchema)

function toggleLocale() {
  const next = designer.i18n.locale.value === 'zh-CN' ? 'en' : 'zh-CN'
  designer.i18n.setLocale(next)
}
</script>

<template>
  <div class="playground-root">
    <DcDesigner :instance="designer" />

    <!-- Action Bar -->
    <div class="playground-actions">
      <span class="playground-actions__label">Dragcraft Playground</span>
      <div class="playground-actions__spacer" />
      <button class="playground-actions__btn" @click="toggleLocale">
        {{ designer.i18n.locale.value === 'zh-CN' ? 'English' : '中文' }}
      </button>
      <button class="playground-actions__btn" @click="io.handleImportOpen()">
        Import
      </button>
      <button class="playground-actions__btn playground-actions__btn--primary" @click="io.handleExport()">
        Export
      </button>
    </div>

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
}
</style>
