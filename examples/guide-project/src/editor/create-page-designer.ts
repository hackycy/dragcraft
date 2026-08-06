import type {
  ConfirmAuthoringAction,
  ContainerShellSource,
  DocumentSchema,
} from '@dragcraft/designer'
import { createDesigner } from '@dragcraft/designer'
import { IPHONE_DEVICE_FRAME } from '@dragcraft/device-frames'
import { h } from 'vue'
import { guideMaterials } from '../domain/widgets'
import { createGuideFieldComponentMap } from '../forms'
import { guideGlobalConfigSchema } from './global-config'
import { createGuideSchema } from './initial-schema'

export interface CreatePageDesignerOptions {
  initialSchema?: DocumentSchema
  containerShell?: ContainerShellSource
  confirmAuthoringAction?: ConfirmAuthoringAction
}

const defaultConfirmation: ConfirmAuthoringAction = () => typeof window === 'undefined'
  ? true
  // eslint-disable-next-line no-alert -- The guide deliberately demonstrates a browser-owned confirmation UX.
  : window.confirm('此操作需要确认，是否继续？')

export function createPageDesigner(options: CreatePageDesignerOptions = {}) {
  return createDesigner({
    schema: options.initialSchema ?? createGuideSchema(),
    materials: guideMaterials,
    containerShell: options.containerShell ?? IPHONE_DEVICE_FRAME.containerShell,
    confirmAuthoringAction: options.confirmAuthoringAction ?? defaultConfirmation,
    fieldComponentMap: createGuideFieldComponentMap(),
    globalConfigSchema: guideGlobalConfigSchema,
    maxHistoryEntries: 50,
    workspace: { compactBreakpoint: 1080, keyboardShortcuts: true },
    extensions: {
      materialItemRenderer: ({ material }) => h(
        'span',
        { class: 'guide-material-card' },
        material.panel?.title ?? material.type,
      ),
    },
  })
}

export { createGuideSchema } from './initial-schema'
