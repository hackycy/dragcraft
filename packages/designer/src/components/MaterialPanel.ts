import type { PropType } from 'vue'
import type { DesignerWidgetDefinition, WidgetRegistry } from '../types'
import { computed, defineComponent, h } from 'vue'
import Draggable from 'vuedraggable'
import { MaterialItem } from './MaterialItem'

export const MaterialPanel = defineComponent({
  name: 'MaterialPanel',
  props: {
    registry: { type: Object as PropType<WidgetRegistry>, required: true },
    group: { type: Object as PropType<{ name: string, pull: string, put: boolean }>, required: true },
  },
  emits: ['add'],
  setup(props, { emit }) {
    const allWidgets = computed(() => props.registry.getAll())

    return () => {
      return h('div', { class: 'dragcraft-material-panel' }, [
        h('div', { class: 'dragcraft-material-panel__title' }, 'Components'),
        h(Draggable, {
          modelValue: allWidgets.value,
          group: props.group,
          sort: false,
          itemKey: 'type',
          clone: (item: DesignerWidgetDefinition) => item,
        }, {
          item: ({ element }: { element: DesignerWidgetDefinition }) =>
            h(MaterialItem, {
              definition: element,
              onAdd: (def: DesignerWidgetDefinition) => emit('add', def),
            }),
        }),
      ])
    }
  },
})
