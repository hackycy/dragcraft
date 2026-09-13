<template>
  <div class="pg-image" :style="containerStyle">
    <img v-if="resolvedSrc" :src="resolvedSrc" :style="imageStyle" alt="">
    <ImagePlaceHolder v-else />
  </div>
</template>

<script lang="ts" setup>
import { computed, type CSSProperties } from 'vue'

import ImagePlaceHolder from '../../components/ImagePlaceHolder.vue'

type ImageObjectFit = 'cover' | 'contain' | 'fill'

const DEFAULT_HEIGHT = 300
const MIN_HEIGHT = 0
const MAX_HEIGHT = 1000

const props = defineProps<{
  src?: string
  link?: string
  height?: number
  objectFit?: ImageObjectFit
}>()

const resolvedSrc = computed(() => (typeof props.src === 'string' ? props.src.trim() : ''))

const resolvedHeight = computed(() => {
  const height
    = typeof props.height === 'number' && Number.isFinite(props.height) ? props.height : DEFAULT_HEIGHT

  return Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Math.round(height)))
})

const resolvedObjectFit = computed<ImageObjectFit>(() => {
  if (props.objectFit === 'contain' || props.objectFit === 'fill') {
    return props.objectFit
  }

  return 'cover'
})

const containerStyle = computed<CSSProperties>(() => ({
  height: `${resolvedHeight.value}px`,
}))

const imageStyle = computed<CSSProperties>(() => ({
  width: '100%',
  height: '100%',
  objectFit: resolvedObjectFit.value,
}))
</script>

<style scoped>
.pg-image {
  overflow: hidden;
  position: relative;
  width: 100%;
  box-sizing: border-box;
}

.pg-image img {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
