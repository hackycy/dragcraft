<template>
  <div class="pg-navigation-group">
    <div v-if="resolvedDisplayMode === 'fixed'" class="pg-navigation-group__page">
      <div class="pg-navigation-group__grid" :style="gridStyle">
        <div v-for="(item, index) in pages[0]" :key="`${index}-${item.title}`" class="pg-navigation-group__item">
          <div class="pg-navigation-group__item-content" :style="itemContentStyle">
            <div v-if="showImage" class="pg-navigation-group__image" :style="imageStyle">
              <img v-if="item.icon" :src="item.icon" :style="imageContentStyle" alt="">
              <ImagePlaceHolder v-else :size="Math.max(16, Math.round(resolvedImageSize / 2))" />
            </div>
            <span v-if="showTitle" class="pg-navigation-group__title" :style="titleStyle">
              {{ item.title }}
            </span>
          </div>
          <span v-if="item.badge.enabled" class="pg-navigation-group__badge" :style="badgeStyle(item)">
            <img v-if="item.badge.type === 'image' && item.badge.image" :src="item.badge.image" alt="">
            <template v-else>{{ item.badge.text }}</template>
          </span>
        </div>
      </div>
    </div>

    <Carousel
      v-else
      ref="carouselRef"
      class="pg-navigation-group__carousel"
      :dots="false"
      :autoplay="resolvedAutoplay"
      :autoplay-speed="resolvedInterval * 1000"
      :effect="resolvedScrollMode"
      :infinite="pageCount > 1"
      :after-change="handlePageChange"
    >
      <div v-for="(page, pageIndex) in pages" :key="pageIndex" class="pg-navigation-group__page">
        <div class="pg-navigation-group__grid" :style="gridStyle">
          <div v-for="(item, index) in page" :key="`${index}-${item.title}`" class="pg-navigation-group__item">
            <div class="pg-navigation-group__item-content" :style="itemContentStyle">
              <div v-if="showImage" class="pg-navigation-group__image" :style="imageStyle">
                <img v-if="item.icon" :src="item.icon" :style="imageContentStyle" alt="">
                <ImagePlaceHolder v-else :size="Math.max(16, Math.round(resolvedImageSize / 2))" />
              </div>
              <span v-if="showTitle" class="pg-navigation-group__title" :style="titleStyle">
                {{ item.title }}
              </span>
            </div>
            <span v-if="item.badge.enabled" class="pg-navigation-group__badge" :style="badgeStyle(item)">
              <img v-if="item.badge.type === 'image' && item.badge.image" :src="item.badge.image" alt="">
              <template v-else>{{ item.badge.text }}</template>
            </span>
          </div>
        </div>
      </div>
    </Carousel>

    <NavigationIndicator
      v-if="shouldShowIndicator"
      :count="pageCount"
      :active="activePage"
      :position="resolvedIndicatorPosition"
      :align="resolvedIndicatorAlign"
      :indicator-style="resolvedIndicatorStyle"
      :active-color="resolvedIndicatorActiveColor"
      :inactive-color="resolvedIndicatorInactiveColor"
      :size="resolvedIndicatorSize"
      :radius="resolvedIndicatorRadius"
      :margin="resolvedIndicatorMargin"
      @select="handleIndicatorSelect"
    />
  </div>
</template>

<script lang="ts" setup>
import { Carousel } from 'ant-design-vue'
import { computed, ref, watch, type CSSProperties } from 'vue'

import ImagePlaceHolder from '../../components/ImagePlaceHolder.vue'
import NavigationIndicator from '../../components/NavigationIndicator.vue'
import {
  NAVIGATION_GROUP_DEFAULT_PROPS,
  normalizeNavigationItems,
  numberValue,
  type NavigationDisplayMode,
  type NavigationDisplayStyle,
  type NavigationIndicatorAlign,
  type NavigationIndicatorPosition,
  type NavigationIndicatorStyle,
  type NavigationItem,
  type NavigationObjectFit,
  type NavigationScrollMode,
  type NavigationTitleTextStyle,
} from './types'

