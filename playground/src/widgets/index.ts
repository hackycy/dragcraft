import type { DesignerWidgetDefinition } from '@dragcraft/designer'
import { ImageDefinition } from './image'
import { InputDefinition } from './input'

export const widgetDefinitions: DesignerWidgetDefinition[] = [
  InputDefinition,
  ImageDefinition,
]
