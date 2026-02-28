import { createRouter, createWebHistory } from 'vue-router'
import CustomMode from './examples/CustomMode.vue'
import DefaultMode from './examples/DefaultMode.vue'
import DynamicBehaviorMode from './examples/DynamicBehaviorMode.vue'

const routes = [
  { path: '/', redirect: '/dynamic' },
  { path: '/default', name: 'default', component: DefaultMode, meta: { label: 'Default Mode' } },
  { path: '/custom', name: 'custom', component: CustomMode, meta: { label: 'Custom Mode' } },
  { path: '/dynamic', name: 'dynamic', component: DynamicBehaviorMode, meta: { label: 'Dynamic Behavior' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
