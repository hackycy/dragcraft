import { describe, expect, it } from 'vitest'
import { resolveNodeInteractionPresentation } from './node-interaction'

describe('resolveNodeInteractionPresentation', () => {
  it('keeps root-owned nodes on the page interaction band', () => {
    expect(resolveNodeInteractionPresentation({ kind: 'root' })).toEqual({
      geometryMode: 'root-band',
      selectionKind: 'root-segment',
      toolbarPlacement: 'left-start',
      toolbarOrientation: 'vertical',
    })
  })

  it('uses the layout box for container-owned nodes', () => {
    expect(resolveNodeInteractionPresentation({
      kind: 'container',
      containerId: 'layout',
      regionId: 'left',
    })).toEqual({
      geometryMode: 'node-box',
      selectionKind: 'material-bounds',
      toolbarPlacement: 'top-end',
      toolbarOrientation: 'horizontal',
    })
  })
})
