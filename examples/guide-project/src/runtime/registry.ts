import type {
  DesignerWidgetMeta,
  SchemaNode,
  WidgetDefinition,
} from '@dragcraft/designer'
import type { Component, VNodeChild } from 'vue'

export type RuntimeNodeLayout = NonNullable<SchemaNode['layout']>
export type RuntimeRegions = Record<string, VNodeChild[]>

interface RuntimeDefinitionBase {
  component: Component
  defaultLayout?: RuntimeNodeLayout
}

export interface RuntimeWidgetDefinition extends RuntimeDefinitionBase {
  kind: 'widget'
}

export interface RuntimeContainerDefinition extends RuntimeDefinitionBase {
  kind: 'container'
}

export type RuntimeDefinition = RuntimeWidgetDefinition | RuntimeContainerDefinition
export type RuntimeRegistry = Record<string, RuntimeDefinition>
export type RuntimeContainerMap = Record<string, Component>

export function createRuntimeRegistry(
  definitions: WidgetDefinition<DesignerWidgetMeta>[],
  containerMap: RuntimeContainerMap,
): RuntimeRegistry {
  return Object.fromEntries(definitions.map((definition) => {
    const { meta } = definition
    if (!meta.container) {
      return [meta.type, {
        kind: 'widget',
        component: definition.component,
        defaultLayout: meta.defaultLayout,
      } satisfies RuntimeWidgetDefinition]
    }

    const runtimeContainer = containerMap[meta.type]
    if (!runtimeContainer)
      throw new Error(`Missing runtime container for widget type "${meta.type}"`)

    return [meta.type, {
      kind: 'container',
      component: runtimeContainer,
      defaultLayout: meta.defaultLayout,
    } satisfies RuntimeContainerDefinition]
  }))
}
