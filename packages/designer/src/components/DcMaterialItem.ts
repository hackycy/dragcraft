import type { WidgetMeta } from '@dragcraft/core'
import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'
import { useDesignerContext } from '../context'

export default defineComponent({
  name: 'DcMaterialItem',

  props: {
    meta: {
      type: Object as PropType<WidgetMeta>,
      required: true,
    },
  },

  setup(props) {
    const ctx = useDesignerContext()
    const { engine, extensions } = ctx

    const handleDragStart = (e: DragEvent) => {
      engine.store.setDragTarget({
        sourceNodeId: null,
        widgetType: props.meta.type,
      })
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'copy'
        e.dataTransfer.setData('text/plain', props.meta.type)
      }
    }

    const handleDragEnd = () => {
      engine.store.setDragTarget(null)
    }

    return () => {
      const meta = props.meta

      // Support custom widget item renderer via extension
      if (extensions.renderWidgetItem) {
        const CustomItem = extensions.renderWidgetItem(meta)
        return h(CustomItem, {
          draggable: true,
          onDragstart: handleDragStart,
          onDragend: handleDragEnd,
        })
      }

      return h(
        'div',
        {
          class: 'dc-material-item',
          draggable: true,
          onDragstart: handleDragStart,
          onDragend: handleDragEnd,
        },
        [
          meta.icon
            ? h('span', { class: 'dc-material-item__icon' }, meta.icon)
            : null,
          h('span', { class: 'dc-material-item__title' }, meta.title),
        ],
      )
    }
  },
})
