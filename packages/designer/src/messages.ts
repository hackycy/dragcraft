import type { MessageTree } from '@dragcraft/utils'

export const designerMessages: Record<string, MessageTree> = {
  'zh-CN': {
    panel: {
      tab: {
        global: '全局配置',
        widget: '组件配置',
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
      tab: {
        global: 'Global',
        widget: 'Widget',
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
