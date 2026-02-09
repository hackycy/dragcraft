import type { ConfigType, PageSchema } from '../types'
import { generateShortId } from '@dragcraft/utils'

export const DEFAULT_PAGE_CONFIG_TYPE = 'page'

export function createDefaultPageSchema(
  type: ConfigType = DEFAULT_PAGE_CONFIG_TYPE,
): PageSchema {
  return {
    id: generateShortId(),
    type,
    props: {},
    style: {},
  }
}
