import type { NodeDefinition } from '@dragcraft/designer'
import type { Component, VNodeChild } from 'vue'

export type RuntimeRegions = Record<string, VNodeChild[]>
export interface RuntimeLayout {
  readonly order?: number
  readonly placement?: {
    readonly anchor?: { readonly block?: 'start' | 'center' | 'end', readonly inline?: 'start' | 'center' | 'end' }
    readonly avoidContent?: boolean
    readonly edge?: RuntimeLayoutEdge
    readonly kind?: 'flow' | 'chrome' | 'layer'
    readonly layer?: string
    readonly mode?: 'framework' | 'self'
    readonly offset?: {
      readonly blockEnd?: string | number
      readonly blockStart?: string | number
      readonly inlineEnd?: string | number
      readonly inlineStart?: string | number
    }
    readonly position?: 'fixed' | 'sticky' | 'flow'
    readonly region?: string
    readonly reserve?: { readonly mode?: 'measure' | 'size' | 'none', readonly size?: string | number }
  }
  readonly visible?: boolean
}
export type RuntimeLayoutEdge = 'block-start' | 'block-end' | 'inline-start' | 'inline-end'

interface RuntimeDefinitionBase {
  component: Component
  defaultLayout?: RuntimeLayout
}

export interface RuntimeWidgetDefinition extends RuntimeDefinitionBase {
  kind: 'widget'
}

export interface RuntimeContainerDefinition extends RuntimeDefinitionBase {
  kind: 'container'
}

export type RuntimeDefinition = RuntimeWidgetDefinition | RuntimeContainerDefinition
export type RuntimeRegistry = Record<string, RuntimeDefinition>
export type RuntimeNode = NodeDefinition
