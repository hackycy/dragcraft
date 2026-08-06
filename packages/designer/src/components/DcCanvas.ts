import type { Component } from 'vue'
import { computed, defineComponent, h, isRef, ref, watch } from 'vue'
import { useCanvasPan } from '../composables/useCanvasPan'
import { useDesignerContext } from '../context'
import ApplicationSurface from '../presentation/application-surface'
import DcCanvasControls from './DcCanvasControls'

export default defineComponent({
  name: 'DcCanvas',
  setup() {
    const context = useDesignerContext()
    const viewportRef = ref<HTMLElement | null>(null)
    const stageRef = ref<HTMLElement | null>(null)
    const canvasPan = useCanvasPan(viewportRef, stageRef)
    const containerShell = computed<Component | null>(() => {
      const source = context.containerShell
      return (isRef(source) ? source.value : source) ?? null
    })
    watch(containerShell, () => canvasPan.reset())
    const dragging = computed(() => {
      return context.drag.draggingMaterialType.value !== null || context.drag.draggingNodeId.value !== null
    })

    return () => {
      const document = context.resolvedDocument.value
      const surface = document
        ? h(ApplicationSurface, {
            document,
            catalog: context.catalog,
            containerShell: containerShell.value ?? undefined,
            execute: context.executeWorkbenchAction,
            selectedNodeId: context.designer.selection.selectedNodeId.value ?? undefined,
            hoveredNodeId: context.designer.selection.hoveredNodeId.value ?? undefined,
            draggingNodeId: context.drag.draggingNodeId.value ?? undefined,
            onDropAnchor: context.drag.setDestination,
            onDrop: context.drag.handleDrop,
            onNodeDragStart: context.drag.handleNodeDragStart,
            onNodeDragEnd: context.drag.handleDragEnd,
          })
        : h('div', {
            'role': 'status',
            'data-dc-component': 'document-recovery',
            'aria-label': 'Document unavailable',
          })
      const themeStates = [
        dragging.value ? 'dragging' : null,
        canvasPan.panEnabled.value ? 'hand' : null,
        canvasPan.isPanning.value ? 'panning' : null,
      ].filter(Boolean).join(' ') || undefined

      return h('div', {
        'class': ['dc-canvas', {
          'dc-canvas--dragging': dragging.value,
          'dc-canvas--hand': canvasPan.panEnabled.value,
          'dc-canvas--panning': canvasPan.isPanning.value,
        }],
        'data-dc-component': 'canvas',
        'data-dc-state': themeStates,
      }, [
        h(DcCanvasControls, {
          interactionMode: canvasPan.mode.value,
          onModeChange: canvasPan.setMode,
          onResetView: canvasPan.reset,
        }),
        h('div', {
          'ref': (element: unknown) => { viewportRef.value = element instanceof HTMLElement ? element : null },
          'class': 'dc-canvas__viewport',
          'data-dc-part': 'viewport',
          'data-dc-interaction-boundary': '',
          'onClick': (event: MouseEvent) => {
            const target = event.target
            if (target instanceof Element && !target.closest('[data-dc-component="node-host"]'))
              context.executeWorkbenchAction({ type: 'select-node', nodeId: null })
          },
          'onClickCapture': canvasPan.handleClickCapture,
          'onPointerdownCapture': canvasPan.handlePointerDown,
          'onPointerenter': canvasPan.handlePointerEnter,
          'onPointerleave': canvasPan.handlePointerLeave,
          'onPointermoveCapture': canvasPan.handlePointerMove,
          'onPointerupCapture': canvasPan.handlePointerUp,
          'onPointercancelCapture': canvasPan.handlePointerUp,
        }, [
          h('div', {
            'ref': (element: unknown) => { stageRef.value = element instanceof HTMLElement ? element : null },
            'class': 'dc-canvas__stage',
            'data-dc-part': 'stage',
            'data-dc-canvas-stage': '',
            'style': {
              '--dc-internal-canvas-pan-x': `${canvasPan.offset.value.x}px`,
              '--dc-internal-canvas-pan-y': `${canvasPan.offset.value.y}px`,
              '--dc-internal-canvas-snap-x': `${canvasPan.pixelSnap.value.x}px`,
              '--dc-internal-canvas-snap-y': `${canvasPan.pixelSnap.value.y}px`,
            },
          }, [
            h('div', {
              'class': 'dc-canvas__content dc-canvas__content--bounded',
              'data-dc-part': 'content',
            }, [
              h('div', {
                'class': 'dc-renderer-frame-boundary',
                'data-dc-component': 'renderer-frame-boundary',
                'data-dc-toolbar-boundary': '',
              }, [surface]),
            ]),
          ]),
        ]),
      ])
    }
  },
})