const props = defineProps<{
  navigationStyle?: NavigationDisplayStyle
  columnCount?: number
  displayMode?: NavigationDisplayMode
  rowCount?: number
  content?: NavigationItem[]
  imageTextGap?: number
  imageRadius?: number
  imageSize?: number
  objectFit?: NavigationObjectFit
  titleColor?: string
  titleTextStyle?: NavigationTitleTextStyle
  titleFontSize?: number
  autoplay?: boolean
  interval?: number
  scrollMode?: NavigationScrollMode
  showIndicator?: boolean
  indicatorPosition?: NavigationIndicatorPosition
  indicatorAlign?: NavigationIndicatorAlign
  indicatorStyle?: NavigationIndicatorStyle
  indicatorActiveColor?: string
  indicatorInactiveColor?: string
  indicatorSize?: number
  indicatorRadius?: number
  indicatorMargin?: number
}>()

const carouselRef = ref<{ goTo: (slide: number, dontAnimate?: boolean) => void }>()
const activePage = ref(0)

const resolvedNavigationStyle = computed<NavigationDisplayStyle>(() => {
  if (props.navigationStyle === 'image' || props.navigationStyle === 'text') {
    return props.navigationStyle
  }

  return NAVIGATION_GROUP_DEFAULT_PROPS.navigationStyle
})
const resolvedColumnCount = computed(() =>
  props.columnCount === 3 || props.columnCount === 5 ? props.columnCount : 4,
)
const resolvedDisplayMode = computed<NavigationDisplayMode>(() =>
  props.displayMode === 'paged' ? 'paged' : 'fixed',
)
const resolvedRowCount = computed(() => numberValue(props.rowCount, 1, 1, 4))
const resolvedImageTextGap = computed(() => numberValue(props.imageTextGap, 6, 0, 48))
const resolvedImageRadius = computed(() => numberValue(props.imageRadius, 0, 0, 50))
const resolvedImageSize = computed(() => numberValue(props.imageSize, 48, 16, 160))
const resolvedObjectFit = computed<NavigationObjectFit>(() => {
  if (props.objectFit === 'contain' || props.objectFit === 'fill') {
    return props.objectFit
  }

  return NAVIGATION_GROUP_DEFAULT_PROPS.objectFit
})
const resolvedTitleFontSize = computed(() => numberValue(props.titleFontSize, 14, 10, 32))
const resolvedInterval = computed(() => numberValue(props.interval, 3, 1, 100))
const resolvedScrollMode = computed<NavigationScrollMode>(() =>
  props.scrollMode === 'fade' ? 'fade' : 'scrollx',
)
const resolvedIndicatorPosition = computed<NavigationIndicatorPosition>(() => {
  if (props.indicatorPosition === 'top' || props.indicatorPosition === 'left' || props.indicatorPosition === 'right') {
    return props.indicatorPosition
  }

  return 'bottom'
})
const resolvedIndicatorAlign = computed<NavigationIndicatorAlign>(() => {
  if (props.indicatorAlign === 'start' || props.indicatorAlign === 'end') {
    return props.indicatorAlign
  }

  return 'center'
})
const resolvedIndicatorStyle = computed<NavigationIndicatorStyle>(() => {
  if (props.indicatorStyle === 'bar' || props.indicatorStyle === 'number') {
    return props.indicatorStyle
  }

  return 'dot'
})
const resolvedIndicatorActiveColor = computed(() => resolveColor(props.indicatorActiveColor, '#1677ff'))
const resolvedIndicatorInactiveColor = computed(() => resolveColor(props.indicatorInactiveColor, '#d9d9d9'))
const resolvedIndicatorSize = computed(() => numberValue(props.indicatorSize, 8, 4, 48))
const resolvedIndicatorRadius = computed(() => numberValue(props.indicatorRadius, 8, 0, 50))
const resolvedIndicatorMargin = computed(() => numberValue(props.indicatorMargin, 8, 0, 100))
const resolvedContent = computed(() => normalizeNavigationItems(props.content))
const showImage = computed(() => resolvedNavigationStyle.value !== 'text')
const showTitle = computed(() => resolvedNavigationStyle.value !== 'image')
const itemsPerPage = computed(() => resolvedColumnCount.value * resolvedRowCount.value)

const pages = computed(() => {
  if (resolvedDisplayMode.value === 'fixed') {
    return [resolvedContent.value]
  }

  const result: NavigationItem[][] = []
  for (let index = 0; index < resolvedContent.value.length; index += itemsPerPage.value) {
    result.push(resolvedContent.value.slice(index, index + itemsPerPage.value))
  }

  return result.length ? result : [[]]
})

