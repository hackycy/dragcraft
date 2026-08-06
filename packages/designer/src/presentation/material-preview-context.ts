import type {
  DocumentSchema,
  JsonObject,
  NodeDefinition,
  ResolvedDocument,
} from '@dragcraft/core'
import type {
  AuthoringAction,
  AuthoringResult,
} from '../authoring/types'
import type { PresentationOwner } from './node-host'
import { cloneJsonValue, collectInvalidJsonPaths } from '@dragcraft/core'

export type MaterialSelfPatch<Props extends JsonObject = JsonObject> = Partial<Props>

export type MaterialPresentationNode<Props extends JsonObject = JsonObject>
  = Readonly<Omit<NodeDefinition, 'props' | 'style'>> & {
    readonly props: Readonly<Props>
    readonly style?: Readonly<JsonObject>
  }

export interface MaterialPresentationContext<Props extends JsonObject = JsonObject> {
  readonly node: MaterialPresentationNode<Props>
  readonly page: Readonly<DocumentSchema['page']>
  readonly globalConfig: Readonly<JsonObject>
  readonly owner: PresentationOwner
  readonly selected: boolean
  readonly hovered: boolean
  readonly dragging: boolean
}

export interface MaterialPreviewContext<Props extends JsonObject = JsonObject>
  extends MaterialPresentationContext<Props> {
  readonly updateSelf: (patch: MaterialSelfPatch<Props>) => AuthoringResult
}

export interface CreateMaterialPreviewContextOptions {
  readonly document: ResolvedDocument
  readonly node: ResolvedDocument['root'][number]
  readonly owner: PresentationOwner
  readonly selected: boolean
  readonly hovered: boolean
  readonly dragging: boolean
  readonly execute?: (action: AuthoringAction) => AuthoringResult
}

export function createMaterialPreviewContext(
  options: CreateMaterialPreviewContextOptions,
): MaterialPreviewContext {
  const sourceNode = options.node.node as unknown as NodeDefinition
  const node = sourceNode as MaterialPresentationNode
  const context: MaterialPreviewContext = {
    node,
    page: options.document.schema.page as unknown as Readonly<DocumentSchema['page']>,
    globalConfig: options.document.schema.globalConfig as unknown as Readonly<JsonObject>,
    owner: options.owner,
    selected: options.selected,
    hovered: options.hovered,
    dragging: options.dragging,
    updateSelf(patch) {
      if (patch === null || typeof patch !== 'object' || Array.isArray(patch)
        || collectInvalidJsonPaths(patch).length > 0) {
        return { status: 'rejected', code: 'INVALID_SELF_PATCH' }
      }
      if (!options.execute)
        return { status: 'rejected', code: 'AUTHORING_UNAVAILABLE' }
      const props: JsonObject = {
        ...cloneJsonValue(sourceNode.props) as JsonObject,
        ...cloneJsonValue(patch as JsonObject) as JsonObject,
      }
      const action: AuthoringAction = {
        type: 'update-node',
        nodeId: sourceNode.id,
        node: {
          type: sourceNode.type,
          props,
          ...(sourceNode.style
            ? { style: cloneJsonValue(sourceNode.style) as JsonObject }
            : {}),
        },
      }
      return options.execute(action)
    },
  }
  return Object.freeze(context)
}
