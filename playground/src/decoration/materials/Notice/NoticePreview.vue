<template>
  <div class="pg-notice" :class="`pg-notice--${resolvedStyle}`">
    <div v-if="shouldShowNoticeIcon" class="pg-notice__icon" :style="iconStyle">
      <img v-if="resolvedNoticeIcon" :src="resolvedNoticeIcon" alt="">
      <Icon v-else icon="bx:bxs-volume-full" :size="resolvedTextFontSize" />
    </div>

    <div class="pg-notice__content" :style="textStyle">
      <Transition v-if="resolvedStyle === 'style1'" :name="styleOneTransitionName" mode="out-in">
        <span
          :key="styleOneContentKey"
          class="pg-notice__text pg-notice__text--single-line"
        >
          {{ styleOneContent }}
        </span>
      </Transition>

      <div
        v-else-if="resolvedStyleTwoScrolling"
        class="pg-notice__marquee"
        :style="marqueeStyle"
      >
        <span class="pg-notice__marquee-text">{{ styleTwoContent }}</span>
      </div>

      <span
        v-else
        class="pg-notice__text"
        :class="
          resolvedStyleTwoShowAll
            ? 'pg-notice__text--all'
            : 'pg-notice__text--single-line'
        "
      >
        {{ styleTwoContent }}
      </span>
    </div>

    <span
      v-if="resolvedButtonType !== 'none'"
      class="pg-notice__button"
      :style="buttonStyle"
    >
      <template v-if="resolvedButtonType === 'text'">{{ resolvedButtonText }}</template>
      <img v-else-if="resolvedButtonIcon" :src="resolvedButtonIcon" alt="">
      <Icon v-else icon="ant-design:right-outlined" :size="16" />
    </span>
  </div>
</template>

<script lang="ts" setup>
import { computed, onUnmounted, ref, watch, type CSSProperties } from 'vue'

import { Icon } from '../../icons/Icon'
import {
  normalizeNoticeItems,
  numberValue,
  type NoticeButtonType,
  type NoticeStyle,
  type NoticeTextStyle,
} from './types'

const props = defineProps<{
  displayStyle?: NoticeStyle
  showNoticeIcon?: boolean
  noticeIcon?: string
  textColor?: string
  textFontSize?: number
  textStyle?: NoticeTextStyle
  items?: unknown
  content?: string
  buttonType?: NoticeButtonType
  buttonText?: string
  buttonIcon?: string
  buttonLink?: string
  buttonFontSize?: number
  buttonTextStyle?: NoticeTextStyle
  styleOneScrollMode?: 'vertical' | 'horizontal'
  styleOneInterval?: number
  styleTwoShowAll?: boolean
  styleTwoScrolling?: boolean
  styleTwoDuration?: number
}>()

const activeItemIndex = ref(0)
let switchTimer: ReturnType<typeof setInterval> | undefined

const resolvedStyle = computed<NoticeStyle>(() =>
  props.displayStyle === 'style2' ? 'style2' : 'style1',
)
const shouldShowNoticeIcon = computed(() => props.showNoticeIcon !== false)
const resolvedNoticeIcon = computed(() => stringValue(props.noticeIcon))
const resolvedTextColor = computed(() => stringValue(props.textColor) || '#8c5a00')
const resolvedTextFontSize = computed(() => numberValue(props.textFontSize, 14, 10, 32))
const resolvedItems = computed(() =>
  normalizeNoticeItems(props.items).filter(item => item.enabled),
)
const resolvedStyleOneInterval = computed(() => numberValue(props.styleOneInterval, 3, 1, 100))
const resolvedStyleTwoDuration = computed(() => numberValue(props.styleTwoDuration, 10, 1, 100))
const resolvedStyleTwoShowAll = computed(() => props.styleTwoShowAll !== false)
const resolvedStyleTwoScrolling = computed(() => props.styleTwoScrolling === true)
const resolvedButtonType = computed<NoticeButtonType>(() => {
  if (props.buttonType === 'text' || props.buttonType === 'icon') {
    return props.buttonType
  }

  return 'none'
})
const resolvedButtonText = computed(() => stringValue(props.buttonText) || '更多')
const resolvedButtonIcon = computed(() => stringValue(props.buttonIcon))
const resolvedButtonFontSize = computed(() => numberValue(props.buttonFontSize, 13, 10, 32))
const currentStyleOneItem = computed(() => resolvedItems.value[activeItemIndex.value])
const styleOneContent = computed(() => currentStyleOneItem.value?.title || '暂无公告')
const styleOneContentKey = computed(() => `${activeItemIndex.value}-${styleOneContent.value}`)
const styleOneTransitionName = computed(() =>
  props.styleOneScrollMode === 'horizontal' ? 'notice-slide-horizontal' : 'notice-slide-vertical',
)
const styleTwoContent = computed(() => stringValue(props.content) || '暂无公告')
const textStyle = computed<CSSProperties>(() =>
  createTextStyle(resolvedTextColor.value, resolvedTextFontSize.value, props.textStyle),
)
const iconStyle = computed<CSSProperties>(() => {
  const size = `${resolvedTextFontSize.value}px`
  return { color: resolvedTextColor.value, width: size, height: size }
})
const buttonStyle = computed<CSSProperties>(() =>
  createTextStyle('#b06f00', resolvedButtonFontSize.value, props.buttonTextStyle),
)
const marqueeStyle = computed(() => ({
  '--dc-internal-notice-marquee-duration': `${resolvedStyleTwoDuration.value}s`,
}))

