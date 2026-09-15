<template>
  <Icon icon="fluent:image-24-regular" :size="size" />
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
