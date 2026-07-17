import { describe, expect, it } from 'vitest'
import { createDesignerWorkspace } from './workspace'

describe('createDesignerWorkspace', () => {
  it('uses product defaults', () => {
    const workspace = createDesignerWorkspace()

    expect(workspace.compactBreakpoint).toBe(1100)
    expect(workspace.leftPanelWidth).toBe(280)
    expect(workspace.rightPanelWidth).toBe(320)
    expect(workspace.railWidth).toBe(44)
    expect(workspace.drawerWidth).toBe(320)
    expect(workspace.keyboardShortcuts).toBe(true)
    expect(workspace.mode.value).toBe('wide')
    expect(workspace.leftOpen.value).toBe(true)
    expect(workspace.rightOpen.value).toBe(true)
  })

  it('resolves product layout dimensions independently from the theme', () => {
    const workspace = createDesignerWorkspace({
      leftPanelWidth: 260,
      rightPanelWidth: 360,
      railWidth: 48,
      drawerWidth: 340,
    })

    expect(workspace.leftPanelWidth).toBe(260)
    expect(workspace.rightPanelWidth).toBe(360)
    expect(workspace.railWidth).toBe(48)
    expect(workspace.drawerWidth).toBe(340)
  })

  it('closes drawers on compact entry and restores wide dock state', () => {
    const workspace = createDesignerWorkspace({ defaultRightOpen: false })

    workspace.setMode('compact')
    expect(workspace.leftOpen.value).toBe(false)
    expect(workspace.rightOpen.value).toBe(false)

    workspace.openRight('widget')
    expect(workspace.rightOpen.value).toBe(true)
    workspace.setMode('wide')

    expect(workspace.leftOpen.value).toBe(true)
    expect(workspace.rightOpen.value).toBe(false)
    expect(workspace.activeRightPanel.value).toBe('widget')
  })

  it('keeps compact drawers mutually exclusive', () => {
    const workspace = createDesignerWorkspace()
    workspace.setMode('compact')

    workspace.openLeft('structure')
    workspace.openRight('global')

    expect(workspace.leftOpen.value).toBe(false)
    expect(workspace.rightOpen.value).toBe(true)
    expect(workspace.activeLeftPanel.value).toBe('structure')
  })
})
