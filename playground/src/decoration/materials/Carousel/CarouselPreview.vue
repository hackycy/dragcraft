<template>
  <div class="pg-carousel" :style="containerStyle">
    <Carousel
      ref="carouselRef"
      :autoplay="resolvedAutoplay"
      :autoplay-speed="autoplaySpeed"
      :dots="false"
      :after-change="handleSlideChange"
    >
      <div v-for="(item, index) in slides" :key="index" class="pg-carousel__slide">
        <img v-if="item.src" :src="item.src" :style="imageStyle" alt="">
        <ImagePlaceHolder v-else />
      </div>
    </Carousel>

    <NavigationIndicator
      v-if="shouldShowIndicator"
      :count="slideCount"
      :active="activeSlide"
      :position="resolvedIndicatorPosition"
      :align="resolvedIndicatorAlign"
      :indicator-style="resolvedIndicatorStyle"
      :active-color="resolvedIndicatorActiveColor"
      :inactive-color="resolvedIndicatorInactiveColor"
      :size="resolvedIndicatorSize"
      :radius="resolvedIndicatorRadius"
      :margin="resolvedIndicatorMargin"
      @select="handleIndicatorSelect"
    />
  </div>
</template>

<script lang="ts" setup>
import { Carousel } from 'ant-design-vue'
import { computed, ref, watch, type CSSProperties } from 'vue'

import ImagePlaceHolder from '../../components/ImagePlaceHolder.vue'
import NavigationIndicator from '../../components/NavigationIndicator.vue'

type CarouselObjectFit = 'cover' | 'contain' | 'fill'
type IndicatorPosition = 'top' | 'bottom' | 'left' | 'right'
type IndicatorAlign = 'start' | 'center' | 'end'
type IndicatorStyle = 'dot' | 'bar' | 'number'

interface CarouselItem {
  src?: string
  link?: string
}

const DEFAULT_HEIGHT = 300
const MIN_HEIGHT = 0
const MAX_HEIGHT = 1000
const DEFAULT_INTERVAL = 3
const MIN_INTERVAL = 1
const MAX_INTERVAL = 100

const props = defineProps<{
  height?: number
  objectFit?: CarouselObjectFit
  autoplay?: boolean
  interval?: number
  showIndicator?: boolean
  indicatorPosition?: IndicatorPosition
  indicatorAlign?: IndicatorAlign
  indicatorStyle?: IndicatorStyle
  indicatorActiveColor?: string
  indicatorInactiveColor?: string
  indicatorSize?: number
  indicatorRadius?: number
  indicatorMargin?: number
  items?: CarouselItem[]
}>()

const carouselRef = ref<{ goTo: (slide: number, dontAnimate?: boolean) => void }>()
const activeSlide = ref(0)

const slides = computed(() => {
  const items = Array.isArray(props.items) ? props.items : []
  const resolved = items.map(item => ({
    src: typeof item?.src === 'string' ? item.src.trim() : '',
  }))

  return resolved.length > 0 ? resolved : [{ src: '' }]
})

const resolvedHeight = computed(() => {
  const height
    = typeof props.height === 'number' && Number.isFinite(props.height)
      ? props.height
      : DEFAULT_HEIGHT

  return Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Math.round(height)))
})

const resolvedObjectFit = computed<CarouselObjectFit>(() => {
  if (props.objectFit === 'contain' || props.objectFit === 'fill') {
    return props.objectFit
  }

  return 'cover'
})

const resolvedAutoplay = computed(() => props.autoplay === true)

const autoplaySpeed = computed(() => {
  const interval
    = typeof props.interval === 'number' && Number.isFinite(props.interval)
      ? props.interval
      : DEFAULT_INTERVAL

  return Math.min(MAX_INTERVAL, Math.max(MIN_INTERVAL, Math.round(interval))) * 1000
})

const slideCount = computed(() => slides.value.length)
const shouldShowIndicator = computed(() => props.showIndicator !== false && slideCount.value > 1)
const resolvedIndicatorPosition = computed<IndicatorPosition>(() => {
  if (
    props.indicatorPosition === 'top'
    || props.indicatorPosition === 'left'
    || props.indicatorPosition === 'right'
  ) {
    return props.indicatorPosition
  }

  return 'bottom'
})
const resolvedIndicatorAlign = computed<IndicatorAlign>(() => {
  if (props.indicatorAlign === 'start' || props.indicatorAlign === 'end') {
    return props.indicatorAlign
  }

  return 'center'
})
const resolvedIndicatorStyle = computed<IndicatorStyle>(() => {
  if (props.indicatorStyle === 'bar' || props.indicatorStyle === 'number') {
    return props.indicatorStyle
  }

  return 'dot'
})
const resolvedIndicatorActiveColor = computed(() =>
  resolveColor(props.indicatorActiveColor, '#1677ff'),
)
const resolvedIndicatorInactiveColor = computed(() =>
  resolveColor(props.indicatorInactiveColor, '#d9d9d9'),
)
const resolvedIndicatorSize = computed(() => numberValue(props.indicatorSize, 8, 4, 48))
const resolvedIndicatorRadius = computed(() => numberValue(props.indicatorRadius, 8, 0, 50))
const resolvedIndicatorMargin = computed(() => numberValue(props.indicatorMargin, 8, 0, 100))

const containerStyle = computed<CSSProperties>(() => ({
  height: `${resolvedHeight.value}px`,
}))

const imageStyle = computed<CSSProperties>(() => ({
  width: '100%',
  height: '100%',
  objectFit: resolvedObjectFit.value,
}))

watch(slideCount, () => {
  const nextSlide = Math.min(activeSlide.value, Math.max(0, slideCount.value - 1))
  activeSlide.value = nextSlide
  carouselRef.value?.goTo(nextSlide, true)
})

function handleSlideChange(index: number) {
  activeSlide.value = index
}

function handleIndicatorSelect(index: number) {
  activeSlide.value = index
  carouselRef.value?.goTo(index)
}

function numberValue(value: unknown, fallback: number, min: number, max: number) {
  const candidate = typeof value === 'number' && Number.isFinite(value) ? value : fallback

  return Math.min(max, Math.max(min, Math.round(candidate)))
}

function resolveColor(value: string | undefined, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback
}
</script>

<style scoped>
.pg-carousel {
  overflow: hidden;
  position: relative;
  width: 100%;
  box-sizing: border-box;
}

.pg-carousel :deep(.ant-carousel),
.pg-carousel :deep(.slick-slider),
.pg-carousel :deep(.slick-list),
.pg-carousel :deep(.slick-track),
.pg-carousel :deep(.slick-slide),
.pg-carousel :deep(.slick-slide > div) {
  height: 100%;
}

.pg-carousel__slide {
  height: 100%;
}

.pg-carousel img {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
