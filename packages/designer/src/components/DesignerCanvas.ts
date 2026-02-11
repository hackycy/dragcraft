import type { WidgetSchema } from '@dragcraft/core'
import type { WidgetComponentMap } from '@dragcraft/renderer'
import type { PropType } from 'vue'
import { ref, watch } from '@vue/reactivity'
import { WidgetWrapper } from '@dragcraft/renderer'
import { defineComponent, h } from 'vue'
import Draggable from 'vuedraggable'

export const DesignerCanvas = defineComponent({
  name: 'DesignerCanvas',
  props: {
    widgets: { type: Array as PropType<WidgetSchema[]>, required: true },
    components: { type: Object as PropType<WidgetComponentMap>, required: true },
    activeId: { type: [String, null] as PropType<string | null>, default: null },
    canvasGroup: { type: Object, required: true },
  },
  emits: ['select', 'reorder', 'addWidget'],
  setup(props, { emit }) {
    // Local mutable copy for vuedraggable (engine state is readonly)
    console.log('[DesignerCanvas] setup called, initial widgets count:', props.widgets.length)
    const localWidgets = ref<WidgetSchema[]>([...props.widgets])

    watch(() => props.widgets, (newWidgets) => {
      console.log('[DesignerCanvas] watch triggered, new widgets count:', newWidgets.length)
      localWidgets.value = [...newWidgets]
    }, { deep: true })

    function handleChange(evt: any): void {
      console.log('[DesignerCanvas] handleChange called:', evt)
      // Handle adding widget from material panel
      if (evt.added) {
        const definition = evt.added.element
        console.log('[DesignerCanvas] Widget added from material panel:', definition)
        // Remove the temporary element added by vuedraggable
        localWidgets.value.splice(evt.added.newIndex, 1)
        // Emit event to let Designer handle the actual widget creation
        emit('addWidget', definition)
      }
      // Handle reordering within canvas
      else if (evt.moved) {
        console.log('[DesignerCanvas] Widget reordered')
        emit('reorder', localWidgets.value.map(w => w.id))
      }
    }

    return () => {
      console.log('[DesignerCanvas] render called, localWidgets count:', localWidgets.value.length)
      return h('div', {
        class: 'dragcraft-canvas',
        onClick: (e: Event) => {
          if (e.target === e.currentTarget) {
            emit('select', null)
          }
        },
      }, [
        h(Draggable, {
          'modelValue': localWidgets.value,
          'onUpdate:modelValue': (val: WidgetSchema[]) => {
            localWidgets.value = val
          },
          'onChange': handleChange,
          'onAdd': (evt: any) => {
            console.log('[DesignerCanvas] onAdd event:', evt)
          },
          'group': props.canvasGroup,
          'itemKey': 'id',
          'animation': 200,
          'class': localWidgets.value.length === 0 ? 'dragcraft-canvas--empty' : '',
        }, {
          item: ({ element }: { element: WidgetSchema }) =>
            h(WidgetWrapper, {
              widget: element,
              components: props.components,
              active: element.id === props.activeId,
              onSelect: (id: string) => emit('select', id),
            }),
          footer: localWidgets.value.length === 0
            ? () => h('div', { class: 'dragcraft-canvas__empty-hint' }, 'Drag components here')
            : undefined,
        }),
      ])
    }
  },
})
