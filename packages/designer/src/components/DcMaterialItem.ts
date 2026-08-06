import type { PropType } from 'vue'
import type { MaterialDefinition } from '../materials/types'
import { useI18n } from '@dragcraft/i18n'
import { defineComponent, h, ref } from 'vue'
import { useDesignerContext } from '../context'
import { resolveMaterialItem } from '../material'

export default defineComponent({
  name: 'DcMaterialItem',
  props: { material: { type: Object as PropType<MaterialDefinition>, required: true } },
  setup(props) {
    const context = useDesignerContext()
    const { t } = useI18n()
    const dragging = ref(false)
    return () => {
      const display = resolveMaterialItem(props.material, t)
      const custom = context.extensions.materialItemRenderer?.({
        material: props.material,
        draggable: true,
        dragging: dragging.value,
      })
      return h('div', {
        'class': ['dc-material-item', { 'dc-material-item--dragging': dragging.value, 'dc-material-item--custom': !!custom }],
        'data-dc-component': 'material-item',
        'data-dc-state': dragging.value ? 'dragging' : undefined,
        'draggable': true,
        'title': display.description ? `${display.title}: ${display.description}` : display.title,
        'onDragstart': (event: DragEvent) => {
          dragging.value = true
          context.drag.handleMaterialDragStart(event, props.material.type)
        },
        'onDragend': () => {
          dragging.value = false
          context.drag.handleDragEnd()
        },
      }, custom ?? [
        display.thumbnail
          ? h('img', {
              'class': 'dc-material-item__thumbnail',
              'data-dc-part': 'thumbnail',
              'src': display.thumbnail,
              'alt': display.title,
            })
          : display.icon
            ? h('span', { 'class': 'dc-material-item__icon', 'data-dc-part': 'icon' }, [
                typeof display.icon === 'string' ? display.icon : h(display.icon, { size: 20 }),
              ])
            : null,
        h('span', { 'class': 'dc-material-item__content', 'data-dc-part': 'content' }, [
          h('span', { 'class': 'dc-material-item__title', 'data-dc-part': 'title' }, display.title),
        ]),
      ])
    }
  },
})
