<template>
  <div class="quad-number-input">
    <div v-if="showLinkedEditor" class="quad-number-input__linked-editor">
      <SliderNumberInput
        :value="normalizedValue.top"
        :min="props.min"
        :max="props.max"
        :disabled="props.disabled"
        @update:value="updateAll"
      />
      <Tooltip title="解除联动">
        <Button
          class="quad-number-input__toggle"
          type="text"
          shape="circle"
          :disabled="props.disabled"
          aria-label="解除联动"
          @click="startIndividualEditing"
        >
          <Icon icon="fluent:link-24-regular" :size="14" />
        </Button>
      </Tooltip>
    </div>

    <div v-else class="quad-number-input__individual-editor">
      <div v-for="edge in edges" :key="edge.key" class="quad-number-input__edge">
        <span class="quad-number-input__edge-label">{{ edge.label }}</span>
        <InputNumber
          class="quad-number-input__edge-input"
          :value="normalizedValue[edge.key]"
          :min="props.min"
          :max="props.max"
          :step="1"
          :precision="0"
          :disabled="props.disabled"
          @update:value="(value) => updateEdge(edge.key, value)"
        />
      </div>
      <Tooltip title="恢复联动">
        <Button
          class="quad-number-input__toggle quad-number-input__toggle--individual"
          type="text"
          shape="circle"
          :disabled="props.disabled"
          aria-label="恢复联动"
          @click="relink"
        >
          <Icon icon="fluent:link-dismiss-24-regular" :size="14" />
        </Button>
      </Tooltip>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Button, InputNumber, Tooltip } from 'ant-design-vue'
import { computed, ref, watch } from 'vue'

import { Icon } from '../icons/Icon'
import SliderNumberInput from './SliderNumberInput.vue'
import {
  DIY_V2_QUAD_MAX,
  DIY_V2_QUAD_MIN,
  isDiyV2QuadLinked,
  normalizeDiyV2QuadNumber,
  parseDiyV2CssQuad,
  type DiyV2QuadValue,
} from './quad'

type DiyV2QuadKind = 'spacing' | 'radius'
type DiyV2QuadEdge = keyof DiyV2QuadValue

const props = withDefaults(
  defineProps<{
    value?: DiyV2QuadValue
    min?: number
    max?: number
    disabled?: boolean
    kind?: DiyV2QuadKind
  }>(),
  {
    min: DIY_V2_QUAD_MIN,
    max: DIY_V2_QUAD_MAX,
    disabled: false,
    kind: 'spacing',
  },
)

const emit = defineEmits<{
  'update:value': [value: DiyV2QuadValue]
}>()

const individualEditing = ref(false)
const normalizedValue = computed(() => parseDiyV2CssQuad(props.value, props.min, props.max))
const isLinked = computed(() => isDiyV2QuadLinked(normalizedValue.value))
const showLinkedEditor = computed(() => isLinked.value && !individualEditing.value)
const edges = computed<ReadonlyArray<{ key: DiyV2QuadEdge, label: string }>>(() =>
  props.kind === 'radius'
    ? [
        { key: 'top', label: '左上' },
        { key: 'right', label: '右上' },
        { key: 'bottom', label: '右下' },
        { key: 'left', label: '左下' },
      ]
    : [
        { key: 'top', label: '上' },
        { key: 'right', label: '右' },
        { key: 'bottom', label: '下' },
        { key: 'left', label: '左' },
      ],
)

watch(isLinked, (linked, previous) => {
  if (linked && previous === false) {
    individualEditing.value = false
  }
})

function updateAll(value: number) {
  const normalized = normalizeDiyV2QuadNumber(value, props.min, props.max)
  emit('update:value', {
    top: normalized,
    right: normalized,
    bottom: normalized,
    left: normalized,
  })
}

function updateEdge(edge: DiyV2QuadEdge, value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return
  }

  emit('update:value', {
    ...normalizedValue.value,
    [edge]: normalizeDiyV2QuadNumber(value, props.min, props.max),
  })
}

function startIndividualEditing() {
  individualEditing.value = true
}

function relink() {
  updateAll(normalizedValue.value.top)
  individualEditing.value = false
}
</script>

<style scoped>
.quad-number-input {
  width: 100%;
}

.quad-number-input__linked-editor {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 28px;
  align-items: center;
  gap: 4px;
}

.quad-number-input__individual-editor {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding-right: 28px;
}

.quad-number-input__edge {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.quad-number-input__edge-label {
  flex: 0 0 auto;
  color: var(--dc-color-text-subtle);
  font-size: 12px;
}

.quad-number-input__edge-input {
  min-width: 0;
  width: 100%;
}

.quad-number-input__toggle {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
}

.quad-number-input__toggle--individual {
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
}
</style>