watch([resolvedStyle, resolvedItems, resolvedStyleOneInterval], restartStyleOneTimer, {
  immediate: true,
})

onUnmounted(stopStyleOneTimer)

function restartStyleOneTimer() {
  stopStyleOneTimer()
  activeItemIndex.value = 0

  if (resolvedStyle.value !== 'style1' || resolvedItems.value.length <= 1) {
    return
  }

  switchTimer = setInterval(() => {
    activeItemIndex.value = (activeItemIndex.value + 1) % resolvedItems.value.length
  }, resolvedStyleOneInterval.value * 1000)
}

function stopStyleOneTimer() {
  if (!switchTimer) {
    return
  }

  clearInterval(switchTimer)
  switchTimer = undefined
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function createTextStyle(
  color: string,
  fontSize: number,
  textStyle: NoticeTextStyle | undefined,
): CSSProperties {
  return {
    color,
    fontSize: `${fontSize}px`,
    fontStyle: textStyle === 'italic' ? 'italic' : 'normal',
    fontWeight: textStyle === 'bold' ? 700 : 400,
    lineHeight: `${Math.max(fontSize, 20)}px`,
  }
}
</script>

<style scoped>
.pg-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
}

.pg-notice__icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.pg-notice__icon img,
.pg-notice__button img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.pg-notice__content {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 14px;
  line-height: 20px;
}

.pg-notice__text {
  display: block;
  min-width: 0;
}

.pg-notice__text--single-line {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pg-notice__text--all {
  overflow-wrap: anywhere;
  white-space: normal;
}

/*
 * prod 这里用的是 `vue3-marquee`（`duration` 秒、`clone: false`、默认 direction: left）。
 * 为不新增依赖，用纯 CSS 复刻同一行为：文本用 `padding-left: 100%` 从容器右缘起步，
 * 再把自己整体宽度（含这段 padding，即"容器宽 + 文本宽"）向左平移出去，行完从头开始。
 * 时长通过 `--dc-internal-notice-marquee-duration` 传入。
 */
.pg-notice__marquee {
  width: 100%;
  overflow: hidden;
}

.pg-notice__marquee-text {
  display: inline-block;
  padding-left: 100%;
  white-space: nowrap;
  animation: pg-notice-marquee var(--dc-internal-notice-marquee-duration, 10s) linear infinite;
}

@keyframes pg-notice-marquee {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(-100%);
  }
}

.pg-notice__button {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  max-width: 96px;
  min-height: 20px;
  overflow: hidden;
  color: #b06f00;
  font-size: 13px;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pg-notice__button img {
  width: 16px;
  height: 16px;
}

.notice-slide-vertical-enter-active,
.notice-slide-vertical-leave-active,
.notice-slide-horizontal-enter-active,
.notice-slide-horizontal-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.notice-slide-vertical-enter-from {
  opacity: 0;
  transform: translateY(100%);
}

.notice-slide-vertical-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

.notice-slide-horizontal-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notice-slide-horizontal-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}
</style>
