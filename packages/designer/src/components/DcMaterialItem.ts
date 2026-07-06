import type { WidgetMeta } from '@dragcraft/core'
import type { PropType } from 'vue'
import { useI18n } from '@dragcraft/utils'
import { defineComponent, h, ref } from 'vue'
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
    const { t } = useI18n()
    const { extensions, handleMaterialDragStart, handleDragEnd: handleDesignerDragEnd } = ctx

    const isDragging = ref(false)

    const handleDragStart = (e: DragEvent) => {
      handleMaterialDragStart(e, props.meta)
      isDragging.value = true
    }

    const handleDragEnd = (e: DragEvent) => {
      isDragging.value = false
      handleDesignerDragEnd(e)
    }

    return () => {
      const meta = props.meta

      // Support custom widget item renderer via extension
      if (extensions.renderWidgetItem) {
        const CustomItem = extensions.renderWidgetItem(meta)
        return h(CustomItem, {
          draggable: true,
          disabled: false,
          onDragstart: handleDragStart,
          onDragend: handleDragEnd,
        })
      }

      return h(
        'div',
        {
          class: [
            'dc-material-item',
            {
              'dc-material-item--dragging': isDragging.value,
            },
          ],
          draggable: true,
          onDragstart: handleDragStart,
          onDragend: handleDragEnd,
        },
        [
          meta.icon
            ? h('span', { class: 'dc-material-item__icon' }, meta.icon)
            : null,
          h('span', { class: 'dc-material-item__title' }, meta.titleKey ? t(meta.titleKey, meta.title) : meta.title),
        ],
      )
    }
  },
})
