import type { NodeSelectionProjectionKind } from './selection-presentation'
import type { NodeOwner } from './semantic'

export type NodeInteractionGeometryMode = 'root-band' | 'node-box'
export type NodeToolbarAnchor = 'left-start' | 'top-end'
export type NodeToolbarOrientation = 'vertical' | 'horizontal'

export interface NodeInteractionPresentation {
  geometryMode: NodeInteractionGeometryMode
  selectionKind: NodeSelectionProjectionKind
  toolbarAnchor: NodeToolbarAnchor
  toolbarOrientation: NodeToolbarOrientation
}

export function resolveNodeInteractionPresentation(
  owner: NodeOwner,
): NodeInteractionPresentation {
  return owner.kind === 'container'
    ? {
        geometryMode: 'node-box',
        selectionKind: 'material-bounds',
        toolbarAnchor: 'top-end',
        toolbarOrientation: 'horizontal',
      }
    : {
        geometryMode: 'root-band',
        selectionKind: 'root-segment',
        toolbarAnchor: 'left-start',
        toolbarOrientation: 'vertical',
      }
}
