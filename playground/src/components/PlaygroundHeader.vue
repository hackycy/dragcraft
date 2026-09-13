<!-- playground/src/components/PlaygroundHeader.vue -->
<script setup lang="ts">
const emit = defineEmits<{
  importOpen: []
  exportOpen: []
}>()
</script>

<template>
  <header class="playground-header">
    <span class="playground-header__brand">Dragcraft Playground</span>

    <div class="playground-header__preview-controls">
      <slot name="preview-controls" />
    </div>

    <div class="playground-header__spacer" />

    <div class="playground-header__actions">
      <a
        class="playground-header__btn"
        href="https://hackycy.github.io/dragcraft/"
        target="_blank"
        rel="noreferrer"
      >
        Docs
      </a>
      <button class="playground-header__btn" @click="emit('importOpen')">
        Import
      </button>
      <button
        class="playground-header__btn playground-header__btn--primary"
        @click="emit('exportOpen')"
      >
        Export
      </button>
    </div>
  </header>
</template>
