<template>
  <DesignerViewportPortal>
    <div ref="tabBarRef" class="pg-tab-bar-frame">
      <slot />
    </div>
  </DesignerViewportPortal>
</template>

<script lang="ts" setup>
import { DesignerViewportPortal, useSurfaceReservation } from '@dragcraft/designer'
import { ref } from 'vue'

const tabBarRef = ref<HTMLElement | null>(null)

useSurfaceReservation(tabBarRef, { edge: 'block-end', fallbackSize: 50 })
</script>

<style scoped>
.pg-tab-bar-frame {
  position: absolute;
  inset-block-end: 0;
  inset-inline: 0;
  z-index: 2;
  height: 50px;
}

/* .dc-node 是 dragcraft 给节点 wrapper 加的公共类（presentation/use-material-node.ts） */
.pg-tab-bar-frame :deep(.dc-node) {
  height: 100%;
}
</style>
