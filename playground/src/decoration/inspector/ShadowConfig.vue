<template>
  <div class="shadow-config">
    <div class="shadow-config__field shadow-config__color-field">
      <span class="shadow-config__label">颜色</span>
      <ColorField
        :value="normalizedValue.color"
        :disabled="props.disabled"
        @update:value="updateColor"
      />
    </div>

    <div class="shadow-config__number-fields">
      <div v-for="field in numberFields" :key="field.key" class="shadow-config__field">
        <span class="shadow-config__label">{{ field.label }}</span>
        <SliderNumberInput
          :value="normalizedValue[field.key]"
          :min="field.min"
          :max="field.max"
          :disabled="props.disabled"
          @update:value="(value) => updateNumber(field.key, value)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import ColorField from './ColorField.vue'
import SliderNumberInput from './SliderNumberInput.vue'

const SHADOW_MIN = -24
const SHADOW_MAX = 24
const SHADOW_BLUR_MIN = 0
const DEFAULT_SHADOW_COLOR = '#000000'

type ShadowNumberKey = 'x' | 'y' | 'blur' | 'spread'

interface ShadowValue {
  color: string
  x: number
  y: number
  blur: number
  spread: number
}

const props = withDefaults(
  defineProps<{
    value?: string
    disabled?: boolean
  }>(),
  { disabled: false },
)

const emit = defineEmits<{
  'update:value': [value: string]
}>()

const numberFields: ReadonlyArray<{
  key: ShadowNumberKey
  label: string
  min: number
  max: number
}> = [
  { key: 'x', label: 'X轴', min: SHADOW_MIN, max: SHADOW_MAX },
  { key: 'y', label: 'Y轴', min: SHADOW_MIN, max: SHADOW_MAX },
  { key: 'blur', label: '模糊', min: SHADOW_BLUR_MIN, max: SHADOW_MAX },
  { key: 'spread', label: '扩展', min: SHADOW_MIN, max: SHADOW_MAX },
]

const normalizedValue = computed(() => parseShadow(props.value))

function updateColor(color: string) {
  emitShadow({ ...normalizedValue.value, color })
}

function updateNumber(key: ShadowNumberKey, value: number) {
  emitShadow({ ...normalizedValue.value, [key]: value })
}

function emitShadow(value: ShadowValue) {
  emit('update:value', serializeShadow(value))
}

function parseShadow(value: unknown): ShadowValue {
  const shadow = typeof value === 'string' ? value.trim() : ''
  if (!shadow || shadow.toLowerCase() === 'none') {
    return createDefaultShadow()
  }

  const shadowWithoutInset = shadow
    .replace(/^inset\s+/i, '')
    .replace(/\s+inset$/i, '')
    .trim()
  const numberToken = '(-?(?:\\d+(?:\\.\\d+)?|\\.\\d+)(?:[a-z%]+)?)'
  const colorToken = '(rgba?\\([^)]*\\)|#[0-9a-f]{3,8}|[a-z]+)'
  const match = new RegExp(
    `^${numberToken}\\s+${numberToken}\\s+${numberToken}(?:\\s+${numberToken})?\\s+${colorToken}$`,
    'i',
  ).exec(shadowWithoutInset)

  if (!match) {
    return createDefaultShadow()
  }

  const spread = match[4] === undefined ? 0 : normalizeNumber(match[4], SHADOW_MIN, SHADOW_MAX)

  return {
    x: normalizeNumber(match[1], SHADOW_MIN, SHADOW_MAX),
    y: normalizeNumber(match[2], SHADOW_MIN, SHADOW_MAX),
    blur: normalizeNumber(match[3], SHADOW_BLUR_MIN, SHADOW_MAX),
    spread,
    color: normalizeColor(match[5]),
  }
}

function serializeShadow(value: ShadowValue) {
  const normalized = {
    x: normalizeNumber(value.x, SHADOW_MIN, SHADOW_MAX),
    y: normalizeNumber(value.y, SHADOW_MIN, SHADOW_MAX),
    blur: normalizeNumber(value.blur, SHADOW_BLUR_MIN, SHADOW_MAX),
    spread: normalizeNumber(value.spread, SHADOW_MIN, SHADOW_MAX),
    color: normalizeColor(value.color),
  }

  if (
    !normalized.x
    && !normalized.y
    && !normalized.blur
    && !normalized.spread
    && normalized.color === DEFAULT_SHADOW_COLOR
  ) {
    return ''
  }

  return `${normalized.x}px ${normalized.y}px ${normalized.blur}px ${normalized.spread}px ${normalized.color}`
}

function normalizeNumber(value: unknown, min: number, max: number) {
  const numericValue = toNumber(value)
  const candidate = numericValue === undefined ? 0 : Math.round(numericValue)

  return Math.min(max, Math.max(min, candidate))
}

function normalizeColor(value: unknown) {
  if (typeof value !== 'string') {
    return DEFAULT_SHADOW_COLOR
  }

  const color = value.trim()
  const hexMatch = /^#([0-9a-f]{3,8})$/i.exec(color)
  if (hexMatch) {
    const hex = hexMatch[1]
    if (hex.length === 3) {
      return `#${hex
        .split('')
        .map(character => character.repeat(2))
        .join('')}`.toUpperCase()
    }

    if (hex.length === 6 || hex.length === 8) {
      return `#${hex.slice(0, 6)}`.toUpperCase()
    }
  }

  const rgbMatch = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+)?\s*\)$/i.exec(
    color,
  )
  if (rgbMatch) {
    return `#${rgbMatch
      .slice(1, 4)
      .map(channel => toHex(Math.min(255, Math.max(0, Math.round(Number(channel))))))
      .join('')}`
  }

  return DEFAULT_SHADOW_COLOR
}

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value !== 'string') {
    return undefined
  }

  const match = /^-?(?:\d+(?:\.\d+)?|\.\d+)(?:[a-z%]+)?$/i.exec(value.trim())
  if (!match) {
    return undefined
  }

  const numericValue = Number.parseFloat(value)
  return Number.isFinite(numericValue) ? numericValue : undefined
}

function toHex(value: number) {
  return value.toString(16).padStart(2, '0').toUpperCase()
}

function createDefaultShadow(): ShadowValue {
  return {
    color: DEFAULT_SHADOW_COLOR,
    x: 0,
    y: 0,
    blur: 0,
    spread: 0,
  }
}
</script>

<style scoped>
.shadow-config {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.shadow-config__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.shadow-config__color-field {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.shadow-config__label {
  flex: 0 0 auto;
  color: var(--dc-color-text-subtle);
  font-size: 12px;
}

.shadow-config__number-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
}

.shadow-config__number-fields :deep(.slider-number-input) {
  gap: 6px;
}

.shadow-config__number-fields :deep(.slider-number-input__input) {
  flex: 0 0 56px;
}
</style>
