import { createRouter, createWebHistory } from 'vue-router'
import CustomMode from './examples/CustomMode.vue'
import DefaultMode from './examples/DefaultMode.vue'
import DynamicBehaviorMode from './examples/DynamicBehaviorMode.vue'
import SortableLockMode from './examples/SortableLockMode.vue'

const routes = [
  { path: '/', redirect: '/sortable' },
  { path: '/default', name: 'default', component: DefaultMode, meta: { label: 'Default Mode' } },
  { path: '/custom', name: 'custom', component: CustomMode, meta: { label: 'Custom Mode' } },
  { path: '/dynamic', name: 'dynamic', component: DynamicBehaviorMode, meta: { label: 'Dynamic Behavior' } },
  { path: '/sortable', name: 'sortable', component: SortableLockMode, meta: { label: 'Sortable Lock' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
