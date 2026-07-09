import type { PropType } from 'vue'
import type { DesignerWidgetMeta, MaterialItemIcon } from '../types'
import { useI18n } from '@dragcraft/utils'
import { defineComponent, h, ref } from 'vue'
import { useDesignerContext } from '../context'
import { resolveMaterialItem } from '../material'

function renderIcon(icon: MaterialItemIcon | undefined) {
  if (!icon)
    return null

  return h('span', { class: 'dc-material-item__icon' }, [
    typeof icon === 'string'
      ? icon
      : h(icon, { size: 20 }),
  ])
}

export default defineComponent({
  name: 'DcMaterialItem',

  props: {
    meta: {
      type: Object as PropType<DesignerWidgetMeta>,
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
      const material = resolveMaterialItem(meta, t)
      const draggable = true
      const disabled = false
      const customContent = extensions.materialItemRenderer?.({
        meta,
        material,
        draggable,
        disabled,
        dragging: isDragging.value,
      })

      const defaultContent = [
        material.thumbnail
          ? h('img', {
              class: 'dc-material-item__thumbnail',
              src: material.thumbnail,
              alt: material.title,
            })
          : renderIcon(material.icon),
        h('span', { class: 'dc-material-item__content' }, [
          h('span', { class: 'dc-material-item__title' }, material.title),
        ]),
      ]

      return h(
        'div',
        {
          'class': [
            'dc-material-item',
            {
              'dc-material-item--custom': !!customContent,
              'dc-material-item--dragging': isDragging.value,
              'dc-material-item--with-description': !!material.description,
            },
          ],
          'draggable': draggable,
          'aria-disabled': disabled,
          'title': material.description ? `${material.title}: ${material.description}` : material.title,
          'onDragstart': handleDragStart,
          'onDragend': handleDragEnd,
        },
        customContent ?? defaultContent,
      )
    }
  },
})
