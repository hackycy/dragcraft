<template>
  <Icon icon="material-symbols:page-header" :size="size" />
</template>

<script lang="ts" setup>
import { Icon } from '../../icons/Icon'

/**
 * prod 里 NavBar 是隐藏的系统物料，没有 MaterialIcon 文件。playground 让它变成面板里可见的
 * 普通物料，所以需要图标；字形由 02 选定（见 research/iconify-glyphs.md 的选型理由）。
 */
withDefaults(
  defineProps<{
    size?: number
  }>(),
  {
    size: 20,
  },
)
</script>
