import type { TypeBehaviorContext, WidgetMeta } from '@dragcraft/core'
import type { PropType } from 'vue'
import { useI18n } from '@dragcraft/utils'
import { computed, defineComponent, h, ref } from 'vue'
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
    const { engine, extensions, createDragPreview } = ctx

    const isDragging = ref(false)

    const isCreatable = computed(() => {
      const field = props.meta.creatable
      if (typeof field !== 'function')
        return field !== false
      // Dynamic: establish schema reactivity so this re-evaluates on schema changes
      void engine.store.schema.value
      const behaviorCtx: TypeBehaviorContext = {
        widgetType: props.meta.type,
        schema: engine.store.getRawSchema(),
      }
      return field(behaviorCtx)
    })

    const handleDragStart = (e: DragEvent) => {
      if (!isCreatable.value) {
        e.preventDefault()
        return
      }
      engine.store.setDragTarget({
        sourceNodeId: null,
        widgetType: props.meta.type,
      })
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'copy'
        e.dataTransfer.setData('text/plain', props.meta.type)
        // Hide browser's default drag ghost (replaced by floating preview)
        const canvas = document.createElement('canvas')
        canvas.width = 1
        canvas.height = 1
        e.dataTransfer.setDragImage(canvas, 0, 0)
      }
      createDragPreview(props.meta, false)
      isDragging.value = true
    }

    const handleDragEnd = () => {
      isDragging.value = false
      engine.store.setDragTarget(null)
    }

    return () => {
      const meta = props.meta
      const creatable = isCreatable.value

      // Support custom widget item renderer via extension
      if (extensions.renderWidgetItem) {
        const CustomItem = extensions.renderWidgetItem(meta)
        return h(CustomItem, {
          draggable: creatable,
          disabled: !creatable,
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
              'dc-material-item--disabled': !creatable,
              'dc-material-item--dragging': isDragging.value,
            },
          ],
          draggable: creatable,
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
