import type { DesignerSchema, LayoutPlan, RegistryInstance } from '@dragcraft/core'
import type { PropType } from 'vue'
import { computed, defineComponent, h, inject } from 'vue'
import { getDefaultPresets } from '../presets'
import { DEVICE_FRAME_CONTEXT_KEY } from '../types'

/**
 * Stable container shell component for the renderer's containerShell extension.
 *
 * Reads the current device from DeviceFrameContext (provide/inject) and
 * renders the corresponding frame component. Because this is a single
 * stable component reference, RootRenderer's computed() never swaps
 * components — only the internal render output changes reactively.
 *
 * Falls back to the iPhone frame if no context is provided.
 */
export default defineComponent({
  name: 'DcDeviceFrameShell',

  props: {
    layoutPlan: {
      type: Object as PropType<LayoutPlan>,
      default: undefined,
    },
    schema: {
      type: Object as PropType<DesignerSchema>,
      default: undefined,
    },
    registry: {
      type: Object as PropType<RegistryInstance>,
      default: undefined,
    },
  },

  setup(props, { slots }) {
    const ctx = inject(DEVICE_FRAME_CONTEXT_KEY, null)

    const fallbackFrame = getDefaultPresets()[0].frameComponent

    const activeFrame = computed(() => {
      if (!ctx)
        return fallbackFrame
      const preset = ctx.getPreset(ctx.currentDevice.value)
      return preset?.frameComponent ?? fallbackFrame
    })

    return () =>
      h(activeFrame.value, { layoutPlan: props.layoutPlan, schema: props.schema, registry: props.registry }, slots)
  },
})
