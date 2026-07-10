import type {
  DesignerWorkspaceController,
  DesignerWorkspaceMode,
  DesignerWorkspaceOptions,
  LeftPanelTabKey,
  PropertyTabKey,
} from './types'
import { ref } from 'vue'

const DEFAULT_COMPACT_BREAKPOINT = 1100

export function createDesignerWorkspace(
  options: DesignerWorkspaceOptions = {},
): DesignerWorkspaceController {
  const compactBreakpoint = options.compactBreakpoint ?? DEFAULT_COMPACT_BREAKPOINT
  const keyboardShortcuts = options.keyboardShortcuts ?? true
  const mode = ref<DesignerWorkspaceMode>('wide')
  const leftOpen = ref(options.defaultLeftOpen ?? true)
  const rightOpen = ref(options.defaultRightOpen ?? true)
  const activeLeftPanel = ref<LeftPanelTabKey>('materials')
  const activeRightPanel = ref<PropertyTabKey>('global')

  let wideLeftOpen = leftOpen.value
  let wideRightOpen = rightOpen.value

  function setMode(nextMode: DesignerWorkspaceMode): void {
    if (mode.value === nextMode)
      return

    if (nextMode === 'compact') {
      wideLeftOpen = leftOpen.value
      wideRightOpen = rightOpen.value
      leftOpen.value = false
      rightOpen.value = false
    }
    else {
      leftOpen.value = wideLeftOpen
      rightOpen.value = wideRightOpen
    }
    mode.value = nextMode
  }

  function openLeft(panel?: LeftPanelTabKey): void {
    if (panel)
      activeLeftPanel.value = panel
    leftOpen.value = true
    if (mode.value === 'compact')
      rightOpen.value = false
    else
      wideLeftOpen = true
  }

  function closeLeft(): void {
    leftOpen.value = false
    if (mode.value === 'wide')
      wideLeftOpen = false
  }

  function toggleLeft(panel?: LeftPanelTabKey): void {
    if (leftOpen.value && (!panel || activeLeftPanel.value === panel))
      closeLeft()
    else
      openLeft(panel)
  }

  function openRight(panel?: PropertyTabKey): void {
    if (panel)
      activeRightPanel.value = panel
    rightOpen.value = true
    if (mode.value === 'compact')
      leftOpen.value = false
    else
      wideRightOpen = true
  }

  function closeRight(): void {
    rightOpen.value = false
    if (mode.value === 'wide')
      wideRightOpen = false
  }

  function toggleRight(panel?: PropertyTabKey): void {
    if (rightOpen.value && (!panel || activeRightPanel.value === panel))
      closeRight()
    else
      openRight(panel)
  }

  function closeDrawers(): void {
    if (mode.value !== 'compact')
      return
    leftOpen.value = false
    rightOpen.value = false
  }

  return {
    compactBreakpoint,
    keyboardShortcuts,
    mode,
    leftOpen,
    rightOpen,
    activeLeftPanel,
    activeRightPanel,
    setMode,
    openLeft,
    closeLeft,
    toggleLeft,
    openRight,
    closeRight,
    toggleRight,
    closeDrawers,
  }
}
