import type { Engine, WidgetDefinition } from '@dragcraft/core'
import type { FormSchema } from '@dragcraft/form-generator'
import type { WidgetComponentMap } from '@dragcraft/renderer'
import type { Component } from 'vue'

// Extended widget definition used by the designer
export interface DesignerWidgetDefinition extends WidgetDefinition {
  icon?: string
  category?: string
  defaultProps?: Record<string, any>
  formSchema?: FormSchema
  component: Component
}

// Configuration for creating a designer instance
export interface DesignerOptions {
  engine?: Engine
  widgets?: DesignerWidgetDefinition[]
}

// Widget registry interface
export interface WidgetRegistry {
  register: (definition: DesignerWidgetDefinition) => void
  unregister: (type: string) => void
  get: (type: string) => DesignerWidgetDefinition | undefined
  getAll: () => DesignerWidgetDefinition[]
  getComponentMap: () => WidgetComponentMap
  getCategories: () => string[]
  getByCategory: (category: string) => DesignerWidgetDefinition[]
}
