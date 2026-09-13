<template>
  <DesignerViewportPortal>
    <div class="pg-floating-button-frame">
      <slot />
    </div>
  </DesignerViewportPortal>
</template>

<script lang="ts" setup>
import { DesignerViewportPortal } from '@dragcraft/designer'
</script>

<style scoped>
.pg-floating-button-frame {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/*
 * viewport-plane 会对其直接子元素强制恢复 pointer-events，浮层整体必须保持点击穿透。
 *
 * `.dc-canvas-surface__viewport-plane` 是 dragcraft 的**内部实现类**（由
 * presentation/canvas-surface.ts 产出，不是公开契约）。生产切片也是这么写的，此处照搬。
 * 它随 dragcraft 升级有断裂风险：若某次升级后这个类名变了，症状是浮层挡住画布点击。
 * 见本物料票据的 Answer。
 */
.dc-canvas-surface__viewport-plane > .pg-floating-button-frame {
  pointer-events: none !important;
}
</style>
