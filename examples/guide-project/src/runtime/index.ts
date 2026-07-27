import type { RuntimeContainerMap } from './RuntimePage'
import { RuntimeColumnContainer } from './RuntimeColumnContainer'

export { RuntimeColumnContainer } from './RuntimeColumnContainer'
export { createRuntimeNodeRenderer, RuntimePage } from './RuntimePage'

export const guideRuntimeContainerMap: RuntimeContainerMap = {
  'column-container': RuntimeColumnContainer,
}
