import type { NodeOwner } from '@dragcraft/core'

export type NodeInteractionGeometryMode = 'root-band' | 'node-box'
export type NodeToolbarPlacement = 'left-start' | 'top-end'
export type NodeToolbarOrientation = 'vertical' | 'horizontal'

export interface NodeInteractionPresentation {
  geometryMode: NodeInteractionGeometryMode
  toolbarPlacement: NodeToolbarPlacement
  toolbarOrientation: NodeToolbarOrientation
}

export function resolveNodeInteractionPresentation(
  owner: NodeOwner,
): NodeInteractionPresentation {
  return owner.kind === 'container'
    ? {
        geometryMode: 'node-box',
        toolbarPlacement: 'top-end',
        toolbarOrientation: 'horizontal',
      }
    : {
        geometryMode: 'root-band',
        toolbarPlacement: 'left-start',
        toolbarOrientation: 'vertical',
      }
}
