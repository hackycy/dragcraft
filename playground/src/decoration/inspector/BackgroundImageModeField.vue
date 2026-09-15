<template>
  <div class="pg-background-image-mode-field">
    <RadioGroup
      class="pg-background-image-mode-field__group"
      :value="selectedValue"
      button-style="solid"
      :disabled="props.disabled"
      @update:value="handleChange"
    >
      <Tooltip v-for="option in modeOptions" :key="option.value" :title="option.tooltip">
        <RadioButton
          :value="option.value"
          :aria-label="option.label"
          class="pg-background-image-mode-field__button"
        >
          <Icon :icon="option.icon" :size="14" aria-hidden="true" />
        </RadioButton>
      </Tooltip>
    </RadioGroup>
  </div>
</template>

<script lang="ts" setup>
import { RadioButton, RadioGroup, Tooltip } from 'ant-design-vue'
import { computed } from 'vue'

import { DEFAULT_BACKGROUND_IMAGE_MODE, type DiyV2BackgroundImageMode } from '../context'
import { Icon } from '../icons/Icon'

const props = withDefaults(
  defineProps<{
    value?: DiyV2BackgroundImageMode
    disabled?: boolean
  }>(),
  { disabled: false },
)

const emit = defineEmits<{
  'update:value': [value: DiyV2BackgroundImageMode]
}>()

const modeOptions: ReadonlyArray<{
  label: string
  value: DiyV2BackgroundImageMode
  tooltip: string
  icon: string
}> = [
  {
    label: '居上',
    value: 'top',
    tooltip: '居上：图片完整显示并贴近画布顶部',
    icon: 'fluent:align-top-24-regular',
  },
  {
    label: '居下',
    value: 'bottom',
    tooltip: '居下：图片完整显示并贴近画布底部',
    icon: 'fluent:align-bottom-24-regular',
  },
  {
    label: '居中',
    value: 'center',
    tooltip: '居中：图片完整显示并保持居中',
    icon: 'fluent:align-center-vertical-24-regular',
  },
  {
    label: '平铺',
    value: 'repeat',
    tooltip: '平铺：按图片原尺寸重复铺设',
    icon: 'fluent:grid-24-regular',
  },
  {
    label: '铺满',
    value: 'cover',
    tooltip: '铺满：覆盖整个画布，可能裁切图片边缘',
    icon: 'fluent:full-screen-maximize-24-regular',
  },
]

const selectedValue = computed<DiyV2BackgroundImageMode>(() => {
  return modeOptions.some(option => option.value === props.value)
    ? (props.value as DiyV2BackgroundImageMode)
    : DEFAULT_BACKGROUND_IMAGE_MODE
})

function handleChange(value: unknown) {
  if (modeOptions.some(option => option.value === value)) {
    emit('update:value', value as DiyV2BackgroundImageMode)
  }
}
</script>

<style scoped>
.pg-background-image-mode-field {
  width: 100%;
}

.pg-background-image-mode-field__group {
  display: flex;
  width: 100%;
}

.pg-background-image-mode-field__button {
  display: inline-flex;
  min-width: 0;
  flex: 1 1 0;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
}
</style>
