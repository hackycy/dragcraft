import type { VNodeChild } from 'vue'
import type { DeviceFrameContext } from '../types'
import { IconRedo, IconUndo } from '@dragcraft/icons'
import { h } from 'vue'

/**
 * Minimal toolbar API subset.
 * Defined inline to avoid a hard dependency on @dragcraft/designer.
 */
interface MinimalToolbarAPI {
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  engine: { exportSchema: () => unknown }
}

/**
 * Creates a toolbarRenderer function that includes device frame
 * switching buttons alongside standard undo/redo controls.
 *
 * Must be called during setup() so the context ref is captured in the closure.
 *
 * @param ctx - The DeviceFrameContext (from createDeviceFrameContext)
 * @param options - Configuration options
 * @param options.includeUndoRedo - Include undo/redo buttons. Defaults to true.
 *
 * @example
 * ```ts
 * const deviceCtx = createDeviceFrameContext()
 * provide(DEVICE_FRAME_CONTEXT_KEY, deviceCtx)
 *
 * const toolbarRenderer = createDeviceToolbarRenderer(deviceCtx)
 *
 * const designer = createDesigner({
 *   extensions: { toolbarRenderer },
 * })
 * ```
 */
export function createDeviceToolbarRenderer(
  ctx: DeviceFrameContext,
  options?: { includeUndoRedo?: boolean },
): (api: MinimalToolbarAPI) => VNodeChild {
  const includeUndoRedo = options?.includeUndoRedo ?? true

  return (api: MinimalToolbarAPI): VNodeChild => {
    const nodes: VNodeChild[] = []

    // Undo / Redo buttons
    if (includeUndoRedo) {
      nodes.push(
        h('button', {
          class: 'dc-toolbar__btn dc-toolbar__btn--icon',
          onClick: () => api.undo(),
          disabled: !api.canUndo(),
          title: 'Undo',
        }, h(IconUndo, { size: 14 })),
        h('button', {
          class: 'dc-toolbar__btn dc-toolbar__btn--icon',
          onClick: () => api.redo(),
          disabled: !api.canRedo(),
          title: 'Redo',
        }, h(IconRedo, { size: 14 })),
      )
    }

    // Spacer
    nodes.push(h('div', { class: 'dc-toolbar__spacer' }))

    // Device picker button group
    nodes.push(
      h('div', { class: 'dc-device-picker' }, ctx.presets.map(preset =>
        h('button', {
          class: {
            'dc-device-picker__btn': true,
            'dc-device-picker__btn--active': ctx.currentDevice.value === preset.type,
          },
          onClick: () => ctx.setDevice(preset.type),
          title: preset.label,
        }, [
          typeof preset.icon === 'string' ? preset.icon : h(preset.icon, { size: 14 }),
          ` ${preset.label}`,
        ]),
      )),
    )

    return nodes
  }
}
