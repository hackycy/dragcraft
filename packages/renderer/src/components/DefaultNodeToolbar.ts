import type { PropType } from 'vue'
import type { ResolvedNodeAction } from '../action-registry'
import type { NodeInteractionState } from '../types'
import { defineComponent, h } from 'vue'

/**
 * Default per-node floating toolbar component.
 * Renders actions based on the resolved action list from the action registry.
 * Supports both 'button' and 'drag-handle' action types.
 */
export default defineComponent({
  name: 'DcDefaultNodeToolbar',

  props: {
    nodeId: {
      type: String,
      required: true,
    },
    nodeType: {
      type: String,
      required: true,
    },
    actions: {
      type: Array as PropType<ResolvedNodeAction[]>,
      required: true,
    },
    state: {
      type: Object as PropType<NodeInteractionState>,
      required: true,
    },
    onDragStart: {
      type: Function as PropType<(e: DragEvent) => void>,
      required: true,
    },
    onDragEnd: {
      type: Function as PropType<(e: DragEvent) => void>,
      required: true,
    },
  },

  setup(props) {
    return () => {
      const actionVNodes = props.actions.map((action) => {
        if (action.type === 'drag-handle') {
          return h('div', {
            class: [
              'dc-node__toolbar-btn',
              'dc-node__toolbar-btn--drag',
              action.className,
            ],
            title: action.label,
            draggable: true,
            onDragstart: props.onDragStart,
            onDragend: props.onDragEnd,
          }, typeof action.icon === 'string' ? action.icon : (action.icon ? h(action.icon) : undefined))
        }

        // button type
        return h('button', {
          type: 'button',
          class: [
            'dc-node__toolbar-btn',
            action.className,
          ],
          title: action.label,
          disabled: action.disabled,
          onClick: action.handler,
        }, typeof action.icon === 'string' ? action.icon : (action.icon ? h(action.icon) : undefined))
      })

      return h('div', { class: 'dc-node__toolbar' }, actionVNodes)
    }
  },
})
