import type { PropType } from 'vue'
import type { ResolvedNodeAction } from '../action-registry'
import type { NodeInteractionState, ToolbarPositionData } from '../types'
import { defineComponent, h } from 'vue'

/**
 * Default per-node floating toolbar component.
 * Renders actions based on the resolved action list from the action registry.
 * Supports both 'button' and 'drag-handle' action types.
 *
 * Positioning is owned by WidgetRenderer's measurable floating wrapper. The
 * resolved placement controls whether actions use a vertical or horizontal row.
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
    toolbarPosition: {
      type: Object as PropType<ToolbarPositionData>,
      default: undefined,
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
      const pos = props.toolbarPosition
      const useFixed = pos != null

      const actionVNodes = props.actions.map((action) => {
        if (action.type === 'drag-handle') {
          return h('div', {
            class: [
              'dc-node__toolbar-btn',
              'dc-node__toolbar-btn--drag',
              { 'dc-node__toolbar-btn--disabled': action.disabled },
              action.className,
            ],
            title: action.label,
            draggable: !action.disabled,
            onDragstart: action.disabled ? undefined : props.onDragStart,
            onDragend: action.disabled ? undefined : props.onDragEnd,
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

      return h('div', {
        'class': [
          'dc-node__toolbar',
          {
            'dc-node__toolbar--floating': useFixed,
          },
        ],
        'data-placement': pos?.placement,
      }, actionVNodes)
    }
  },
})
