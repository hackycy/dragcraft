import type { FieldComponentMap } from '@dragcraft/form-generator'
import type { InjectionKey, PropType } from 'vue'
import type { UseDesignerReturn } from '../composables/useDesigner'
import type { DesignerOptions, DesignerWidgetDefinition } from '../types'
import { defineComponent, h, provide } from 'vue'
import { useDesigner } from '../composables/useDesigner'
import { DesignerCanvas } from './DesignerCanvas'
import { MaterialPanel } from './MaterialPanel'
import { PropertyPanel } from './PropertyPanel'
import { Toolbar } from './Toolbar'

export const DESIGNER_INJECTION_KEY = Symbol('dragcraft-designer') as InjectionKey<UseDesignerReturn>

export const Designer = defineComponent({
  name: 'Designer',
  props: {
    options: { type: Object as PropType<DesignerOptions>, default: () => ({}) },
    fieldComponents: {
      type: Object as PropType<FieldComponentMap>,
      required: true,
    },
  },
  setup(props, { slots }) {
    const designer = useDesigner(props.options)
    provide(DESIGNER_INJECTION_KEY, designer)

    return () => {
      return h('div', { class: 'dragcraft-designer' }, [
        // Toolbar
        h(Toolbar, {
          canUndo: designer.canUndo.value,
          canRedo: designer.canRedo.value,
          hasSelection: designer.activeWidget.value !== null,
          onUndo: designer.undo,
          onRedo: designer.redo,
          onDelete: designer.removeActiveWidget,
        }, {
          default: slots.toolbar ? () => slots.toolbar!() : undefined,
        }),

        // Main 3-column layout
        h('div', { class: 'dragcraft-designer__body' }, [
          // Left: Material Panel
          h(MaterialPanel, {
            registry: designer.registry,
            group: designer.dragDrop.materialGroup,
            onAdd: (def: DesignerWidgetDefinition) => {
              designer.dragDrop.handleMaterialDrop(def)
            },
          }),

          // Center: Canvas
          h(DesignerCanvas, {
            'widgets': designer.sortedWidgets.value,
            'components': designer.componentMap.value,
            'activeId': designer.activeId.value,
            'canvasGroup': designer.dragDrop.canvasGroup,
            'onSelect': (id: string | null) => {
              if (id) {
                designer.selectWidget(id)
              }
              else {
                designer.clearSelection()
              }
            },
            'onReorder': designer.dragDrop.handleReorder,
            'onAddWidget': (def: DesignerWidgetDefinition) => {
              console.log('[Designer] onAddWidget event received:', def)
              designer.dragDrop.handleMaterialDrop(def)
            },
          }),

          // Right: Property Panel
          h(PropertyPanel, {
            'widget': designer.activeWidget.value,
            'definition': designer.activeDefinition.value,
            'formSchema': designer.activeFormSchema.value,
            'fieldComponents': props.fieldComponents,
            'onUpdate-props': designer.updateActiveWidgetProps,
          }),
        ]),
      ])
    }
  },
})
