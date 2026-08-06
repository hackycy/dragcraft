import type { DocumentSchema } from '@dragcraft/designer'

export const GUIDE_SCHEMA_VERSION = '1'

export function createGuideSchema(): DocumentSchema {
  return {
    version: GUIDE_SCHEMA_VERSION,
    globalConfig: { title: '夏日活动页', backgroundColor: '#f7f8fb' },
    page: { props: { title: '夏日活动页' }, style: { backgroundColor: '#f7f8fb' } },
    nodes: [
      { id: 'page-header-1', type: 'page-header', props: { title: '夏日活动页' } },
      { id: 'notice-1', type: 'notice', props: { text: '夏日活动已经开始', tone: 'warm', hasImage: false, image: '', featured: false } },
      { id: 'layout-1', type: 'column-container', props: { gap: 12 } },
      { id: 'text-1', type: 'guide-text', props: { content: '拖入更多物料，继续编辑活动内容。' } },
      { id: 'floating-action-1', type: 'floating-action', props: { label: '咨询' } },
    ],
    structure: {
      root: ['page-header-1', 'notice-1', 'layout-1', 'floating-action-1'],
      containers: {
        'layout-1': { regions: { content: ['text-1'] } },
      },
    },
  }
}
