import type { MessageTree } from '@dragcraft/i18n'

export const rendererMessages: Record<string, MessageTree> = {
  'zh-CN': {
    action: {
      'drag': '拖拽排序',
      'move-up': '上移',
      'move-down': '下移',
      'delete': '删除',
    },
    canvas: {
      'empty': '拖拽组件到这里',
      'node-handle': '选中组件',
    },
    forbidden: {
      default: '当前物料不满足创建条件，无法添加到画布',
      alreadyExists: '无法添加 — 该类型已存在',
    },
  },
  'en': {
    action: {
      'drag': 'Drag to sort',
      'move-up': 'Move up',
      'move-down': 'Move down',
      'delete': 'Delete',
    },
    canvas: {
      'empty': 'Drag components here',
      'node-handle': 'Select component',
    },
    forbidden: {
      default: 'This component cannot be added to the canvas',
      alreadyExists: 'Cannot add — this type already exists',
    },
  },
}
