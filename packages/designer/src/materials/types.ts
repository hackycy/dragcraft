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

/** A visual Material's optional Designer-only wrapper around one NodeHost slot. */
export type PresentationFrame = Component

export type DesignerPresentation
  = | {
    readonly kind: 'visual'
    readonly preview: Component
    readonly frame?: PresentationFrame
  }
  | {
    readonly kind: 'headless'
  }

export interface MaterialPanelVisibilityContext {
  readonly materialType: NodeType
  readonly schema: DeepReadonly<DocumentSchema> | null
}

export type MaterialPanelVisibility
  = boolean
    | ((context: MaterialPanelVisibilityContext) => boolean)

export interface MaterialSchemaDeclaration<Props extends object = object> {
  readonly container?: ContainerDeclaration
  readonly defaultProps?: Props
  readonly defaultStyle?: JsonObject
}

export interface MaterialPanelDefinition {
  readonly description?: string
  readonly descriptionKey?: string
  readonly group?: string
  /** Localized label for the material group. */
  readonly groupTitle?: string
  /** i18n key for the material group label. */
  readonly groupTitleKey?: string
  readonly icon?: Component | string
  readonly keywords?: readonly string[]
  readonly tags?: readonly string[]
  readonly thumbnail?: string
  readonly title?: string
  readonly titleKey?: string
  /** Whether this material is listed in the standard material panel. */
  readonly visible?: MaterialPanelVisibility
}

export interface InspectorDefinition<_Props extends object = object> {
  readonly formSchema?: FormSchema
}

export interface MaterialBundleFactoryContext<Props extends object = object> {
  readonly createNodeId: () => string
  readonly defaultProps: Readonly<Props>
  readonly defaultStyle?: Readonly<JsonObject>
  readonly type: NodeType
}

export type MaterialBundleFactory<Props extends object = object>
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

export interface MaterialAuthoringDefinition<Props extends object = object> {
  readonly createBundle?: MaterialBundleFactory<Props>
  readonly policy?: MaterialAuthoringPolicy
}

export interface MaterialDefinition<Props extends object = object> {
  readonly type: NodeType
  readonly schema?: MaterialSchemaDeclaration<Props>
  readonly authoring?: MaterialAuthoringDefinition<Props>
  readonly inspector?: InspectorDefinition<Props>
  readonly panel?: MaterialPanelDefinition
  readonly presentation: DesignerPresentation
}
