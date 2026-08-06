import type { DocumentSchema } from '@dragcraft/designer'
import { createDesigner } from '@dragcraft/designer'
import { createAntDesignVueFields } from '@dragcraft/fields-ant-design-vue'
import { textMaterial } from '../domain/widgets/text'

const minimalSchema: DocumentSchema = {
  version: '1',
  globalConfig: {},
  page: { props: {} },
  nodes: [{ id: 'welcome-text', type: 'guide-text', props: { content: '欢迎使用 Dragcraft' } }],
  structure: { root: ['welcome-text'], containers: {} },
}

export function createMinimalDesigner() {
  return createDesigner({
    schema: minimalSchema,
    materials: [textMaterial],
    fieldComponentMap: createAntDesignVueFields(),
  })
}
