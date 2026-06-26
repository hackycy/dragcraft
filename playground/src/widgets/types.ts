import type { WidgetMeta } from '@dragcraft/core'

/**
 * Extended widget meta with playground-specific behavior fields.
 *
 * `locked` is a convenience concept — set deletable:false, draggable:false,
 * sortable:false on the WidgetMeta to achieve it.
 *
 * `sticky` and `zIndex` are rendering concerns handled by the component itself.
 */
export interface PlaygroundWidgetMeta extends WidgetMeta {
  /** Fix widget to top or bottom of canvas via CSS sticky */
  sticky?: 'top' | 'bottom'
  /** Fixed z-index for overlapping control */
  zIndex?: number
}
