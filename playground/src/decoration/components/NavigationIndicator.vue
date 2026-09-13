<template>
  <div
    v-if="pageCount > 1"
    class="navigation-indicator"
    :class="{ 'is-vertical': isVertical }"
    :style="containerStyle"
  >
    <span v-if="indicatorStyle === 'number'" class="navigation-indicator__number">
      <span :style="activeNumberStyle">{{ activeIndex + 1 }}</span>
      <span :style="inactiveNumberStyle">/</span>
      <span :style="inactiveNumberStyle">{{ pageCount }}</span>
    </span>
    <button
      v-else
      v-for="item in indicatorItems"
      :key="item.index"
      class="navigation-indicator__item"
      :class="[`is-${indicatorStyle}`, { 'is-active': item.index === activeIndex }]"
      type="button"
      :aria-label="`第 ${item.index + 1} 页`"
      :aria-current="item.index === activeIndex ? 'true' : undefined"
      :style="itemStyle(item.index)"
      @click="emit('select', item.index)"
    ></button>
  </div>
</template>

<script lang="ts" setup>
import { computed, type CSSProperties } from 'vue'

type IndicatorPosition = 'top' | 'bottom' | 'left' | 'right'
type IndicatorAlign = 'start' | 'center' | 'end'
type IndicatorStyle = 'dot' | 'bar' | 'number'

const props = withDefaults(
  defineProps<{
    count?: number
    active?: number
    position?: IndicatorPosition
    align?: IndicatorAlign
    indicatorStyle?: IndicatorStyle
    activeColor?: string
    inactiveColor?: string
    size?: number
    radius?: number
    margin?: number
  }>(),
  {
    count: 0,
    active: 0,
    position: 'bottom',
    align: 'center',
    indicatorStyle: 'dot',
    activeColor: '#1677ff',
    inactiveColor: '#d9d9d9',
    size: 8,
    radius: 8,
    margin: 8,
  },
)

const emit = defineEmits<{
  select: [index: number]
}>()

const pageCount = computed(() => Math.max(0, Math.floor(props.count)))
const activeIndex = computed(() => Math.min(pageCount.value - 1, Math.max(0, Math.floor(props.active))))
const isVertical = computed(() => props.position === 'left' || props.position === 'right')
const resolvedSize = computed(() => clamp(props.size, 4, 48))
const resolvedRadius = computed(() => clamp(props.radius, 0, 50))
const resolvedMargin = computed(() => clamp(props.margin, 0, 100))
const resolvedActiveColor = computed(() => resolveColor(props.activeColor, '#1677ff'))
const resolvedInactiveColor = computed(() => resolveColor(props.inactiveColor, '#d9d9d9'))

const indicatorItems = computed(() =>
  Array.from({ length: pageCount.value }, (_, index) => ({ index })),
)

const containerStyle = computed<CSSProperties>(() => {
  const alignment = resolveAlignment(props.align)
  const style: CSSProperties = {
    '--navigation-indicator-size': `${resolvedSize.value}px`,
    'justifyContent': alignment,
  }

  if (props.position === 'top') {
    style.top = `${resolvedMargin.value}px`
    style.left = '0'
    style.right = '0'
  }
  else if (props.position === 'bottom') {
    style.bottom = `${resolvedMargin.value}px`
    style.left = '0'
    style.right = '0'
  }
  else if (props.position === 'left') {
    style.left = `${resolvedMargin.value}px`
    style.top = '0'
    style.bottom = '0'
  }
  else {
    style.right = `${resolvedMargin.value}px`
    style.top = '0'
    style.bottom = '0'
  }

  return style
})

const activeNumberStyle = computed<CSSProperties>(() => ({ color: resolvedActiveColor.value }))
const inactiveNumberStyle = computed<CSSProperties>(() => ({ color: resolvedInactiveColor.value }))

function itemStyle(index: number): CSSProperties {
  return {
    backgroundColor: index === activeIndex.value ? resolvedActiveColor.value : resolvedInactiveColor.value,
    borderRadius: `${resolvedRadius.value}px`,
  }
}

function resolveAlignment(align: IndicatorAlign) {
  if (align === 'start') return 'flex-start'
  if (align === 'end') return 'flex-end'

  return 'center'
}

function clamp(value: number, min: number, max: number) {
  const candidate = Number.isFinite(value) ? value : min

  return Math.min(max, Math.max(min, Math.round(candidate)))
}

function resolveColor(value: string | undefined, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback
}
</script>

<style scoped>
.navigation-indicator {
  position: absolute;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 6px;
  pointer-events: auto;
}

.navigation-indicator.is-vertical {
  flex-direction: column;
}

.navigation-indicator__item {
  display: block;
  flex: none;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  border: 0;
  background: rgba(0, 0, 0, 0.25);
  cursor: pointer;
  transition: background-color 0.15s ease, opacity 0.15s ease;
}

.navigation-indicator__item.is-dot {
  width: var(--navigation-indicator-size);
  height: var(--navigation-indicator-size);
}

.navigation-indicator__item.is-bar {
  width: calc(var(--navigation-indicator-size) * 3);
  height: var(--navigation-indicator-size);
}

.navigation-indicator.is-vertical .navigation-indicator__item.is-bar {
  width: var(--navigation-indicator-size);
  height: calc(var(--navigation-indicator-size) * 3);
}

.navigation-indicator__number {
  display: inline-flex;
  align-items: center;
  font-size: max(10px, var(--navigation-indicator-size));
  line-height: calc(var(--navigation-indicator-size) * 2);
}
</style>
