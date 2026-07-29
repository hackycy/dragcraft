import type { DesignerSchema } from '@dragcraft/designer'

export function createStarterSchema(): DesignerSchema {
  return {
    version: '1.0.0',
    globalConfig: {},
    root: {
      id: 'root',
      type: 'root',
      props: {},
      children: [{
        id: 'welcome-text',
        type: 'guide-text',
        props: { content: '选中我，然后在右侧修改文本。' },
      }],
    },
  }
}
