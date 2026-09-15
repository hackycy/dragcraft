<template>
  <div class="pg-title">
    <div
      class="pg-title__main"
      :class="{ 'pg-title__main--centered': resolvedTitleCentered }"
    >
      <img v-if="resolvedIcon && hasText" class="pg-title__icon" :src="resolvedIcon" alt="">

      <div
        class="pg-title__texts"
        :class="{ 'pg-title__texts--inline': resolvedSameLine }"
      >
        <span v-if="resolvedTitle" class="pg-title__text" :style="titleStyle">
          {{ resolvedTitle }}
        </span>
        <span v-if="resolvedSubtitle" class="pg-title__text" :style="subtitleStyle">
          {{ resolvedSubtitle }}
        </span>
      </div>
    </div>

    <span v-if="resolvedShowMore" class="pg-title__more" :style="moreStyle">
      <span class="pg-title__more-text">{{ resolvedMoreText }}</span>
      <Icon class="pg-title__more-icon" icon="fluent:chevron-right-24-regular" :size="12" />
    </span>
  </div>
</template>

<script lang="ts" setup>
import { computed, type CSSProperties } from 'vue'

import { Icon } from '../../icons/Icon'
import { TITLE_DEFAULT_PROPS, type TitleTextStyle } from './types'

const MIN_FONT_SIZE = 10
const MAX_FONT_SIZE = 32

const props = defineProps<{
  title?: string
  titleLink?: string
  titleCentered?: boolean
  icon?: string
  subtitle?: string
  subtitleCentered?: boolean
  sameLine?: boolean
  titleColor?: string
  titleTextStyle?: TitleTextStyle
  titleFontSize?: number
  subtitleColor?: string
  subtitleTextStyle?: TitleTextStyle
  subtitleFontSize?: number
  showMore?: boolean
  moreText?: string
  moreLink?: string
  moreColor?: string
  moreTextStyle?: TitleTextStyle
  moreFontSize?: number
}>()

const resolvedTitle = computed(() => resolveOptionalString(props.title, TITLE_DEFAULT_PROPS.title))
const resolvedSubtitle = computed(() =>
  resolveOptionalString(props.subtitle, TITLE_DEFAULT_PROPS.subtitle),
)
const resolvedIcon = computed(() => stringValue(props.icon))
const resolvedSameLine = computed(() => props.sameLine === true)
const resolvedTitleCentered = computed(() => props.titleCentered === true)
const hasText = computed(() => Boolean(resolvedTitle.value || resolvedSubtitle.value))
const resolvedShowMore = computed(() => props.showMore === true)
const resolvedMoreText = computed(
  () => stringValue(props.moreText) || TITLE_DEFAULT_PROPS.moreText,
)

const titleStyle = computed<CSSProperties>(() =>
  createTextStyle(
    props.titleColor,
    props.titleTextStyle,
    props.titleFontSize,
    resolvedSameLine.value ? 'left' : props.titleCentered === true ? 'center' : 'left',
    TITLE_DEFAULT_PROPS.titleColor,
    TITLE_DEFAULT_PROPS.titleFontSize,
  ),
)
const subtitleStyle = computed<CSSProperties>(() =>
  createTextStyle(
    props.subtitleColor,
    props.subtitleTextStyle,
    props.subtitleFontSize,
    resolvedSameLine.value ? 'left' : props.subtitleCentered === true ? 'center' : 'left',
    TITLE_DEFAULT_PROPS.subtitleColor,
    TITLE_DEFAULT_PROPS.subtitleFontSize,
  ),
)
const moreStyle = computed<CSSProperties>(() =>
  createTextStyle(
    props.moreColor,
    props.moreTextStyle,
    props.moreFontSize,
    'right',
    TITLE_DEFAULT_PROPS.moreColor,
    TITLE_DEFAULT_PROPS.moreFontSize,
  ),
)

function createTextStyle(
  color: string | undefined,
  textStyle: TitleTextStyle | undefined,
  fontSize: number | undefined,
  textAlign: CSSProperties['textAlign'],
  fallbackColor: string,
  fallbackFontSize: number,
): CSSProperties {
  return {
    color: resolveColor(color, fallbackColor),
    fontSize: `${resolveFontSize(fontSize, fallbackFontSize)}px`,
    fontStyle: textStyle === 'italic' ? 'italic' : 'normal',
    fontWeight: textStyle === 'bold' ? 700 : 400,
    textAlign,
  }
}

function resolveFontSize(value: number | undefined, fallback: number) {
  const candidate = typeof value === 'number' && Number.isFinite(value) ? value : fallback

  return Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, Math.round(candidate)))
}

function resolveColor(value: string | undefined, fallback: string) {
  return stringValue(value) || fallback
}

function resolveOptionalString(value: string | undefined, fallback: string) {
  return value === undefined ? fallback : stringValue(value)
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}
</script>

<style scoped>
.pg-title {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
}

.pg-title__main {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  min-width: 0;
}

.pg-title__main--centered {
  justify-content: center;
}

.pg-title__main--centered .pg-title__texts {
  flex: 0 1 auto;
  max-width: 100%;
}

.pg-title__icon {
  display: block;
  flex: none;
  width: 20px;
  height: 20px;
  margin-right: 8px;
  object-fit: contain;
}

.pg-title__texts {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
}

.pg-title__texts--inline {
  flex-direction: row;
  align-items: baseline;
  gap: 8px;
}

.pg-title__text {
  display: block;
  min-width: 0;
  overflow: hidden;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pg-title__texts--inline .pg-title__text {
  flex: 0 1 auto;
}

.pg-title__more {
  display: inline-flex;
  flex: none;
  align-items: center;
  box-sizing: border-box;
  max-width: 96px;
  margin-left: 8px;
  gap: 4px;
  line-height: 1.4;
}

.pg-title__more-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pg-title__more-icon {
  flex: none;
}
</style>
