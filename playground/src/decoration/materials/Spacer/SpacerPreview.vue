<template>
  <div :style="{ height: `${resolvedHeight}px` }" aria-hidden="true" />
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps<{
  height?: number
}>()

const resolvedHeight = computed(() => {
  const height
    = typeof props.height === 'number' && Number.isFinite(props.height) ? props.height : 20

  return Math.min(500, Math.max(0, Math.round(height)))
})
</script>
