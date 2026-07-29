import type { DesignerSchema } from '@dragcraft/designer'

export const GUIDE_SCHEMA_VERSION = '2.0.0'

export function createGuideSchema(): DesignerSchema {
  return {
    version: GUIDE_SCHEMA_VERSION,
    globalConfig: { title: '夏日活动页' },
    root: {
      id: 'root',
      type: 'root',
      props: {},
      style: { surface: { backgroundColor: '#f7f8fb' } },
      children: [
        {
          id: 'page-header-1',
          type: 'page-header',
          props: { title: '夏日活动页' },
          layout: {
            placement: {
              kind: 'chrome',
              edge: 'block-start',
              position: 'fixed',
              reserve: { mode: 'size', size: 48 },
            },
          },
        },
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
        {
          id: 'layout-1',
          type: 'column-container',
          props: { gap: 12 },
          container: {
            variant: 'single',
            regions: {
              content: [{
                id: 'text-1',
                type: 'guide-text',
                props: { content: '拖入更多物料，继续编辑活动内容。' },
              }],
            },
          },
        },
        {
          id: 'floating-action-1',
          type: 'floating-action',
          props: { label: '咨询' },
          layout: {
            placement: {
              kind: 'layer',
              mode: 'framework',
              anchor: { block: 'end', inline: 'end' },
              offset: { blockEnd: 16, inlineEnd: 16 },
            },
          },
        },
      ],
    },
  }
}
