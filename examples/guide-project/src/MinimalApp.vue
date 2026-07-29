<script setup lang="ts">
import { DcDesigner } from '@dragcraft/designer'
import { onBeforeUnmount } from 'vue'
import { createMinimalDesigner } from './editor/minimal-designer'

const designer = createMinimalDesigner()

onBeforeUnmount(() => designer.dispose())
</script>

<template>
  <main class="minimal-app">
    <DcDesigner :instance="designer" />
  </main>
</template>
