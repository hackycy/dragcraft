import type { PropType } from 'vue'
import type { DesignerContext } from '../context'
import type { DesignerInstance } from '../session/create-designer'
import { resolveSchema } from '@dragcraft/core'
import { I18N_KEY } from '@dragcraft/i18n'
import { computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import { useDragDrop } from '../composables/useDragDrop'
import { DESIGNER_CONTEXT_KEY } from '../context'
import { getDesignerInternals } from '../session/create-designer'
import DcCanvas from './DcCanvas'
import DcLeftSidebar from './DcLeftSidebar'
import DcRightSidebar from './DcRightSidebar'

const EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable="true"], [contenteditable=""]'
const INTERACTIVE_SELECTOR = `${EDITABLE_SELECTOR}, button, a[href]`

function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(EDITABLE_SELECTOR))
}

export default defineComponent({
  name: 'DcDesigner',
  props: {
    instance: { type: Object as PropType<DesignerInstance>, required: true },
  },
  setup(props) {
    const internals = getDesignerInternals(props.instance)
    const { workspace } = internals
    const rootRef = ref<HTMLElement | null>(null)
    const leftPanelRef = ref<HTMLElement | null>(null)
    const rightPanelRef = ref<HTMLElement | null>(null)
    const searchQuery = ref('')
    const drag = useDragDrop(props.instance)
    const resolvedDocument = computed(() => {
      const state = props.instance.document.value
      if (state.status === 'rejected')
        return null
      const result = resolveSchema(
        state.schema,
        internals.catalog.schemaDefinitions,
        { maxDiagnostics: internals.maxDiagnostics },
      )
      return result.status === 'rejected' ? null : result.document
    })
    const context: DesignerContext = Object.freeze({
      ...internals,
      designer: props.instance,
      drag,
      resolvedDocument,
      searchQuery,
    })
    provide(DESIGNER_CONTEXT_KEY, context)
    provide(I18N_KEY, internals.i18n)

    let resizeObserver: ResizeObserver | null = null
    const focusTimers = new Set<ReturnType<typeof setTimeout>>()
    const focusPanel = (panel: HTMLElement | null) => panel
      ?.querySelector<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]')
      ?.focus({ preventScroll: true })
    const restoreFocus = (side: 'left' | 'right') => rootRef.value
      ?.querySelector<HTMLElement>(`[data-dc-workspace-control="${side}"]`)
      ?.focus({ preventScroll: true })
    const afterRender = (callback: () => void) => nextTick(() => {
      const timer = setTimeout(() => {
        focusTimers.delete(timer)
        callback()
      }, 0)
      focusTimers.add(timer)
    })

    watch(workspace.leftOpen, (open, previous) => {
      if (workspace.mode.value !== 'compact')
        return
      if (open)
        afterRender(() => focusPanel(leftPanelRef.value))
      else if (previous && !workspace.rightOpen.value)
        afterRender(() => restoreFocus('left'))
    })
    watch(workspace.rightOpen, (open, previous) => {
      if (workspace.mode.value !== 'compact')
        return
      if (open)
        afterRender(() => focusPanel(rightPanelRef.value))
      else if (previous && !workspace.leftOpen.value)
        afterRender(() => restoreFocus('right'))
    })

    function handleKeydown(event: KeyboardEvent): void {
      if (event.key === 'Escape' && workspace.mode.value === 'compact'
        && (workspace.leftOpen.value || workspace.rightOpen.value)) {
        event.preventDefault()
        workspace.closeDrawers()
        return
      }
      if (!workspace.keyboardShortcuts || isEditableTarget(event.target))
        return
      if (!(event.metaKey || event.ctrlKey))
        return
      const key = event.key.toLowerCase()
      if (key === 'z') {
        event.preventDefault()
        props.instance.execute({ type: event.shiftKey ? 'redo' : 'undo' })
      }
      else if (key === 'y' && event.ctrlKey) {
        event.preventDefault()
        props.instance.execute({ type: 'redo' })
      }
    }

    onMounted(() => {
      const root = rootRef.value
      if (!root)
        return
      workspace.setMode(root.getBoundingClientRect().width < workspace.compactBreakpoint ? 'compact' : 'wide')
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver((entries) => {
          const width = entries[0]?.contentRect.width ?? root.clientWidth
          workspace.setMode(width < workspace.compactBreakpoint ? 'compact' : 'wide')
        })
        resizeObserver.observe(root)
      }
    })
    onBeforeUnmount(() => {
      resizeObserver?.disconnect()
      focusTimers.forEach(timer => clearTimeout(timer))
      focusTimers.clear()
    })

    return () => {
      const compact = workspace.mode.value === 'compact'
      const drawerOpen = compact && (workspace.leftOpen.value || workspace.rightOpen.value)
      const states = [
        workspace.mode.value,
        workspace.leftOpen.value ? 'left-open' : null,
        workspace.rightOpen.value ? 'right-open' : null,
      ].filter(Boolean).join(' ')
      return h('div', {
        'ref': rootRef,
        'class': ['dc-designer', `dc-designer--${workspace.mode.value}`, {
          'dc-designer--left-open': workspace.leftOpen.value,
          'dc-designer--right-open': workspace.rightOpen.value,
        }],
        'data-dc-component': 'designer',
        'data-dc-state': states,
        'data-dc-workspace-mode': workspace.mode.value,
        'tabindex': -1,
        'style': {
          '--dc-internal-designer-workspace-left-width': `${workspace.leftPanelWidth}px`,
          '--dc-internal-designer-workspace-right-width': `${workspace.rightPanelWidth}px`,
          '--dc-internal-designer-workspace-rail-width': `${workspace.railWidth}px`,
          '--dc-internal-designer-workspace-drawer-width': `${workspace.drawerWidth}px`,
        },
        'onKeydown': handleKeydown,
        'onPointerdown': (event: PointerEvent) => {
          if (event.target instanceof Element && !event.target.closest(INTERACTIVE_SELECTOR))
            rootRef.value?.focus({ preventScroll: true })
        },
      }, [
        h('div', { 'class': 'dc-designer__body', 'data-dc-part': 'body' }, [
          drawerOpen
            ? h('button', {
                'type': 'button',
                'class': 'dc-workspace-backdrop',
                'data-dc-part': 'backdrop',
                'aria-label': internals.i18n.t('workspace.drawer.close', '关闭面板'),
                'onClick': workspace.closeDrawers,
              })
            : null,
          h('aside', {
            'ref': leftPanelRef,
            'class': ['dc-designer__panel', 'dc-designer__panel--left', { 'dc-designer__panel--open': workspace.leftOpen.value }],
            'data-dc-part': 'left-panel',
          }, [h(DcLeftSidebar)]),
          h('main', { 'class': 'dc-designer__panel dc-designer__panel--center', 'data-dc-part': 'center-panel' }, [h(DcCanvas)]),
          h('aside', {
            'ref': rightPanelRef,
            'class': ['dc-designer__panel', 'dc-designer__panel--right', { 'dc-designer__panel--open': workspace.rightOpen.value }],
            'data-dc-part': 'right-panel',
          }, [h(DcRightSidebar)]),
        ]),
      ])
    }
  },
})
