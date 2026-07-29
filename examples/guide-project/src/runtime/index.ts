import { guideWidgetDefinitions } from '../domain/widgets'
import { createRuntimeRegistry } from './registry'
import { RuntimeColumnContainer } from './RuntimeColumnContainer'

export { createRuntimeLayoutPlan } from './layout'
export { createRuntimeRegistry } from './registry'
export type {
  RuntimeContainerDefinition,
  RuntimeDefinition,
  RuntimeRegions,
  RuntimeRegistry,
  RuntimeWidgetDefinition,
} from './registry'
export { RuntimeColumnContainer } from './RuntimeColumnContainer'
export { createRuntimeNodeRenderer, DefaultRuntimeFallback, RuntimePage } from './RuntimePage'

export const guideRuntimeRegistry = createRuntimeRegistry(guideWidgetDefinitions, {
  'column-container': RuntimeColumnContainer,
})
