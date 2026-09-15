<template>
  <div class="pg-background-color-config">
    <RadioGroup
      class="pg-background-color-config__direction"
      :value="normalizedValue.direction"
      button-style="solid"
      :disabled="props.disabled"
      @update:value="handleDirectionChange"
    >
      <RadioButton
        v-for="option in directionOptions"
        :key="option.value"
        :value="option.value"
        class="pg-background-color-config__direction-button"
      >
        <Icon :icon="option.icon" :size="14" aria-hidden="true" />
        <span>{{ option.label }}</span>
      </RadioButton>
    </RadioGroup>

    <div class="pg-background-color-config__preview" :style="previewStyle">
      <span class="pg-background-color-config__preview-label">效果预览</span>
    </div>

    <div class="pg-background-color-config__timeline">
      <div
        v-for="(stop, index) in normalizedValue.stops"
        :key="stop.id"
        class="pg-background-color-config__stop"
      >
        <div class="pg-background-color-config__marker" aria-hidden="true">
          <span
            class="pg-background-color-config__marker-dot"
            :style="{ backgroundColor: stop.color }"
          />
        </div>

        <div class="pg-background-color-config__stop-editor">
          <div class="pg-background-color-config__color-control">
            <ColorField
              :value="stop.color"
              :disabled="props.disabled"
              @update:value="(value) => updateStopColor(index, value)"
            />
          </div>
          <div
            v-if="normalizedValue.stops.length > 1"
            class="pg-background-color-config__percent-control"
          >
            <InputNumber
              class="pg-background-color-config__percent-input"
              :value="getStopPercentInputValue(stop)"
              :disabled="props.disabled"
              @update:value="(value) => updateStopPercentDraft(stop.id, value)"
              @blur="() => commitStopPercent(stop.id)"
              @press-enter="() => commitStopPercent(stop.id)"
            />
            <span class="pg-background-color-config__percent-suffix">%</span>
          </div>
          <div
            v-if="normalizedValue.stops.length > 1"
            class="pg-background-color-config__action"
          >
            <Tooltip title="删除色标">
              <Button
                type="text"
                shape="circle"
                danger
                :disabled="props.disabled"
                aria-label="删除色标"
                @click="removeStop(index)"
              >
                <Icon icon="fluent:delete-24-regular" :size="14" />
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>

    <div class="pg-background-color-config__footer">
      <span class="pg-background-color-config__hint">颜色节点</span>
      <Button
        class="pg-background-color-config__add-stop"
        type="dashed"
        :disabled="props.disabled || normalizedValue.stops.length >= MAX_BACKGROUND_STOPS"
        @click="addStop"
      >
        <Icon icon="fluent:add-24-regular" :size="14" />
        添加色标
      </Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Button, InputNumber, RadioButton, RadioGroup, Tooltip } from 'ant-design-vue'
import { computed, reactive, type CSSProperties } from 'vue'

import { createDiyV2BackgroundColorStyle, normalizeDiyV2BackgroundColor } from '../background'
import { Icon } from '../icons/Icon'
import type { DiyV2BackgroundColor, DiyV2BackgroundDirection } from '../context'
import ColorField from './ColorField.vue'

const MAX_BACKGROUND_STOPS = 8

const props = withDefaults(
  defineProps<{
    value?: DiyV2BackgroundColor
    disabled?: boolean
  }>(),
  { disabled: false },
)

const emit = defineEmits<{
  'update:value': [value: DiyV2BackgroundColor]
}>()

const directionOptions: ReadonlyArray<{
  label: string
  value: DiyV2BackgroundDirection
  icon: string
}> = [
  { label: '纵向', value: 'vertical', icon: 'fluent:arrow-bidirectional-up-down-24-regular' },
  { label: '横向', value: 'horizontal', icon: 'fluent:arrow-bidirectional-left-right-24-regular' },
  // 斜向箭头按渲染方向配对，不要按名字配对：diagonalLeft 走 to bottom right，diagonalRight 走 to bottom left
  { label: '左斜', value: 'diagonalLeft', icon: 'fluent:arrow-down-right-24-regular' },
  { label: '右斜', value: 'diagonalRight', icon: 'fluent:arrow-down-left-24-regular' },
]

const normalizedValue = computed(() => normalizeDiyV2BackgroundColor(props.value))
const previewStyle = computed<CSSProperties>(
  () => createDiyV2BackgroundColorStyle(normalizedValue.value) as CSSProperties,
)
const draftPercents = reactive<Record<string, number | null>>({})

function emitValue(value: DiyV2BackgroundColor) {
  emit('update:value', normalizeDiyV2BackgroundColor(value))
}

function updateStopColor(index: number, color: string) {
  const stops = normalizedValue.value.stops.map((stop, stopIndex) =>
    stopIndex === index ? { ...stop, color } : { ...stop },
  )
  emitValue({ ...normalizedValue.value, stops })
}

