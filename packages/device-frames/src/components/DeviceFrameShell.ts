import type { DesignerSchema, LayoutPlan, StyleValueMap } from '@dragcraft/core'
import type { Component, PropType, VNode } from 'vue'
import type { DeviceFrameSelectionPresentationHost } from '../types'
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
const DeviceFrameShell = defineComponent({
  name: 'DcDeviceFrameShell',

  props: {
    layoutPlan: {
      type: Object as PropType<LayoutPlan>,
      default: undefined,
    },
    chromeVNodes: {
      type: Array as PropType<VNode[]>,
      default: () => [],
    },
    layerVNodes: {
      type: Object as PropType<Record<string, VNode[]>>,
      default: () => ({}),
    },
    forbiddenOverlayVNode: {
      type: Object as PropType<VNode | null>,
      default: null,
    },
    schema: {
      type: Object as PropType<DesignerSchema>,
      default: undefined,
    },
    selectionPresentation: {
      type: Object as PropType<DeviceFrameSelectionPresentationHost>,
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
      h(activeFrame.value, {
        layoutPlan: props.layoutPlan,
        chromeVNodes: props.chromeVNodes,
        layerVNodes: props.layerVNodes,
        forbiddenOverlayVNode: props.forbiddenOverlayVNode,
        surfaceStyle: props.schema?.root.style?.surface as StyleValueMap | undefined,
        selectionPresentation: props.selectionPresentation,
      }, slots)
  },
})

const DeviceFrameShellWithOverlay = DeviceFrameShell as Component & { __dcHandlesForbiddenOverlay?: boolean }
DeviceFrameShellWithOverlay.__dcHandlesForbiddenOverlay = true

export default DeviceFrameShell
