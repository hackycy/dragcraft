import type { NodeOwner } from '@dragcraft/core'
import type { NodeSelectionProjectionKind } from './selection-presentation'

export type NodeInteractionGeometryMode = 'root-band' | 'node-box'
export type NodeToolbarPlacement = 'left-start' | 'top-end'
export type NodeToolbarOrientation = 'vertical' | 'horizontal'

export interface NodeInteractionPresentation {
  geometryMode: NodeInteractionGeometryMode
  selectionKind: NodeSelectionProjectionKind
  toolbarPlacement: NodeToolbarPlacement
  toolbarOrientation: NodeToolbarOrientation
}

export function resolveNodeInteractionPresentation(
  owner: NodeOwner,
): NodeInteractionPresentation {
  return owner.kind === 'container'
    ? {
        geometryMode: 'node-box',
        selectionKind: 'material-bounds',
        toolbarPlacement: 'top-end',
        toolbarOrientation: 'horizontal',
      }
    : {
        geometryMode: 'root-band',
        selectionKind: 'root-segment',
        toolbarPlacement: 'left-start',
        toolbarOrientation: 'vertical',
      }
}
