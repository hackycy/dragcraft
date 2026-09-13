<template>
  <ADivider
    v-if="text"
    :orientation="resolvedOrientation"
    :dashed="dashed"
    :style="textStyle"
  >
    {{ text }}
  </ADivider>
  <ADivider v-else :dashed="dashed" :style="NO_MARGIN" />
</template>

<script lang="ts" setup>
import { Divider as ADivider } from 'ant-design-vue'
import { computed } from 'vue'

type DividerOrientation = 'left' | 'center' | 'right'

/**
 * prod 靠宿主全局注册用 `<a-divider>`，playground 不注册全局组件，所以显式 import。
 * 用 `ADivider` 这个别名是为了不和"本物料就叫 Divider"混淆。
 *
 * prod 还挂了 `class="!m-0"`（宿主 tailwind 的 `margin: 0 !important`）。playground 没有那套
 * 全局 CSS，这个类在这里是死的；它想清掉的是 ant Divider 自带的 24px 上下外边距，改用内联
 * style 达到同样效果（内联样式本来就胜过 ant 的类规则）。见票据 Answer。
 */
const NO_MARGIN = { margin: '0' } as const

const props = defineProps<{
  text?: string
  orientation?: DividerOrientation
  dashed?: boolean
  textColor?: string
  textFontSize?: number
}>()

const resolvedOrientation = computed<DividerOrientation>(() => {
  if (props.orientation === 'left' || props.orientation === 'right') {
    return props.orientation
  }

  return 'center'
})

const resolvedTextFontSize = computed(() => {
  if (typeof props.textFontSize !== 'number' || !Number.isFinite(props.textFontSize)) {
    return 14
  }

  return Math.min(32, Math.max(10, Math.round(props.textFontSize)))
})

const textStyle = computed(() => ({
  ...NO_MARGIN,
  color:
    typeof props.textColor === 'string' && props.textColor.trim() ? props.textColor : '#333333',
  fontSize: `${resolvedTextFontSize.value}px`,
}))
</script>
