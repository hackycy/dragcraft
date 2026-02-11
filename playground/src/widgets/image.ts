import type { DesignerWidgetDefinition } from '@dragcraft/designer'
import type { FormSchema } from '@dragcraft/form-generator'
import { ImageWidget } from './ImageWidget'

export const ImageDefinition: DesignerWidgetDefinition = {
  type: 'image',
  label: 'Image',
  icon: '🖼️',
  category: 'basic',
  defaultProps: {
    src: 'https://placehold.co/300x200',
    alt: 'Image',
    width: '300',
  },
  formSchema: [
    { key: 'src', label: 'Image URL', type: 'input', defaultValue: 'https://placehold.co/300x200' },
    { key: 'alt', label: 'Alt Text', type: 'input', defaultValue: 'Image' },
    { key: 'width', label: 'Width (px)', type: 'input', defaultValue: '300' },
  ] as FormSchema,
  component: ImageWidget,
}
