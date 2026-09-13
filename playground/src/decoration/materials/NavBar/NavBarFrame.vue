<template>
  <DesignerViewportPortal>
    <div ref="navBarRef" class="pg-nav-bar-frame">
      <slot />
    </div>
  </DesignerViewportPortal>
</template>

<script lang="ts" setup>
import { DesignerViewportPortal, useSurfaceReservation } from '@dragcraft/designer'
import { ref } from 'vue'

const navBarRef = ref<HTMLElement | null>(null)

useSurfaceReservation(navBarRef, { edge: 'block-start', fallbackSize: 44 })
</script>

<style scoped>
.pg-nav-bar-frame {
  position: absolute;
  inset-block-start: 0;
  inset-inline: 0;
  z-index: 1;
  height: 44px;
}

/* .dc-node 是 dragcraft 给节点 wrapper 加的公共类（presentation/use-material-node.ts） */
.pg-nav-bar-frame :deep(.dc-node) {
  height: 100%;
}
</style>
