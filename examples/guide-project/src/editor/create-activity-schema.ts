import type { DesignerSchema } from '@dragcraft/designer'

export function createActivitySchema(): DesignerSchema {
  return {
    version: '1.0.0',
    globalConfig: { title: '夏日活动页' },
    root: {
      id: 'root',
      type: 'root',
      props: {},
      style: { surface: { backgroundColor: '#f7f8fb' } },
      children: [{
        id: 'notice-1',
        type: 'notice',
        props: {
          text: '夏日活动已经开始',
          tone: 'warm',
          hasImage: false,
          image: '',
          featured: false,
        },
      }],
    },
  }
}
