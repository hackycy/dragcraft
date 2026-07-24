import type { MessageTree } from '@dragcraft/i18n'

export const designerMessages: Record<string, MessageTree> = {
  'zh-CN': {
    panel: {
      materials: { title: '物料' },
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
        clear: '清除搜索',
      },
      inspector: { title: '属性检查器', page: '页面' },
    },
    workspace: {
      history: { label: '历史操作', undo: '撤销', redo: '重做' },
      canvas: {
        'controls': '画布工具',
        'pointer': '指针模式',
        'hand': '抓手模式（按住空格）',
        'zoom': '当前缩放',
        'zoom-out': '缩小',
        'zoom-in': '放大',
        'fit': '适配画布',
        'center': '居中画布',
      },
      left: { label: '物料与结构', open: '展开左侧栏', close: '收起左侧栏' },
      right: { label: '属性检查器', open: '展开属性栏', close: '收起属性栏' },
      drawer: { close: '关闭面板' },
    },
    device: { group: '预览设备', iphone: 'iPhone', android: 'Android', tablet: '平板', desktop: '桌面' },
  },
  'en': {
    panel: {
      materials: { title: 'Materials' },
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
        clear: 'Clear search',
      },
      inspector: { title: 'Inspector', page: 'Page' },
    },
    workspace: {
      history: { label: 'History actions', undo: 'Undo', redo: 'Redo' },
      canvas: {
        'controls': 'Canvas tools',
        'pointer': 'Pointer mode',
        'hand': 'Hand mode (hold Space)',
        'zoom': 'Current zoom',
        'zoom-out': 'Zoom out',
        'zoom-in': 'Zoom in',
        'fit': 'Fit canvas',
        'center': 'Center canvas',
      },
      left: { label: 'Materials and structure', open: 'Open left panel', close: 'Collapse left panel' },
      right: { label: 'Inspector', open: 'Open inspector', close: 'Collapse inspector' },
      drawer: { close: 'Close panel' },
    },
    device: { group: 'Preview device', iphone: 'iPhone', android: 'Android', tablet: 'Tablet', desktop: 'Desktop' },
  },
}
