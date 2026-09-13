<template>
  <div class="slider-number-input">
    <Slider
      class="slider-number-input__slider"
      :value="resolvedValue"
      :min="props.min"
      :max="props.max"
      :step="1"
      :disabled="props.disabled"
      @update:value="handleValueChange"
    />
    <InputNumber
      class="slider-number-input__input"
      :value="resolvedValue"
      :min="props.min"
      :max="props.max"
      :step="1"
      :precision="0"
      :disabled="props.disabled"
      @update:value="handleValueChange"
    />
  </div>
</template>

<script lang="ts" setup>
import { InputNumber, Slider } from 'ant-design-vue'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    value?: number
    min?: number
    max?: number
    disabled?: boolean
  }>(),
  {
    min: 0,
    max: 100,
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:value': [value: number]
}>()

const resolvedValue = computed(() => clampValue(props.value))

function handleValueChange(value: any) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return
  }

  emit('update:value', clampValue(value))
}

function clampValue(value: number | undefined) {
  const candidate = typeof value === 'number' && Number.isFinite(value) ? value : props.min

  return Math.min(props.max, Math.max(props.min, Math.round(candidate)))
}
</script>

<style scoped>
.slider-number-input {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  width: 100%;
}

.slider-number-input__slider {
  flex: 2 1 0;
  min-width: 0;
}

.slider-number-input__input {
  flex: 1 1 0;
  min-width: 0;
  width: 100%;
}
</style>
