import type { ActionInterceptor, NodeActionDefinition } from '@dragcraft/designer'
import { createConfirmActionInterceptor } from '@dragcraft/designer'

export const guideCustomActions: NodeActionDefinition[] = [{
  key: 'feature-notice',
  label: '设为精选',
  type: 'button',
  order: 500,
  visible: ctx => ctx.node.type === 'notice',
  disabled: ctx => ctx.node.props.featured === true,
  action: ctx => ({
    type: 'node.update',
    nodeId: ctx.node.id,
    props: { featured: true },
  }),
}]

export type ConfirmAction = (request: { title?: string, message?: string }) => boolean | Promise<boolean>

export function createGuideActionInterceptors(confirmAction?: ConfirmAction): ActionInterceptor[] {
  return [createConfirmActionInterceptor({
    confirm: confirmAction ?? (({ title, message }) => typeof window === 'undefined'
      ? true
      // eslint-disable-next-line no-alert -- The guide uses a browser fallback in place of a host dialog.
      : window.confirm(message ?? title ?? '确认执行此操作？')),
    title: '确认删除',
    message: '删除后可以通过撤销恢复。',
  })]
}
