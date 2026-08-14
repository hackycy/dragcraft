import type { DesignerExtensions } from '@dragcraft/designer'
import { h } from 'vue'

export function createGuideExtensions(): DesignerExtensions {
  return {
    materialItemRenderer: ({ material }) => h(
      'span',
      { class: 'guide-material-card' },
      material.title,
    ),
  }
}
