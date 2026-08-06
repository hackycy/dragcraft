import type { MaterialDefinition } from '@dragcraft/designer'
import { columnContainerMaterial } from './container'
import { floatingActionMaterial } from './floating-action'
import { noticeMaterial } from './notice'
import { pageHeaderMaterial } from './page-header'
import { textMaterial } from './text'

export const guideMaterials: readonly MaterialDefinition[] = [
  pageHeaderMaterial,
  textMaterial,
  noticeMaterial,
  columnContainerMaterial,
  floatingActionMaterial,
]

export { ColumnContainerWidget } from './container'
export { FloatingActionWidget } from './floating-action'
export { NoticeWidget } from './notice'
export { GuidePageHeaderWidget } from './page-header'
export { GuideTextWidget } from './text'
