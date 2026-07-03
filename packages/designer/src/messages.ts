import type { MessageTree } from '@dragcraft/utils'

export const designerMessages: Record<string, MessageTree> = {
  'zh-CN': {
    panel: {
      left: {
        materials: '物料',
        structure: '结构树',
      },
      tab: {
        global: '全局配置',
        widget: '组件配置',
      },
      structure: {
        title: '结构树',
        empty: '暂无结构',
      },
      empty: {
        'no-global-config': '暂无全局配置',
        'select-widget': '请选择组件',
      },
      search: {
        placeholder: '搜索组件...',
      },
    },
  },
  'en': {
    panel: {
      left: {
        materials: 'Materials',
        structure: 'Structure',
      },
      tab: {
        global: 'Global',
        widget: 'Widget',
      },
      structure: {
        title: 'Structure',
        empty: 'No nodes',
      },
      empty: {
        'no-global-config': 'No global config',
        'select-widget': 'Select a widget',
      },
      search: {
        placeholder: 'Search widgets...',
      },
    },
  },
}
