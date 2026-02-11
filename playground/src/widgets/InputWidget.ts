import { defineComponent, h } from 'vue'

export const InputWidget = defineComponent({
  name: 'InputWidget',
  props: {
    label: { type: String, default: 'Label' },
    placeholder: { type: String, default: '' },
    value: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
  },
  setup(props) {
    return () => {
      return h('div', { class: 'widget-input' }, [
        h('label', { class: 'widget-input__label' }, props.label),
        h('input', {
          class: 'widget-input__control',
          type: 'text',
          value: props.value,
          placeholder: props.placeholder,
          disabled: props.disabled,
          readonly: true,
        }),
      ])
    }
  },
})
