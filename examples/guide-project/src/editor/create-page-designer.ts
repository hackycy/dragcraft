import type { DesignerSchema, FormSchema } from '@dragcraft/designer'
import {
  CommandType,
  createConfirmActionInterceptor,
  createDesigner,
} from '@dragcraft/designer'
import { DeviceFrameShell } from '@dragcraft/device-frames'
import { defineComponent, h } from 'vue'
import { guideComponentMap, guideWidgetGroups, guideWidgetMetas } from '../domain/widgets'
import { createGuideFieldComponentMap } from '../forms'

// #region tutorial-initial-schema
export function createGuideSchema(): DesignerSchema {
  return {
    version: '1.0.0',
    globalConfig: { title: '夏日活动页' },
    root: {
      id: 'root',
      type: 'root',
      props: {},
      style: { surface: { backgroundColor: '#f7f8fb' } },
      children: [
        // #region tutorial-schema-managed-header-node
        {
          id: 'page-header-1',
          type: 'page-header',
          props: { title: '夏日活动页' },
          layout: {
            placement: {
              kind: 'chrome',
              edge: 'block-start',
              position: 'sticky',
              reserve: { mode: 'size', size: 48 },
            },
          },
        },
        // #endregion tutorial-schema-managed-header-node
        {
          id: 'notice-1',
          type: 'notice',
          props: {
            text: '夏日活动已经开始',
            tone: 'warm',
            hasImage: false,
            image: '',
            featured: false,
          },
        },
      ],
    },
  }
}
// #endregion tutorial-initial-schema

const globalConfigSchema: FormSchema = {
  sections: [{
    title: '页面设置',
    fields: [
      { key: 'title', label: '页面标题', component: 'Input' },
      {
        key: 'backgroundColor',
        label: '背景颜色',
        component: 'Input',
        bindTo: { scope: 'schema', path: 'root.style.surface.backgroundColor' },
      },
    ],
  }],
}

const GuideEmptyState = defineComponent({
  name: 'GuideEmptyState',
  props: { isDragOver: { type: Boolean, default: false } },
  setup(props) {
    return () => h('p', { class: 'guide-empty-state' }, props.isDragOver ? '松开放置物料' : '从左侧拖入物料开始搭建页面')
  },
})

// #region tutorial-create-designer
export function createPageDesigner(initialSchema = createGuideSchema()) {
  return createDesigner({
    engineOptions: {
      initialSchema,
      maxHistorySize: 50,
    },
    widgetMetas: guideWidgetMetas,
    componentMap: guideComponentMap,
    fieldComponentMap: createGuideFieldComponentMap(),
    widgetGroups: guideWidgetGroups,
    globalConfigSchema,
    workspace: {
      compactBreakpoint: 1080,
      keyboardShortcuts: true,
    },
    // #region tutorial-actions
    customActions: [{
      key: 'feature-notice',
      label: '设为精选',
      type: 'button',
      order: 500,
      visible: ctx => ctx.node.type === 'notice',
      disabled: ctx => ctx.node.props.featured === true,
      command: ctx => ({
        type: CommandType.UPDATE_PROPS,
        payload: { nodeId: ctx.node.id, props: { featured: true } },
      }),
    }],
    actionInterceptors: [
      createConfirmActionInterceptor({
        confirm: ({ title, message }) => typeof window === 'undefined'
          ? true
          // eslint-disable-next-line no-alert -- The tutorial uses the browser fallback in place of a host dialog.
          : window.confirm(message ?? title ?? '确认执行此操作？'),
        title: '确认删除',
        message: '删除后可以通过撤销恢复。',
      }),
    ],
    // #endregion tutorial-actions
    // #region tutorial-renderer-extensions
    extensions: {
      materialItemRenderer: ({ material }) => h('span', { class: 'guide-material-card' }, material.title),
      rendererExtensions: {
        containerShell: DeviceFrameShell,
        emptyState: GuideEmptyState,
      },
    },
    // #endregion tutorial-renderer-extensions
  })
}
// #endregion tutorial-create-designer
