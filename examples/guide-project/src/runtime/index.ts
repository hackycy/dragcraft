import type { RuntimeRegistry } from './registry'
import { FloatingActionWidget } from '../domain/widgets/floating-action'
import { NoticeWidget } from '../domain/widgets/notice'
import { GuidePageHeaderWidget } from '../domain/widgets/page-header'
import { GuideTextWidget } from '../domain/widgets/text'
import { RuntimeColumnContainer } from './RuntimeColumnContainer'

export { createRuntimeLayoutPlan } from './layout'
export type {
  RuntimeContainerDefinition,
  RuntimeDefinition,
  RuntimeRegions,
  RuntimeRegistry,
  RuntimeWidgetDefinition,
} from './registry'
export { RuntimeColumnContainer } from './RuntimeColumnContainer'
export { createRuntimeNodeRenderer, DefaultRuntimeFallback, RuntimePage } from './RuntimePage'

export const guideRuntimeRegistry = {
  'page-header': {
    kind: 'widget',
    component: GuidePageHeaderWidget,
    defaultLayout: {
      placement: {
        kind: 'chrome',
        edge: 'block-start',
        position: 'fixed',
        reserve: { mode: 'size', size: 48 },
        avoidContent: true,
      },
    },
  },
  'guide-text': { kind: 'widget', component: GuideTextWidget },
  'notice': { kind: 'widget', component: NoticeWidget },
  'column-container': { kind: 'container', component: RuntimeColumnContainer },
  'floating-action': {
    kind: 'widget',
    component: FloatingActionWidget,
    defaultLayout: {
      placement: {
        kind: 'layer',
        layer: 'float',
        mode: 'framework',
        anchor: { block: 'end', inline: 'end' },
        offset: { blockEnd: 16, inlineEnd: 16 },
      },
    },
  },
} satisfies RuntimeRegistry
