<template>
  <nav class="pg-tab-bar" aria-label="底部导航">
    <div
      v-for="(item, index) in resolvedContent"
      :key="`${item.path}:${index}`"
      class="pg-tab-bar__item"
      :class="{ 'is-active': isActive(index) }"
      :style="itemStyle(item, index)"
    >
      <img
        v-if="resolvedIcon(item, index)"
        class="pg-tab-bar__icon"
        :src="resolvedIcon(item, index)"
        alt=""
      >
      <ImagePlaceHolder v-else class="pg-tab-bar__placeholder" :size="14" />
      <span class="pg-tab-bar__name">{{ item.name || '导航' }}</span>
    </div>
  </nav>
</template>

<script lang="ts" setup>
import { computed, type CSSProperties } from 'vue'

import ImagePlaceHolder from '../../components/ImagePlaceHolder.vue'
import { DEFAULT_THEME_COLOR } from '../../context'
import { normalizeTabBarItems, type TabBarItem } from './types'

const DEFAULT_INACTIVE_COLOR = '#666666'

const props = defineProps<{
  content?: TabBarItem[]
  activeIndex?: number
}>()

const resolvedContent = computed(() => normalizeTabBarItems(props.content))

/**
 * prod 用 `useDiyV2Context().pagePath` 判断激活项。playground 无页面概念，改用 `activeIndex`。
 */
const resolvedActiveIndex = computed(() => {
  const count = resolvedContent.value.length
  if (count === 0) {
    return 0
  }

  const candidate
    = typeof props.activeIndex === 'number' && Number.isFinite(props.activeIndex)
      ? props.activeIndex
      : 0

  return Math.min(count - 1, Math.max(0, Math.round(candidate)))
})

function isActive(index: number) {
  return index === resolvedActiveIndex.value
}

function resolvedIcon(item: TabBarItem, index: number) {
  return isActive(index) ? item.activeIcon || item.icon : item.icon
}

function itemStyle(item: TabBarItem, index: number): CSSProperties {
  const active = isActive(index)

  return {
    color: active
      /**
       * prod 这里是 `item.activeColor || globalConfig.themeColor`。playground 用不了那条链路：
       * dragcraft 没有公开 API 让物料预览读取 `globalConfig`（`useMaterialPreviewContext` 未导出），
       * 所以退回到常量。见本物料票据 Answer 的说明。
       */
      ? item.activeColor || DEFAULT_THEME_COLOR
      : item.inactiveColor || DEFAULT_INACTIVE_COLOR,
  }
}
</script>

<style scoped>
.pg-tab-bar {
  display: flex;
  align-items: stretch;
  box-sizing: border-box;
  width: 100%;
  height: 50px;
  min-height: 50px;
  background-color: var(--dc-internal-material-background-color, #ffffff);
  background-image: var(--dc-internal-material-background-image, none);
  background-position: var(--dc-internal-material-background-position, center);
  background-repeat: var(--dc-internal-material-background-repeat, repeat);
  background-size: var(--dc-internal-material-background-size, auto);
}

.pg-tab-bar__item {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  gap: 2px;
  color: #666666;
}

.pg-tab-bar__icon,
.pg-tab-bar__placeholder {
  flex: none;
  width: 22px;
  height: 22px;
}

.pg-tab-bar__icon {
  display: block;
  object-fit: contain;
}

.pg-tab-bar__placeholder {
  overflow: hidden;
  border-radius: 2px;
}

.pg-tab-bar__name {
  display: block;
  max-width: 100%;
  overflow: hidden;
  font-size: 10px;
  line-height: 13px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