function getStopPercentInputValue(stop: any) {
  return Object.prototype.hasOwnProperty.call(draftPercents, stop.id)
    ? draftPercents[stop.id]
    : stop.percent
}

function updateStopPercentDraft(id: string, percent: unknown) {
  draftPercents[id] = typeof percent === 'number' && Number.isFinite(percent) ? percent : null
}

function commitStopPercent(id: string) {
  const index = normalizedValue.value.stops.findIndex(stop => stop.id === id)
  const stop = normalizedValue.value.stops[index]
  if (!stop) {
    delete draftPercents[id]
    return
  }
  if (!Object.prototype.hasOwnProperty.call(draftPercents, id)) return

  const draftPercent = draftPercents[id]
  const nextPercent = draftPercent
  delete draftPercents[id]
  const stops = normalizedValue.value.stops.map((stop, stopIndex) =>
    stopIndex === index ? { ...stop, percent: nextPercent } : { ...stop },
  )
  emitValue({ ...normalizedValue.value, stops })
}

function handleDirectionChange(direction: unknown) {
  if (directionOptions.some(option => option.value === direction)) {
    emitValue({
      ...normalizedValue.value,
      direction: direction as DiyV2BackgroundDirection,
    })
  }
}

function addStop() {
  const currentStops = normalizedValue.value.stops
  if (currentStops.length >= MAX_BACKGROUND_STOPS) return

  const lastStop = currentStops[currentStops.length - 1]
  emitValue({
    ...normalizedValue.value,
    stops: [
      ...currentStops,
      {
        id: createStopId(currentStops),
        color: lastStop.color,
        percent: null,
      },
    ],
  })
}

function createStopId(stops: DiyV2BackgroundColor['stops']) {
  const usedIds = new Set(stops.map(stop => stop.id))
  let idIndex = stops.length + 1
  let id = `stop-${idIndex}`
  while (usedIds.has(id)) {
    idIndex += 1
    id = `stop-${idIndex}`
  }
  return id
}

function removeStop(index: number) {
  const currentStops = normalizedValue.value.stops
  if (currentStops.length <= 1) return

  const removedStop = currentStops[index]
  if (removedStop) delete draftPercents[removedStop.id]

  emitValue({
    ...normalizedValue.value,
    stops: currentStops.filter((_, stopIndex) => stopIndex !== index),
  })
}
</script>

<style scoped>
.pg-background-color-config {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 12px;
}

.pg-background-color-config__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.pg-background-color-config__count,
.pg-background-color-config__hint {
  color: var(--dc-color-text-subtle);
  font-size: 12px;
}

.pg-background-color-config__direction {
  display: flex;
  width: 100%;
}

.pg-background-color-config__direction-button {
  display: inline-flex;
  min-width: 0;
  flex: 1 1 0;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0 6px;
}

.pg-background-color-config__preview {
  display: flex;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid var(--dc-color-border);
  border-radius: 4px;
}

.pg-background-color-config__preview-label {
  padding: 2px 8px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--dc-color-surface) 78%, transparent);
  color: var(--dc-color-text-subtle);
  font-size: 11px;
}

.pg-background-color-config__timeline {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pg-background-color-config__stop {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  column-gap: 8px;
  min-width: 0;
}

.pg-background-color-config__marker {
  position: relative;
  display: flex;
  min-height: 36px;
  align-items: flex-start;
  justify-content: center;
  padding-top: 12px;
}

.pg-background-color-config__marker::after {
  position: absolute;
  top: 21px;
  bottom: -8px;
  left: 50%;
  width: 1px;
  background: var(--dc-color-border);
  content: '';
}

.pg-background-color-config__stop:last-child .pg-background-color-config__marker::after {
  display: none;
}

.pg-background-color-config__marker-dot {
  position: relative;
  z-index: 1;
  display: block;
  width: 10px;
  height: 10px;
  border: 2px solid var(--dc-color-surface);
  border-radius: 50%;
  box-shadow: 0 0 0 1px var(--dc-color-border);
}

.pg-background-color-config__stop-editor {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.pg-background-color-config__color-control {
  flex: 1 1 0;
  min-width: 0;
}

.pg-background-color-config__percent-control {
  display: flex;
  flex: 0 0 96px;
  align-items: center;
  gap: 4px;
}

.pg-background-color-config__percent-input {
  flex: 1 1 auto;
  min-width: 0;
}

.pg-background-color-config__percent-suffix {
  color: var(--dc-color-text-subtle);
  font-size: 12px;
}

.pg-background-color-config__action {
  display: inline-flex;
  flex: 0 0 32px;
  align-items: center;
  justify-content: center;
}

.pg-background-color-config__add-stop {
  flex: 0 0 auto;
}
</style>
