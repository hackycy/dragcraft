<template>
  <div class="image-placeholder">
    <Icon icon="fluent:image-24-regular" :size="size" color="#e6f1ff" />
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '../icons/Icon'

withDefaults(
  defineProps<{
    size?: number
  }>(),
  {
    size: 48,
  },
)
</script>

<style scoped>
.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  color: #bfbfbf;
  background: #f4fcff;
}
</style>
