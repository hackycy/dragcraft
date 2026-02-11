import type { WidgetSchema } from '@dragcraft/core'
import type { FieldComponentMap, FormSchema } from '@dragcraft/form-generator'
import type { PropType } from 'vue'
import type { DesignerWidgetDefinition } from '../types'
import { FormRenderer } from '@dragcraft/form-generator'
import { defineComponent, h } from 'vue'

export const PropertyPanel = defineComponent({
  name: 'PropertyPanel',
  props: {
    widget: { type: [Object, null] as PropType<WidgetSchema | null>, default: null },
    definition: { type: [Object, null] as PropType<DesignerWidgetDefinition | null>, default: null },
    formSchema: { type: Array as PropType<FormSchema>, default: () => [] },
    fieldComponents: { type: Object as PropType<FieldComponentMap>, required: true },
  },
  emits: ['update-props'],
  setup(props, { emit }) {
    return () => {
      if (!props.widget || !props.definition || props.formSchema.length === 0) {
        return h('div', { class: 'dragcraft-property-panel dragcraft-property-panel--empty' },
          'Select a component to edit its properties')
      }

      return h('div', { class: 'dragcraft-property-panel' }, [
        h('div', { class: 'dragcraft-property-panel__title' },
          `Properties: ${props.definition.label}`),
        h(FormRenderer, {
          schema: props.formSchema,
          modelValue: props.widget.props,
          components: props.fieldComponents,
          'onUpdate:modelValue': (newProps: Record<string, any>) => {
            emit('update-props', newProps)
          },
        }),
      ])
    }
  },
})
