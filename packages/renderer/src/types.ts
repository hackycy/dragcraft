import type { WidgetSchema } from '@dragcraft/core'
import type { Component } from 'vue'

// Maps widget type string to a Vue component
export type WidgetComponentMap = Record<string, Component>

// Props that the renderer passes to each rendered widget component
export interface RenderedWidgetProps {
  widget: WidgetSchema
  [key: string]: any
}
