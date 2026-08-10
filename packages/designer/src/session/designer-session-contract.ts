import type { DesignerSession } from './types'
import { describe, expect, it } from 'vitest'

export interface DesignerSessionContractFixture {
  readonly session: DesignerSession
  select: (nodeId: string | null) => void
  hover: (nodeId: string | null) => void
  setDragTarget: (nodeId: string | null) => void
  addHistoryEntry: () => void
}

/** Shared semantic contract for the active DesignerSession backend. */
export function describeDesignerSessionContract(
  name: string,
  createFixture: () => DesignerSessionContractFixture,
): void {
  describe(`${name} DesignerSession contract`, () => {
    it('projects document nodes, ownership, order, and container regions', () => {
      const { session } = createFixture()

      expect(session.document.rootNodes.value.map(node => node.id)).toEqual(['ordinary', 'layout'])
      expect(session.document.root.value.id).toBe('root')
      expect(session.document.getNode('ordinary')?.type).toBe('text')
      expect(session.document.getOwner('ordinary')).toEqual({ kind: 'root', sortScope: 'content' })
      expect(session.document.getOwner('region-child')).toEqual({
        kind: 'container',
        containerId: 'layout',
        regionId: 'main',
      })
      expect(session.document.getStructurePosition('ordinary')).toMatchObject({
        owner: { kind: 'root', sortScope: 'content' },
        index: 0,
        siblingCount: 2,
        sortScope: 'content',
      })
      expect(session.document.getRegionNodes('layout', 'main').map(node => node.id)).toEqual(['region-child'])
      expect(session.document.diagnostics.value).toEqual([])
    })

    it('projects material and container facts without exposing legacy collaborators', () => {
      const { session } = createFixture()
      const layout = session.document.getNode('layout')!

      expect(session.materials.get('text')?.title).toBe('Text')
      expect(session.materials.getAll().map(meta => meta.type)).toEqual(['text', 'layout'])
      expect(session.materials.resolveCapability(session.document.getNode('ordinary')!, 'configurable')).toBe(true)
      expect(session.materials.resolveLayout(session.document.getNode('ordinary')!).sortScope).toBe('content')
      expect(session.materials.resolveContainer(layout)).toMatchObject({
        ok: true,
        plan: { containerId: 'layout' },
      })
      expect('engine' in session).toBe(false)
      expect('store' in session).toBe(false)
      expect('registry' in session).toBe(false)
      expect('layoutPlan' in session).toBe(false)
    })

    it('projects reactive selection, hover, drag, and history state', () => {
      const fixture = createFixture()
      const { session } = fixture

      fixture.select('ordinary')
      fixture.hover('layout')
      fixture.setDragTarget('ordinary')
      fixture.addHistoryEntry()

      expect(session.state.selectedNodeId.value).toBe('ordinary')
      expect(session.state.hoveredNodeId.value).toBe('layout')
      expect(session.state.dragTarget.value).toMatchObject({ sourceNodeId: 'ordinary' })
      expect(session.state.drag.activeDestination.value).toBeNull()
      expect(session.state.drag.containerDropDecision.value).toBeNull()
      expect(session.state.drag.isForbidden.value).toBe(false)
      expect(session.state.drag.forbiddenReason.value).toBeNull()
      expect(session.state.history.value.canUndo).toBe(true)
    })

    it('evaluates and executes selection, update, undo, and redo through the session seam', () => {
      const { session } = createFixture()

      expect(session.evaluate({ type: 'selection.set', nodeId: 'ordinary' })).toMatchObject({ allowed: true })
      expect(session.execute({ type: 'selection.set', nodeId: 'ordinary' })).toEqual({ ok: true, changed: true })
      expect(session.execute({ type: 'node.update', nodeId: 'ordinary', props: { changed: true } })).toEqual({
        ok: true,
        changed: true,
      })
      expect(session.document.getNode('ordinary')?.props).toMatchObject({ changed: true })
      expect(session.evaluate({ type: 'history.undo' })).toMatchObject({ allowed: true })
      expect(session.execute({ type: 'history.undo' })).toEqual({ ok: true, changed: true })
      expect(session.document.getNode('ordinary')?.props).not.toHaveProperty('changed')
      expect(session.execute({ type: 'history.redo' })).toEqual({ ok: true, changed: true })
      expect(session.document.getNode('ordinary')?.props).toMatchObject({ changed: true })
    })
  })
}