const pageCount = computed(() => pages.value.length)
const resolvedAutoplay = computed(
  () => resolvedDisplayMode.value === 'paged' && props.autoplay === true && pageCount.value > 1,
)
const shouldShowIndicator = computed(
  () => resolvedDisplayMode.value === 'paged' && props.showIndicator !== false && pageCount.value > 1,
)

const imageStyle = computed<CSSProperties>(() => ({
  width: `${resolvedImageSize.value}px`,
  height: `${resolvedImageSize.value}px`,
  borderRadius: `${resolvedImageRadius.value}px`,
}))
const imageContentStyle = computed<CSSProperties>(() => ({ objectFit: resolvedObjectFit.value }))
const titleStyle = computed<CSSProperties>(() => ({
  color: typeof props.titleColor === 'string' && props.titleColor.trim() ? props.titleColor : '#333333',
  fontSize: `${resolvedTitleFontSize.value}px`,
  fontStyle: props.titleTextStyle === 'italic' ? 'italic' : 'normal',
  fontWeight: props.titleTextStyle === 'bold' ? 700 : 400,
  lineHeight: 1.4,
}))
const itemContentStyle = computed<CSSProperties>(() => ({
  gap: showImage.value && showTitle.value ? `${resolvedImageTextGap.value}px` : '0',
}))
const gridStyle = computed<CSSProperties>(() => {
  const contentHeight
    = (showImage.value ? resolvedImageSize.value : 0)
      + (showImage.value && showTitle.value ? resolvedImageTextGap.value : 0)
      + (showTitle.value ? Math.ceil(resolvedTitleFontSize.value * 1.4) : 0)

  return {
    gridTemplateColumns: `repeat(${resolvedColumnCount.value}, minmax(0, 1fr))`,
    minHeight: `${resolvedRowCount.value * contentHeight + Math.max(0, resolvedRowCount.value - 1) * 16}px`,
  }
})
watch([pageCount, resolvedDisplayMode], () => {
  const nextPage = Math.min(activePage.value, Math.max(0, pageCount.value - 1))
  activePage.value = nextPage

  if (resolvedDisplayMode.value === 'paged') {
    carouselRef.value?.goTo(nextPage, true)
  }
})

function badgeStyle(item: NavigationItem): CSSProperties {
  return {
    top: `${item.badge.offsetTop}px`,
    right: `${item.badge.offsetRight}px`,
    backgroundColor: item.badge.backgroundColor,
    borderRadius: `${item.badge.radius}px`,
  }
}

function handlePageChange(index: number) {
  activePage.value = index
}

function handleIndicatorSelect(index: number) {
  activePage.value = index
  carouselRef.value?.goTo(index)
}

function resolveColor(value: string | undefined, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback
}
</script>

<style scoped>
.pg-navigation-group {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
}

.pg-navigation-group__page {
  box-sizing: border-box;
  width: 100%;
  padding: 8px 12px;
}

.pg-navigation-group__grid {
  display: grid;
  gap: 16px 8px;
  width: 100%;
}

.pg-navigation-group__item {
  position: relative;
  display: flex;
  justify-content: center;
  min-width: 0;
  padding: 4px 0;
}

.pg-navigation-group__item-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  max-width: 100%;
}

.pg-navigation-group__image {
  position: relative;
  flex: none;
  overflow: hidden;
}

.pg-navigation-group__image img {
  display: block;
  width: 100%;
  height: 100%;
}

.pg-navigation-group__title {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pg-navigation-group__badge {
  position: absolute;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-width: 16px;
  min-height: 16px;
  max-width: calc(100% - 4px);
  padding: 1px 4px;
  overflow: hidden;
  color: #fff;
  font-size: 10px;
  line-height: 14px;
  white-space: nowrap;
}

.pg-navigation-group__badge img {
  display: block;
  width: auto;
  max-width: 40px;
  height: 20px;
  object-fit: contain;
}

.pg-navigation-group__carousel :deep(.slick-list),
.pg-navigation-group__carousel :deep(.slick-track),
.pg-navigation-group__carousel :deep(.slick-slide > div) {
  height: 100%;
}
</style>
