<script setup lang="ts">
import { createDesigner, DcDesigner, useDesigner } from '@dragcraft/designer'
import type { DesignerSchema, ToolbarSlotAPI } from '@dragcraft/designer'
import { h, ref } from 'vue'
import { globalConfigSchema } from './config/global-config-schema'
import { initialSchema } from './config/initial-schema'

// ── Create designer instance ─────────────────
const designer = createDesigner({
  engineOptions: {
    initialSchema,
    maxHistorySize: 50,
  },
  globalConfigSchema,
  extensions: {
    toolbarRenderer: (api: ToolbarSlotAPI) => [
      h('button', {
        class: 'dc-toolbar__btn dc-toolbar__btn--undo',
        onClick: () => api.undo(),
        disabled: !api.canUndo(),
      }, 'Undo'),
      h('button', {
        class: 'dc-toolbar__btn dc-toolbar__btn--redo',
        onClick: () => api.redo(),
        disabled: !api.canRedo(),
      }, 'Redo'),
      h('div', { class: 'dc-toolbar__spacer' }),
      h('button', {
        class: 'dc-toolbar__btn',
        onClick: () => {
          const schema = api.engine.exportSchema()
          console.log('Current schema:', schema)
        },
      }, 'Log Schema'),
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
      importError.value = '无效的 Schema 格式：缺少 version 或 root 字段'
      return
    }
    importSchema(schema)
    showImportModal.value = false
  }
  catch {
    importError.value = 'JSON 解析失败，请检查格式'
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
      <span style="font-size: 12px; color: #999;">Dragcraft Playground</span>
      <div class="playground-actions__spacer" />
      <button class="playground-actions__btn" @click="handleImportOpen">
        Import JSON
      </button>
      <button class="playground-actions__btn playground-actions__btn--primary" @click="handleExport">
        Export JSON
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

<style scoped>
.playground-app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.playground-app > .dc-designer {
  flex: 1;
  height: 0;
}
</style>
