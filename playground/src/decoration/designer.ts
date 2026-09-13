import type { DocumentSchema } from '@dragcraft/designer'
import { createConfirmActionInterceptor, createDesigner } from '@dragcraft/designer'
import { Modal } from 'ant-design-vue'

import { createDecorationFieldComponentMap } from './fields'
import { createDecorationGlobalConfigSchema } from './global-config-schema'
import { DECORATION_MATERIALS } from './registry'
import { createEmptyDocumentSchema } from './schema'

function confirmRemoval(title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false
    const settle = (value: boolean) => {
      if (settled)
        return
      settled = true
      resolve(value)
    }

    Modal.confirm({
      title,
      content: message,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => settle(true),
      onCancel: () => settle(false),
      afterClose: () => settle(false),
    })
  })
}

export function createDecorationDesigner(schema: DocumentSchema = createEmptyDocumentSchema()) {
  return createDesigner({
    schema,
    materials: DECORATION_MATERIALS,
    fieldComponentMap: createDecorationFieldComponentMap(),
    globalConfigSchema: createDecorationGlobalConfigSchema(),
    actionInterceptors: [
      createConfirmActionInterceptor({
        shouldConfirm: ({ action }) => action?.type === 'node.remove',
        title: '删除物料',
        message: '删除后无法恢复，确认删除该物料吗？',
        confirm: ({ title, message }) =>
          confirmRemoval(
            title ?? '删除物料',
            message ?? '删除后无法恢复，确认删除该物料吗？',
          ),
      }),
    ],
  })
}
