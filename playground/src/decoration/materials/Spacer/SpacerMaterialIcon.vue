<template>
  <Icon icon="ant-design:column-height-outlined" :size="size" />
</template>

<script lang="ts" setup>
import { Icon } from '../../icons/Icon'

withDefaults(
  defineProps<{
    size?: number
  }>(),
  {
    size: 20,
  },
)
</script>
