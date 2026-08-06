import type { Component, VNodeChild } from 'vue'

export type RuntimeRegions = Record<string, VNodeChild[]>
export type RuntimeMount = 'document' | 'header' | 'overlay'

export interface RuntimeNodeDefinition {
  readonly kind: 'node'
  readonly component: Component
  readonly mount?: RuntimeMount
}

export interface RuntimeContainerDefinition {
  readonly kind: 'container'
  readonly component: Component
  readonly mount?: RuntimeMount
}

export type RuntimeDefinition = RuntimeNodeDefinition | RuntimeContainerDefinition
export type RuntimeRegistry = Readonly<Record<string, RuntimeDefinition>>
