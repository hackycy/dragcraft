<script setup lang="ts">
import { markRaw, ref, shallowRef } from 'vue'
import DefaultMode from './examples/DefaultMode.vue'
import CustomMode from './examples/CustomMode.vue'
import DynamicBehaviorMode from './examples/DynamicBehaviorMode.vue'

const modes = [
  { key: 'default', label: 'Default Mode', component: markRaw(DefaultMode) },
  { key: 'custom', label: 'Custom Mode', component: markRaw(CustomMode) },
  { key: 'dynamic', label: 'Dynamic Behavior', component: markRaw(DynamicBehaviorMode) },
]

const activeMode = ref('dynamic')
const activeComponent = shallowRef(modes[2].component)

function switchMode(mode: typeof modes[number]) {
  activeMode.value = mode.key
  activeComponent.value = mode.component
}
</script>

<template>
  <div class="playground-root">
    <div class="playground-mode-switcher">
      <button
        v-for="mode in modes"
        :key="mode.key"
        :class="['playground-mode-switcher__btn', { 'playground-mode-switcher__btn--active': activeMode === mode.key }]"
        @click="switchMode(mode)"
      >
        {{ mode.label }}
      </button>
    </div>
    <component :is="activeComponent" />
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
