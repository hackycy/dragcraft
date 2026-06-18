<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
const routes = router.getRoutes().filter(r => r.meta?.label)
</script>

<template>
  <div class="playground-root">
    <div class="playground-mode-switcher">
      <router-link
        v-for="route in routes"
        :key="route.name"
        :to="{ name: route.name }"
        class="playground-mode-switcher__btn"
        active-class="playground-mode-switcher__btn--active"
      >
        {{ route.meta.label }}
      </router-link>
    </div>
    <router-view />
  </div>
</template>

<style scoped>
.playground-root {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.playground-root > .playground-app {
  flex: 1;
  height: 0;
}

.playground-mode-switcher {
  display: flex;
  gap: 0;
  background: #f5f5f5;
  border-bottom: 1px solid #e8e8e8;
  padding: 0;
  flex-shrink: 0;
}

.playground-mode-switcher__btn {
  flex: 1;
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #666;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
  text-decoration: none;
  text-align: center;
}

.playground-mode-switcher__btn:hover {
  color: #333;
  background: #e8e8e8;
}

.playground-mode-switcher__btn--active {
  color: #1677ff;
  border-bottom-color: #1677ff;
  background: #fff;
}
</style>
