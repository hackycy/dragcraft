<template>
  <div class="color-field">
    <input
      class="color-field__swatch"
      type="color"
      :value="swatchValue"
      :disabled="props.disabled"
      @input="handleSwatchInput"
    >
    <Input
      class="color-field__text"
      :value="props.value ?? ''"
      :disabled="props.disabled"
      @update:value="handleTextInput"
    />
  </div>
</template>

<script lang="ts" setup>
import { Input } from 'ant-design-vue'
import { computed } from 'vue'

/**
 * prod 用宿主 vben 的 ColorPicker（`/@/components/Form`）。playground 的
 * ant-design-vue 4.2.6 不提供 ColorPicker，所以这里用原生取色器 + 文本输入自建一个，
 * 契约与其它检查器字段一致（`value` / `update:value`）。
 */
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

const SWATCH_FALLBACK = '#000000'
const HEX_COLOR = /^#[0-9a-f]{6}$/i

// 原生取色器只接受 #rrggbb，其它写法（rgba()、8 位 hex、transparent）退化为默认色。
const swatchValue = computed(() => {
  const value = props.value?.trim() ?? ''
  return HEX_COLOR.test(value) ? value : SWATCH_FALLBACK
})

function handleSwatchInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:value', target.value.toUpperCase())
}

function handleTextInput(value: unknown) {
  if (typeof value === 'string') {
    emit('update:value', value)
  }
}
</script>

<style scoped>
.color-field {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  width: 100%;
}

.color-field__swatch {
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid var(--dc-color-border);
  border-radius: 4px;
  background: none;
  cursor: pointer;
}

.color-field__swatch:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.color-field__text {
  flex: 1 1 0;
  min-width: 0;
}
</style>
