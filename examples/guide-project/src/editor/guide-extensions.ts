import type { ContainerShellSource, DesignerExtensions } from '@dragcraft/designer'
import { defineComponent, h } from 'vue'

const GuideEmptyState = defineComponent({
  name: 'GuideEmptyState',
  props: { isDragOver: { type: Boolean, default: false } },
  setup(props) {
    return () => h(
      'p',
      { class: 'guide-empty-state' },
      props.isDragOver ? '松开放置物料' : '从左侧拖入物料开始搭建页面',
    )
  },
})

export function createGuideExtensions(
  containerShell?: ContainerShellSource,
): DesignerExtensions {
  return {
    materialItemRenderer: ({ material }) => h(
      'span',
      { class: 'guide-material-card' },
      material.title,
    ),
    rendererExtensions: {
      ...(containerShell ? { containerShell } : {}),
      emptyState: GuideEmptyState,
    },
  }
}
