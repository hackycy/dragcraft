import { createDesigner } from '@dragcraft/designer'
import { createAntDesignVueFields } from '@dragcraft/fields-ant-design-vue'
import { guideMaterials } from '../domain/materials'

export function createMinimalDesigner() {
  return createDesigner({
    schema: {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [{ id: 'welcome-text', type: 'guide-text', props: { content: '欢迎使用 DragCraft' } }],
      structure: { root: ['welcome-text'], containers: {} },
    },
    materials: guideMaterials.filter(material => material.type === 'guide-text'),
    fieldComponentMap: createAntDesignVueFields(),
  })
}
