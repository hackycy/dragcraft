<script setup lang="ts">
defineProps<{
  showExportModal: boolean
  showImportModal: boolean
  exportJson: string
  importJson: string
  importError: string
}>()

const emit = defineEmits<{
  'update:showExportModal': [value: boolean]
  'update:showImportModal': [value: boolean]
  'update:importJson': [value: string]
  'copy': []
  'importConfirm': []
}>()
</script>

<template>
  <!-- Export Modal -->
  <div v-if="showExportModal" class="playground-modal-overlay" @click.self="emit('update:showExportModal', false)">
    <div class="playground-modal">
      <div class="playground-modal__header">
        <span>Export Schema</span>
        <button class="playground-modal__close" @click="emit('update:showExportModal', false)">
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
        <button class="playground-header__btn" @click="emit('copy')">
          Copy
        </button>
        <button class="playground-header__btn" @click="emit('update:showExportModal', false)">
          Close
        </button>
      </div>
    </div>
  </div>

  <!-- Import Modal -->
  <div v-if="showImportModal" class="playground-modal-overlay" @click.self="emit('update:showImportModal', false)">
    <div class="playground-modal">
      <div class="playground-modal__header">
        <span>Import Schema</span>
        <button class="playground-modal__close" @click="emit('update:showImportModal', false)">
          &times;
        </button>
      </div>
      <div class="playground-modal__body">
        <textarea
          :value="importJson"
          class="playground-modal__textarea"
          placeholder="在此粘贴 JSON Schema..."
          @input="emit('update:importJson', ($event.target as HTMLTextAreaElement).value)"
        />
        <div v-if="importError" style="margin-top: 8px; color: #ff4d4f; font-size: 12px;">
          {{ importError }}
        </div>
      </div>
      <div class="playground-modal__footer">
        <button class="playground-header__btn" @click="emit('update:showImportModal', false)">
          Cancel
        </button>
        <button class="playground-header__btn playground-header__btn--primary" @click="emit('importConfirm')">
          Import
        </button>
      </div>
    </div>
  </div>
</template>
