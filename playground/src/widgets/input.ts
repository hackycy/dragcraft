import type { DesignerWidgetDefinition } from '@dragcraft/designer'
import type { FormSchema } from '@dragcraft/form-generator'
import { InputWidget } from './InputWidget'

export const InputDefinition: DesignerWidgetDefinition = {
  type: 'input',
  label: 'Input',
  icon: '📝',
  category: 'basic',
  defaultProps: {
    label: 'Label',
    placeholder: 'Enter text...',
    value: '',
    disabled: false,
  },
  formSchema: [
    { key: 'label', label: 'Label', type: 'input', defaultValue: 'Label' },
    { key: 'placeholder', label: 'Placeholder', type: 'input', defaultValue: 'Enter text...' },
    { key: 'value', label: 'Value', type: 'input', defaultValue: '' },
    { key: 'disabled', label: 'Disabled', type: 'switch', defaultValue: false },
  ] as FormSchema,
  component: InputWidget,
}
