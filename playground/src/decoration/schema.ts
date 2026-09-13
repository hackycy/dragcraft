import type { DocumentSchema } from '@dragcraft/designer'

import { createDefaultDiyV2BackgroundConfig } from './background'
import { DEFAULT_THEME_COLOR } from './context'

export function createEmptyDocumentSchema(): DocumentSchema {
  return {
    version: '1',
    globalConfig: {
      themeColor: DEFAULT_THEME_COLOR,
      background: createDefaultDiyV2BackgroundConfig(),
    },
    page: {
      props: {},
      style: {
        surface: {},
      },
    },
    nodes: [],
    structure: { root: [], containers: {} },
  }
}
