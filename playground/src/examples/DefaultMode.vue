<script setup lang="ts">
import { CommandType, createDesigner, DcDesigner, useDesigner } from '@dragcraft/designer'
import type { DesignerSchema, NodeActionContext, ToolbarSlotAPI } from '@dragcraft/designer'
import { buildDefaultFieldComponentMap } from '@dragcraft/builtin-fields'
import { getAllWidgetMetas, getDefaultComponentMap, widgetGroups } from '@dragcraft/builtin-widgets'
import { defineComponent, h, ref } from 'vue'
import { globalConfigSchema } from '../config/global-config-schema'
import { initialSchema } from '../config/initial-schema'

// ── Phone Frame Shell (containerShell extension) ──

const PhoneFrameShell = defineComponent({
  name: 'PhoneFrameShell',
  setup(_, { slots }) {
    return () =>
      h('div', { class: 'phone-frame' }, [
        h('div', { class: 'phone-frame__status-bar' }, [
          h('span', { class: 'phone-frame__status-time' }, '9:41'),
          h('span', { class: 'phone-frame__status-icons' }, [
            h('span', null, '\u25D0'),
            h('span', null, '\u25AC'),
          ]),
        ]),
        h('div', { class: 'phone-frame__content dc-container-shell' }, slots.default?.()),
      ])
  },
})

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
        h('div', { class: 'mp-empty-state__icon' }, props.isDragOver ? '\u2B07' : '\u{1F4F1}'),
        h('div', { class: 'mp-empty-state__text' },
          props.isDragOver ? '\u677E\u5F00\u653E\u7F6E\u7EC4\u4EF6' : '\u4ECE\u5DE6\u4FA7\u62D6\u5165\u7EC4\u4EF6\u5F00\u59CB\u88C5\u4FEE'),
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
  eventHooks: {
    onBeforeDelete: () => {
      return confirm('\u786E\u8BA4\u5220\u9664\u8BE5\u7EC4\u4EF6\uFF1F')
    },
  },
  customActions: [
    {
      key: 'duplicate',
      label: '\u590D\u5236',
      icon: '\u29C9',
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
      containerShell: PhoneFrameShell,
      emptyState: MiniProgramEmptyState,
    },
    toolbarRenderer: (api: ToolbarSlotAPI) => [
      h('button', {
        class: 'dc-toolbar__btn dc-toolbar__btn--icon',
        onClick: () => api.undo(),
        disabled: !api.canUndo(),
        title: '\u64A4\u9500',
      }, '\u21A9'),
      h('button', {
        class: 'dc-toolbar__btn dc-toolbar__btn--icon',
        onClick: () => api.redo(),
        disabled: !api.canRedo(),
        title: '\u91CD\u505A',
      }, '\u21AA'),
      h('div', { class: 'dc-toolbar__spacer' }),
      h('button', {
        class: 'dc-toolbar__btn',
        onClick: () => {
          const schema = api.engine.exportSchema()
          console.log('Current schema:', JSON.stringify(schema, null, 2))
        },
        title: '\u8F93\u51FA\u5230\u63A7\u5236\u53F0',
      }, '\u{1F4CB} Log'),
    ],
  },
})

const { exportSchema, importSchema } = useDesigner(designer)

// ── Import / Export state ────────────────────

const showExportModal = ref(false)
const showImportModal = ref(false)
const exportJson = ref('')
const importJson = ref('')
const importError = ref('')

function handleExport() {
  const schema = exportSchema()
  exportJson.value = JSON.stringify(schema, null, 2)
  showExportModal.value = true
}

function handleImportOpen() {
  importJson.value = ''
  importError.value = ''
  showImportModal.value = true
}

function handleImportConfirm() {
  try {
    const schema: DesignerSchema = JSON.parse(importJson.value)
    if (!schema.version || !schema.root) {
      importError.value = '\u65E0\u6548\u7684 Schema \u683C\u5F0F\uFF1A\u7F3A\u5C11 version \u6216 root \u5B57\u6BB5'
      return
    }
    importSchema(schema)
    showImportModal.value = false
  }
  catch {
    importError.value = 'JSON \u89E3\u6790\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u683C\u5F0F'
  }
}

function handleCopyExport() {
  navigator.clipboard.writeText(exportJson.value)
}
</script>

<template>
  <div class="playground-app">
    <DcDesigner :instance="designer" />

    <!-- Action Bar -->
    <div class="playground-actions">
      <span class="playground-actions__label">Default Mode (Built-in Widgets + Fields)</span>
      <div class="playground-actions__spacer" />
      <button class="playground-actions__btn" @click="handleImportOpen">
        Import
      </button>
      <button class="playground-actions__btn playground-actions__btn--primary" @click="handleExport">
        Export
      </button>
    </div>

    <!-- Export Modal -->
    <div v-if="showExportModal" class="playground-modal-overlay" @click.self="showExportModal = false">
      <div class="playground-modal">
        <div class="playground-modal__header">
          <span>Export Schema</span>
          <button class="playground-modal__close" @click="showExportModal = false">
            &times;
          </button>
        </div>
        <div class="playground-modal__body">
          <textarea
            class="playground-modal__textarea"
            readonly
            :value="exportJson"
          />
        </div>
        <div class="playground-modal__footer">
          <button class="playground-actions__btn" @click="handleCopyExport">
            Copy
          </button>
          <button class="playground-actions__btn" @click="showExportModal = false">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Import Modal -->
    <div v-if="showImportModal" class="playground-modal-overlay" @click.self="showImportModal = false">
      <div class="playground-modal">
        <div class="playground-modal__header">
          <span>Import Schema</span>
          <button class="playground-modal__close" @click="showImportModal = false">
            &times;
          </button>
        </div>
        <div class="playground-modal__body">
          <textarea
            v-model="importJson"
            class="playground-modal__textarea"
            placeholder="在此粘贴 JSON Schema..."
          />
          <div v-if="importError" style="margin-top: 8px; color: #ff4d4f; font-size: 12px;">
            {{ importError }}
          </div>
        </div>
        <div class="playground-modal__footer">
          <button class="playground-actions__btn" @click="showImportModal = false">
            Cancel
          </button>
          <button class="playground-actions__btn playground-actions__btn--primary" @click="handleImportConfirm">
            Import
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
