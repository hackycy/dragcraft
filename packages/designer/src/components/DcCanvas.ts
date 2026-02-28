import type { SchemaNode } from '@dragcraft/core'
import { CommandType, findNearestValidIndex, getLockedIndices, getValidDropIndices, resolveBehavior } from '@dragcraft/core'
import { RootRenderer } from '@dragcraft/renderer'
import { generateShortId } from '@dragcraft/utils'
import { computed, defineComponent, h, ref } from 'vue'
import { useDesignerContext } from '../context'
import DcToolbar from './DcToolbar'

export default defineComponent({
  name: 'DcCanvas',

  setup() {
    const ctx = useDesignerContext()
    const { engine, componentMap, extensions, dragOverNodeId, eventHooks, actionRegistry } = ctx

    // Visual insertion index computed during dragover (0..n for n widgets)
    const dragOverIndex = ref<number | null>(null)

    // Build renderer extensions (merge designer-level overrides)
    const rendererExtensions = computed(() => ({
      ...(extensions.rendererExtensions ?? {}),
    }))

    // ── Helpers ──

    /**
     * Compute the visual drop index based on mouse Y position relative to
     * widget elements in the canvas. Compares against each widget's vertical
     * midpoint to determine the insertion gap.
     */
    function computeDropIndex(e: DragEvent): number {
      const canvasEl = e.currentTarget as HTMLElement
      const widgetEls = canvasEl.querySelectorAll<HTMLElement>(
        '[data-node-id]:not([data-node-id="root"])',
      )
      const mouseY = e.clientY
      for (let i = 0; i < widgetEls.length; i++) {
        const rect = widgetEls[i].getBoundingClientRect()
        const midY = rect.top + rect.height / 2
        if (mouseY < midY) {
          return i
        }
      }
      return widgetEls.length
    }

    // ── Sortable constraint helpers ──

    // Cached locked indices (recomputed only when schema changes)
    const lockedIndices = computed(() => {
      void engine.store.schema.value
      const children = engine.store.getRawSchema().root.children ?? []
      return getLockedIndices(children, engine.registry, engine.store.getRawSchema())
    })

    // Valid drop indices for the current drag operation
    const validDropIndices = computed(() => {
      const dragTarget = engine.store.dragTarget.value
      if (!dragTarget)
        return null
      void engine.store.schema.value
      const children = engine.store.getRawSchema().root.children ?? []
      return getValidDropIndices(children, lockedIndices.value, dragTarget.sourceNodeId)
    })

    // ── Drag event handlers (event delegation) ──

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      // Flat model: always drop into root
      dragOverNodeId.value = 'root'
      if (e.dataTransfer) {
        const dragTarget = engine.store.dragTarget.value
        e.dataTransfer.dropEffect = dragTarget?.sourceNodeId ? 'move' : 'copy'
      }

      const rawIndex = computeDropIndex(e)
      const valid = validDropIndices.value

      if (valid && valid.size > 0) {
        // Clamp to nearest valid position
        dragOverIndex.value = valid.has(rawIndex)
          ? rawIndex
          : findNearestValidIndex(rawIndex, valid)
      }
      else if (valid && valid.size === 0) {
        // No valid positions at all — don't show drop indicator
        dragOverIndex.value = null
      }
      else {
        // No active drag or no locked widgets — use raw index
        dragOverIndex.value = rawIndex
      }
    }

    const handleDragLeave = (e: DragEvent) => {
      // Only clear if leaving the canvas entirely
      const relatedTarget = e.relatedTarget as HTMLElement | null
      const canvasEl = e.currentTarget as HTMLElement
      if (!relatedTarget || !canvasEl.contains(relatedTarget)) {
        dragOverNodeId.value = null
        dragOverIndex.value = null
      }
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      dragOverNodeId.value = null
      const visualIndex = dragOverIndex.value
      dragOverIndex.value = null

      const dragTarget = engine.store.dragTarget.value
      if (!dragTarget)
        return

      // No valid drop position (sortable constraints block all positions)
      if (visualIndex === null) {
        engine.store.setDragTarget(null)
        return
      }

      if (dragTarget.sourceNodeId) {
        // Moving existing node to the computed position
        const children = engine.store.getRawSchema().root.children ?? []
        const srcIdx = children.findIndex(c => c.id === dragTarget.sourceNodeId)

        // Convert visual gap index to MOVE_NODE target index.
        // After the source is removed, items after it shift left by 1.
        let targetIdx = visualIndex ?? children.length
        if (srcIdx !== -1 && targetIdx > srcIdx) {
          targetIdx = targetIdx - 1
        }

        engine.execute({
          type: CommandType.MOVE_NODE,
          payload: {
            nodeId: dragTarget.sourceNodeId,
            index: targetIdx,
          },
        })
      }
      else if (dragTarget.widgetType) {
        // Adding new widget from material panel
        const meta = engine.registry.getWidget(dragTarget.widgetType)
        if (!meta)
          return

        // Guard: check creatable at drop time (defensive — material item already guards drag)
        if (!resolveBehavior(meta.creatable, { widgetType: meta.type, schema: engine.store.getRawSchema() }))
          return

        const newNode: SchemaNode = {
          id: generateShortId(),
          type: meta.type,
          props: { ...meta.defaultProps },
          style: meta.defaultStyle ? { ...meta.defaultStyle } : undefined,
        }

        engine.execute({
          type: CommandType.ADD_NODE,
          payload: {
            node: newNode,
            index: visualIndex ?? undefined,
          },
        })

        // Auto-select the newly added widget
        engine.store.selectNode(newNode.id)
      }

      // Clear drag state
      engine.store.setDragTarget(null)
    }

    // Deselect when clicking canvas background
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Check if click landed on a widget node (has data-node-id that isn't root)
      const nodeEl = target.closest('[data-node-id]') as HTMLElement | null
      if (!nodeEl || nodeEl.dataset.nodeId === 'root') {
        engine.store.selectNode(null)
      }
    }

    return () =>
      h(
        'div',
        {
          class: 'dc-canvas',
          onDragover: handleDragOver,
          onDragleave: handleDragLeave,
          onDrop: handleDrop,
          onClick: handleClick,
        },
        [
          // Toolbar (inside canvas, above content)
          h(DcToolbar),
          // Canvas content area
          h('div', { class: 'dc-canvas__content' }, [
            h(RootRenderer, {
              engine,
              componentMap,
              extensions: rendererExtensions.value,
              eventHooks,
              actionRegistry,
              dragOverNodeId,
              dragOverIndex,
            }),
          ]),
        ],
      )
  },
})
