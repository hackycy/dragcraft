<template>
  <div class="pg-nav-bar">
    <span class="pg-nav-bar__title">{{ title }}</span>
    <span class="pg-nav-bar__capsule" aria-hidden="true">
      <span class="pg-nav-bar__capsule-button">
        <span class="pg-nav-bar__capsule-dots" />
      </span>
      <span class="pg-nav-bar__capsule-divider" />
      <span class="pg-nav-bar__capsule-button">
        <span class="pg-nav-bar__capsule-circle" />
      </span>
    </span>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  title?: string
}>()
</script>

<style scoped>
.pg-nav-bar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 100%;
  height: 44px;
  min-height: 44px;
  padding: 0 8px;
  border-bottom: 1px solid #f6f6f6;
  color: #1f1f1f;
  background: #fff;
  font-size: 14px;
  font-weight: 600;
  line-height: 24px;
}

.pg-nav-bar__title {
  max-width: calc(100% - 188px);
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pg-nav-bar__capsule {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-end: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 86px;
  height: 30px;
  border: 1px solid #e1e1e1;
  border-radius: 16px;
  background: #fff;
  pointer-events: none;
  transform: translateY(-50%);
}

.pg-nav-bar__capsule-dots {
  width: 15px;
  height: 3px;
  background-image: radial-gradient(circle at 1.5px 1.5px, #1f1f1f 1.5px, transparent 1.6px);
  background-repeat: repeat-x;
  background-size: 6px 3px;
}

.pg-nav-bar__capsule-divider {
  width: 1px;
  height: 16px;
  background: #e1e1e1;
}

.pg-nav-bar__capsule-button {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.pg-nav-bar__capsule-circle {
  width: 13px;
  height: 13px;
  border: 1.5px solid #1f1f1f;
  border-radius: 50%;
}
</style>
