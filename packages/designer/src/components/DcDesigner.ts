import type { PropType } from 'vue'
import type { DesignerContext, DesignerInstance } from '../types'
import { I18N_KEY } from '@dragcraft/utils'
import { defineComponent, h, nextTick, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import { useDragDrop } from '../composables/useDragDrop'
import { DESIGNER_CONTEXT_KEY } from '../types'
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
    instance: {
      type: Object as PropType<DesignerInstance>,
      required: true,
    },
  },

  setup(props) {
    const {
      engine,
      componentMap,
      widgetGroups,
      extensions,
      fieldComponentMap,
      globalConfigSchema,
      eventHooks,
      actionInterceptors,
      actionRegistry,
      i18n,
      workspace,
    } = props.instance
    const rootRef = ref<HTMLElement | null>(null)
    const leftPanelRef = ref<HTMLElement | null>(null)
    const rightPanelRef = ref<HTMLElement | null>(null)
    const searchQuery = ref('')
    const dragDrop = useDragDrop(engine)
    let resizeObserver: ResizeObserver | null = null
    const focusTimers = new Set<ReturnType<typeof setTimeout>>()

    const ctx: DesignerContext = {
      engine,
      componentMap,
      widgetGroups,
      extensions,
      fieldComponentMap,
      globalConfigSchema,
      eventHooks,
      actionInterceptors,
      actionRegistry,
      workspace,
      dragOverNodeId: dragDrop.dragOverNodeId,
      dragOverIndex: dragDrop.dragOverIndex,
      handleMaterialDragStart: dragDrop.handleMaterialDragStart,
      handleDragEnd: dragDrop.handleDragEnd,
      handleCanvasDragOver: dragDrop.handleCanvasDragOver,
      handleCanvasDragLeave: dragDrop.handleCanvasDragLeave,
      handleCanvasDrop: dragDrop.handleCanvasDrop,
      isForbidden: dragDrop.isForbidden,
      forbiddenReason: dragDrop.forbiddenReason,
      searchQuery,
      activeTab: workspace.activeRightPanel,
      leftPanelActiveTab: workspace.activeLeftPanel,
    }
    provide(DESIGNER_CONTEXT_KEY, ctx)
    provide(I18N_KEY, i18n)
    const { t } = i18n

    function updateLayoutMode(width: number): void {
      workspace.setMode(width < workspace.compactBreakpoint ? 'compact' : 'wide')
    }

    function focusPanel(panel: HTMLElement | null): void {
      const focusable = panel?.querySelector<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]')
      focusable?.focus({ preventScroll: true })
    }

    function restoreControlFocus(control: 'left' | 'right'): void {
      rootRef.value
        ?.querySelector<HTMLElement>(`[data-dc-workspace-control="${control}"]`)
        ?.focus({ preventScroll: true })
    }

    function afterRender(callback: () => void): void {
      nextTick(() => {
        const timer = setTimeout(() => {
          focusTimers.delete(timer)
          callback()
        }, 0)
        focusTimers.add(timer)
      })
    }

    watch(workspace.leftOpen, (open, previous) => {
      if (workspace.mode.value !== 'compact')
        return
      if (open)
        afterRender(() => workspace.leftOpen.value && focusPanel(leftPanelRef.value))
      else if (previous)
        afterRender(() => !workspace.rightOpen.value && restoreControlFocus('left'))
    })

    watch(workspace.rightOpen, (open, previous) => {
      if (workspace.mode.value !== 'compact')
        return
      if (open)
        afterRender(() => workspace.rightOpen.value && focusPanel(rightPanelRef.value))
      else if (previous)
        afterRender(() => !workspace.leftOpen.value && restoreControlFocus('right'))
    })

    function handleKeydown(event: KeyboardEvent): void {
      if (event.key === 'Escape' && workspace.mode.value === 'compact' && (workspace.leftOpen.value || workspace.rightOpen.value)) {
        event.preventDefault()
        workspace.closeDrawers()
        return
      }

      if (!workspace.keyboardShortcuts || isEditableTarget(event.target))
        return

      const modifier = event.metaKey || event.ctrlKey
      if (!modifier)
        return

      const key = event.key.toLowerCase()
      if (key === 'z') {
        event.preventDefault()
        if (event.shiftKey)
          engine.history.redo()
        else
          engine.history.undo()
      }
      else if (key === 'y' && event.ctrlKey) {
        event.preventDefault()
        engine.history.redo()
      }
    }

    function handlePointerdown(event: PointerEvent): void {
      const target = event.target
      if (target instanceof Element && !target.closest(INTERACTIVE_SELECTOR))
        rootRef.value?.focus({ preventScroll: true })
    }

    onMounted(() => {
      const root = rootRef.value
      if (!root)
        return
      updateLayoutMode(root.getBoundingClientRect().width)
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(entries => updateLayoutMode(entries[0]?.contentRect.width ?? root.clientWidth))
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

      return h('div', {
        'ref': rootRef,
        'class': [
          'dc-designer',
          `dc-designer--${workspace.mode.value}`,
          {
            'dc-designer--left-open': workspace.leftOpen.value,
            'dc-designer--right-open': workspace.rightOpen.value,
          },
        ],
        'tabindex': -1,
        'data-dc-workspace-mode': workspace.mode.value,
        'onKeydown': handleKeydown,
        'onPointerdown': handlePointerdown,
      }, [
        h('div', { class: 'dc-designer__body' }, [
          drawerOpen
            ? h('button', {
                'type': 'button',
                'class': 'dc-workspace-backdrop',
                'aria-label': t('workspace.drawer.close', '关闭面板'),
                'onClick': workspace.closeDrawers,
              })
            : null,
          h('aside', {
            'ref': leftPanelRef,
            'class': [
              'dc-designer__panel',
              'dc-designer__panel--left',
              { 'dc-designer__panel--open': workspace.leftOpen.value },
            ],
            'aria-label': t('workspace.left.label', '物料与结构'),
            'onTransitionend': (event: TransitionEvent) => {
              if (event.propertyName === 'transform' && compact && workspace.leftOpen.value)
                focusPanel(leftPanelRef.value)
            },
          }, [h(DcLeftSidebar)]),
          h('main', { class: 'dc-designer__panel dc-designer__panel--center' }, [h(DcCanvas)]),
          h('aside', {
            'ref': rightPanelRef,
            'class': [
              'dc-designer__panel',
              'dc-designer__panel--right',
              { 'dc-designer__panel--open': workspace.rightOpen.value },
            ],
            'aria-label': t('workspace.right.label', '属性检查器'),
            'onTransitionend': (event: TransitionEvent) => {
              if (event.propertyName === 'transform' && compact && workspace.rightOpen.value)
                focusPanel(rightPanelRef.value)
            },
          }, [h(DcRightSidebar)]),
        ]),
      ])
    }
  },
})
