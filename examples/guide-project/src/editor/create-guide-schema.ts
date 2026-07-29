import type { DesignerSchema } from '@dragcraft/designer'
import { createActivitySchema } from './create-activity-schema'

export function createGuideSchema(): DesignerSchema {
  const activitySchema = createActivitySchema()

  return {
    ...activitySchema,
    root: {
      ...activitySchema.root,
      children: [
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
        ...(activitySchema.root.children ?? []),
      ],
    },
  }
}
