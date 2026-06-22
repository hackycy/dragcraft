import type { PropType } from 'vue'
import type { DesignerContext, DesignerInstance } from '../types'
import { I18N_KEY } from '@dragcraft/utils'
import { defineComponent, h, provide, ref } from 'vue'
import { useDragDrop } from '../composables/useDragDrop'
import { DESIGNER_CONTEXT_KEY } from '../types'
import DcCanvas from './DcCanvas'
import DcMaterialPanel from './DcMaterialPanel'
import DcPropertyPanel from './DcPropertyPanel'

export default defineComponent({
  name: 'DcDesigner',

  props: {
    instance: {
      type: Object as PropType<DesignerInstance>,
      required: true,
    },
  },

  setup(props) {
    const { engine, componentMap, widgetGroups, extensions, fieldComponentMap, globalConfigSchema, eventHooks, actionRegistry, i18n } = props.instance
    const searchQuery = ref('')
    const activeTab = ref<'global' | 'widget'>('widget')

    // Initialize drag-drop composable
    const dragDrop = useDragDrop(engine)

    // Build and provide context
    const ctx: DesignerContext = {
      engine,
      componentMap,
      widgetGroups,
      extensions,
      fieldComponentMap,
      globalConfigSchema,
      eventHooks,
      actionRegistry,
      dragOverNodeId: dragDrop.dragOverNodeId,
      dragOverIndex: dragDrop.dragOverIndex,
      handleCanvasDragOver: dragDrop.handleCanvasDragOver,
      handleCanvasDragLeave: dragDrop.handleCanvasDragLeave,
      handleCanvasDrop: dragDrop.handleCanvasDrop,
      searchQuery,
      activeTab,
    }
    provide(DESIGNER_CONTEXT_KEY, ctx)
    provide(I18N_KEY, i18n)

    return () => {
      // Resolve panel components (support extension overrides)
      const MaterialPanel = extensions.materialPanelRenderer ?? DcMaterialPanel
      const PropertyPanel = extensions.propertyPanelRenderer ?? DcPropertyPanel

      return h(
        'div',
        { class: 'dc-designer' },
        [
          // Three-column body
          h('div', { class: 'dc-designer__body' }, [
            // Left: Material Panel
            h('div', { class: 'dc-designer__panel dc-designer__panel--left' }, [
              h(MaterialPanel),
            ]),
            // Center: Canvas
            h('div', { class: 'dc-designer__panel dc-designer__panel--center' }, [
              h(DcCanvas),
            ]),
            // Right: Property Panel
            h('div', { class: 'dc-designer__panel dc-designer__panel--right' }, [
              h(PropertyPanel),
            ]),
          ]),
        ],
      )
    }
  },
})
