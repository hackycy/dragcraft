import type { NodeDefinition } from '@dragcraft/designer'
import type { Component } from 'vue'

export interface MaterialMeta {
  type: string
  title: string
  titleKey?: string
  group: string
  icon?: string
  defaultProps: Record<string, any>
  defaultStyle?: Record<string, any>
  formSchema: any
  authoring?: string
  [key: string]: any
  material?: { title?: string, titleKey?: string, icon?: string, description?: string, descriptionKey?: string, tags?: string[], keywords?: string[] }
  container?: ContainerDefinition
  containerAdapter?: { resolveDropIndex?: (ctx: any) => number | null }
}

export interface WidgetFixtureDefinition {
  meta: MaterialMeta
  component: Component
}

export interface MaterialGroupDefinition {
  name: string
  title: string
  titleKey?: string
}
export interface ContainerRegionDefinition {
  id: string
  title: string
  titleKey?: string
  constraints?: { minItems?: number, maxItems?: number }
}
export interface ContainerVariantDefinition {
  title: string
  titleKey?: string
  regions: ContainerRegionDefinition[]
}
export interface ContainerDefinition {
  defaultVariant: string
  variants: Record<string, ContainerVariantDefinition>
  migrateVariant?: (ctx: ContainerVariantMigrationContext) => ContainerVariantMigrationResult
}
export interface ContainerVariantMigrationContext { schema: unknown, container: NodeDefinition, fromVariantId: string, toVariantId: string, fromVariant: ContainerVariantDefinition, toVariant: ContainerVariantDefinition, state: { variant: string, regions: Record<string, NodeDefinition[]> } }
export type ContainerVariantMigrationResult = { allowed: true, state: { variant: string, regions: Record<string, NodeDefinition[]> } } | { allowed: false, code: string, details?: Record<string, unknown> }
export interface ResolveDropIndexContext { event: DragEvent, regionElement: HTMLElement, itemElements: readonly HTMLElement[], nodes: readonly any[] }
export type SchemaNode = any
export function defineContainerFixture(definition: WidgetFixtureDefinition): WidgetFixtureDefinition {
  return definition
}
export function readFixtureMetas(definitions: readonly WidgetFixtureDefinition[]): MaterialMeta[] {
  return definitions.map(definition => definition.meta)
}
export function createFixtureComponentMap(definitions: readonly WidgetFixtureDefinition[]): Record<string, Component> {
  return Object.fromEntries(definitions.map(definition => [definition.meta.type, definition.component]))
}
