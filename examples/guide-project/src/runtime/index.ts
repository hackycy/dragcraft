import type { RuntimeContainerMap } from './RuntimePage'
import { activityComponentMap } from '../domain/widgets/activity'
import { RuntimeColumnContainer } from './RuntimeColumnContainer'

export { RuntimeColumnContainer } from './RuntimeColumnContainer'
export { createRuntimeNodeRenderer, RuntimePage } from './RuntimePage'

export const activityRuntimeComponentMap = activityComponentMap
export const activityRuntimeContainerMap: RuntimeContainerMap = {}

export const guideRuntimeContainerMap: RuntimeContainerMap = {
  'column-container': RuntimeColumnContainer,
}
