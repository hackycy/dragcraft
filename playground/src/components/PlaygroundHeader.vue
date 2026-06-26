<!-- playground/src/components/PlaygroundHeader.vue -->
<script setup lang="ts">
import type { TemplateEntry } from '../config/templates'

defineProps<{
  activeTemplateId: string
  templates: TemplateEntry[]
  canUndo: boolean
  canRedo: boolean
  locale: string
}>()

const emit = defineEmits<{
  templateSwitch: [id: string]
  undo: []
  redo: []
  importOpen: []
  exportOpen: []
  toggleLocale: []
}>()
</script>

<template>
  <header class="playground-header">
    <span class="playground-header__brand">Dragcraft Playground</span>

    <select
      class="playground-header__select"
      :value="activeTemplateId"
      @change="emit('templateSwitch', ($event.target as HTMLSelectElement).value)"
    >
      <option
        v-for="t in templates"
        :key="t.id"
        :value="t.id"
      >
        {{ t.label }}
      </option>
    </select>

    <div class="playground-header__spacer" />

    <button
      class="playground-header__btn playground-header__btn--icon"
      :disabled="!canUndo"
      title="Undo"
      @click="emit('undo')"
    >
      &#x21A9;
    </button>
    <button
      class="playground-header__btn playground-header__btn--icon"
      :disabled="!canRedo"
      title="Redo"
      @click="emit('redo')"
    >
      &#x21AA;
    </button>

    <div class="playground-header__divider" />

    <button class="playground-header__btn" @click="emit('importOpen')">
      Import
    </button>
    <button
      class="playground-header__btn playground-header__btn--primary"
      @click="emit('exportOpen')"
    >
      Export
    </button>

    <div class="playground-header__divider" />

    <button class="playground-header__btn" @click="emit('toggleLocale')">
      {{ locale === 'zh-CN' ? 'English' : '中文' }}
    </button>
  </header>
</template>
