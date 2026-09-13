<template>
  <div class="pg-floating-button" :style="buttonStyle">
    <img v-if="resolvedImage" class="pg-floating-button__image" :src="resolvedImage" alt="">
    <div v-else class="pg-floating-button__placeholder">
      <ImagePlaceHolder :size="24" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, type CSSProperties } from 'vue'

import ImagePlaceHolder from '../../components/ImagePlaceHolder.vue'

type FloatingButtonPosition = 'left' | 'right'

const DEFAULT_OFFSET = 16
const MIN_OFFSET = 0
const MAX_OFFSET = 100
const DEFAULT_SIZE = 48
const MIN_SIZE = 24
const MAX_SIZE = 120
const DEFAULT_RADIUS = 24
const MAX_RADIUS = 60

const props = defineProps<{
  image?: string
  link?: string
  position?: FloatingButtonPosition
  horizontalOffset?: number
  verticalOffset?: number
  size?: number
  borderRadius?: number
}>()

const resolvedImage = computed(() => (typeof props.image === 'string' ? props.image.trim() : ''))

const resolvedPosition = computed<FloatingButtonPosition>(() =>
  props.position === 'left' ? 'left' : 'right',
)

function resolveOffset(offset: number | undefined) {
  const value = typeof offset === 'number' && Number.isFinite(offset) ? offset : DEFAULT_OFFSET

  return Math.min(MAX_OFFSET, Math.max(MIN_OFFSET, Math.round(value)))
}

function resolveSize(size: number | undefined) {
  const value = typeof size === 'number' && Number.isFinite(size) ? size : DEFAULT_SIZE

  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(value)))
}

function resolveRadius(radius: number | undefined) {
  const value = typeof radius === 'number' && Number.isFinite(radius) ? radius : DEFAULT_RADIUS

  return Math.min(MAX_RADIUS, Math.max(0, Math.round(value)))
}

const buttonStyle = computed<CSSProperties>(() => ({
  [resolvedPosition.value]: `${resolveOffset(props.horizontalOffset)}px`,
  // 叠上底部已被占用的高度（TabBar 的 block-end reservation），所以悬浮按钮不会被底栏压住
  bottom: `calc(${resolveOffset(props.verticalOffset)}px + var(--dc-internal-surface-reservation-block-end, 0px))`,
  width: `${resolveSize(props.size)}px`,
  height: `${resolveSize(props.size)}px`,
  borderRadius: `${resolveRadius(props.borderRadius)}px`,
}))
</script>

<style scoped>
.pg-floating-button {
  position: absolute;
  box-sizing: border-box;
  overflow: hidden;
  pointer-events: auto;
  background: #fff;
  box-shadow:
    0 6px 16px rgba(0, 0, 0, 0.25),
    0 2px 6px rgba(0, 0, 0, 0.15);
}

.pg-floating-button__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pg-floating-button__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
}
</style>
