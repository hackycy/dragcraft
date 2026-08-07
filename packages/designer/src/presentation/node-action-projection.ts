import type { ResolvedDocument } from '@dragcraft/core'
import type { AuthoringResult, SchemaAuthoringAction } from '../authoring/types'
import type { MaterialCatalog } from '../materials/create-material-catalog'

export type NodeToolbarActionName = 'drag' | 'move-up' | 'move-down' | 'duplicate' | 'remove'

export interface NodeToolbarActionState {
  readonly action?: SchemaAuthoringAction
  readonly disabled: boolean
  readonly name: NodeToolbarActionName
  readonly visible: boolean
}

export interface ProjectNodeToolbarActionsOptions {
  readonly catalog: MaterialCatalog
  readonly document: ResolvedDocument
  readonly evaluate?: (action: SchemaAuthoringAction) => AuthoringResult
  readonly nodeId: string
}

function actionIsAvailable(
  action: SchemaAuthoringAction | undefined,
  evaluate: ProjectNodeToolbarActionsOptions['evaluate'],
): boolean {
  if (!action)
    return false
  return evaluate?.(action).status !== 'rejected'
}

export function projectNodeToolbarActions(
  options: ProjectNodeToolbarActionsOptions,
): readonly NodeToolbarActionState[] {
  const node = options.document.nodesById.get(options.nodeId)
  const location = options.document.locationsById.get(options.nodeId)
  if (!node || node.state !== 'resolved' || node.readOnly || !location
    || !options.catalog.getMaterial(node.node.type)) {
    return []
  }

  const owner = location.kind === 'container-region'
    ? {
        kind: 'container-region' as const,
        containerId: location.containerId,
        regionId: location.regionId,
      }
    : { kind: 'page-root' as const }
  const siblings = location.kind === 'container-region'
    ? options.document.containersById
      .get(location.containerId)
      ?.regions
      .get(location.regionId)
      ?.children ?? []
    : options.document.root
  const previousNodeId = siblings[location.index - 1]?.node.id
  const nextNodeId = siblings[location.index + 1]?.node.id
  const moveUp = previousNodeId
    ? {
        type: 'move-node' as const,
        nodeId: options.nodeId,
        to: { owner, position: { kind: 'before' as const, nodeId: previousNodeId } },
      }
    : undefined
  const moveDown = nextNodeId
    ? {
        type: 'move-node' as const,
        nodeId: options.nodeId,
        to: { owner, position: { kind: 'after' as const, nodeId: nextNodeId } },
      }
    : undefined
  const drag = moveUp ?? moveDown ?? {
    type: 'move-node' as const,
    nodeId: options.nodeId,
    to: { owner, position: { kind: 'end' as const } },
  }
  const duplicate = {
    type: 'duplicate-node' as const,
    nodeId: options.nodeId,
    to: { owner, position: { kind: 'after' as const, nodeId: options.nodeId } },
  }
  const remove = { type: 'remove-node' as const, nodeId: options.nodeId }

  return [
    { name: 'drag', action: drag, visible: true, disabled: !actionIsAvailable(drag, options.evaluate) },
    { name: 'move-up', action: moveUp, visible: true, disabled: !actionIsAvailable(moveUp, options.evaluate) },
    { name: 'move-down', action: moveDown, visible: true, disabled: !actionIsAvailable(moveDown, options.evaluate) },
    { name: 'duplicate', action: duplicate, visible: true, disabled: !actionIsAvailable(duplicate, options.evaluate) },
    { name: 'remove', action: remove, visible: true, disabled: !actionIsAvailable(remove, options.evaluate) },
  ]
}
