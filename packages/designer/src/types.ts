import type { FieldComponentMap, FormSchema } from '@dragcraft/form-generator'
import type { I18nInstance } from '@dragcraft/i18n'
import type { Component, Ref, VNodeChild } from 'vue'
import type { MaterialDefinition } from './materials/types'
import type { DesignerInstance } from './session/create-designer'

export type DesignerWorkspaceMode = 'wide' | 'compact'
export type LeftPanelTabKey = 'materials' | 'structure'
export type PropertyTabKey = 'global' | 'widget'

export interface DesignerWorkspaceOptions {
  compactBreakpoint?: number
  defaultLeftOpen?: boolean
  defaultRightOpen?: boolean
  keyboardShortcuts?: boolean
  leftPanelWidth?: number
  rightPanelWidth?: number
  railWidth?: number
  drawerWidth?: number
}

export interface DesignerWorkspaceController {
  readonly compactBreakpoint: number
  readonly keyboardShortcuts: boolean
  readonly leftPanelWidth: number
  readonly rightPanelWidth: number
  readonly railWidth: number
  readonly drawerWidth: number
  readonly mode: Ref<DesignerWorkspaceMode>
  readonly leftOpen: Ref<boolean>
  readonly rightOpen: Ref<boolean>
  readonly activeLeftPanel: Ref<LeftPanelTabKey>
  readonly activeRightPanel: Ref<PropertyTabKey>
  readonly setMode: (mode: DesignerWorkspaceMode) => void
  readonly openLeft: (panel?: LeftPanelTabKey) => void
  readonly closeLeft: () => void
  readonly toggleLeft: (panel?: LeftPanelTabKey) => void
  readonly openRight: (panel?: PropertyTabKey) => void
  readonly closeRight: () => void
  readonly toggleRight: (panel?: PropertyTabKey) => void
  readonly closeDrawers: () => void
}

export type ContainerShell = Component
export type ContainerShellSource = ContainerShell | Readonly<Ref<ContainerShell>>

export interface MaterialItemRenderProps {
  readonly material: Readonly<MaterialDefinition>
  readonly draggable: boolean
  readonly dragging: boolean
}

export interface DesignerRailSlotAPI {
  readonly designer: DesignerInstance
  readonly workspace: DesignerWorkspaceController
  readonly t: I18nInstance['t']
}

export interface DesignerExtensions {
  readonly leftRailRenderer?: (api: DesignerRailSlotAPI) => VNodeChild
  readonly materialItemRenderer?: (props: MaterialItemRenderProps) => VNodeChild
  readonly materialPanelRenderer?: Component
  readonly propertyPanelRenderer?: Component
  readonly rightRailRenderer?: (api: DesignerRailSlotAPI) => VNodeChild
}

export interface DesignerWorkbenchOptions {
  readonly containerShell?: ContainerShellSource
  readonly extensions?: DesignerExtensions
  readonly fieldComponentMap?: FieldComponentMap
  readonly globalConfigSchema?: FormSchema
  readonly locale?: string
  readonly workspace?: DesignerWorkspaceOptions
}

export interface UseDesignerReturn {
  readonly document: DesignerInstance['document']
  readonly selection: DesignerInstance['selection']
  readonly history: DesignerInstance['history']
  readonly execute: DesignerInstance['execute']
  readonly importSchema: DesignerInstance['importSchema']
  readonly exportSchema: DesignerInstance['exportSchema']
}
