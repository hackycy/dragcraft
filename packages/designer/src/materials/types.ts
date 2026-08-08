import type {
  ContainerDeclaration,
  DeepReadonly,
  DocumentSchema,
  JsonObject,
  NodeBundle,
  NodeDefinition,
  NodeType,
} from '@dragcraft/core'
import type { FormSchema } from '@dragcraft/form-generator'
import type { Component } from 'vue'

export type DesignerPresentation
  = | { readonly kind: 'visual', readonly preview: Component, readonly frame?: Component }
    | { readonly kind: 'headless' }

export interface MaterialSchemaDeclaration<Props extends JsonObject = JsonObject> {
  readonly container?: ContainerDeclaration
  readonly defaultProps?: Props
  readonly defaultStyle?: JsonObject
}

export interface MaterialPanelDefinition {
  readonly description?: string
  readonly descriptionKey?: string
  readonly group?: string
  readonly icon?: Component | string
  readonly keywords?: readonly string[]
  readonly tags?: readonly string[]
  readonly thumbnail?: string
  readonly title?: string
  readonly titleKey?: string
}

export interface InspectorDefinition<_Props extends JsonObject = JsonObject> {
  readonly formSchema?: FormSchema
}

export interface MaterialBundleFactoryContext<Props extends JsonObject = JsonObject> {
  readonly createNodeId: () => string
  readonly defaultProps: Readonly<Props>
  readonly defaultStyle?: Readonly<JsonObject>
  readonly type: NodeType
}

export type MaterialBundleFactory<Props extends JsonObject = JsonObject>
  = (context: MaterialBundleFactoryContext<Props>) => NodeBundle

export type MaterialAuthoringPolicyAction
  = | 'create'
    | 'duplicate'
    | 'move'
    | 'remove'
    | 'unwrap'
    | 'update'

export type MaterialAuthoringPolicyDecision
  = 'allowed' | 'confirmation-required' | 'denied'

export interface MaterialAuthoringPolicyContext {
  readonly action: MaterialAuthoringPolicyAction
  readonly node?: DeepReadonly<NodeDefinition>
  readonly schema: DeepReadonly<DocumentSchema>
}

export type MaterialAuthoringPolicyRule
  = | MaterialAuthoringPolicyDecision
    | ((context: MaterialAuthoringPolicyContext) => MaterialAuthoringPolicyDecision)

export type MaterialAuthoringPolicy = Partial<
  Readonly<Record<MaterialAuthoringPolicyAction, MaterialAuthoringPolicyRule>>
>

export interface MaterialAuthoringDefinition<Props extends JsonObject = JsonObject> {
  readonly createBundle?: MaterialBundleFactory<Props>
  readonly policy?: MaterialAuthoringPolicy
}

export interface MaterialDefinition<Props extends JsonObject = JsonObject> {
  readonly type: NodeType
  readonly schema?: MaterialSchemaDeclaration<Props>
  readonly authoring?: MaterialAuthoringDefinition<Props>
  readonly inspector?: InspectorDefinition<Props>
  readonly panel?: MaterialPanelDefinition
  readonly presentation: DesignerPresentation
}
