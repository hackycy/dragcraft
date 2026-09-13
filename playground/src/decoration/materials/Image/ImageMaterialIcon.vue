<template>
  <Icon icon="ant-design:picture-outlined" :size="size" />
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
