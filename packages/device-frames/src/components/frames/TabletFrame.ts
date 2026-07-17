import type { LayoutPlan, StyleValueMap } from '@dragcraft/core'
import type { PropType, VNode } from 'vue'
import type { DeviceFrameSelectionPresentationHost } from '../../types'
import { IconSignal, IconSignalBar } from '@dragcraft/icons'
import { defineComponent, h } from 'vue'
import { renderDeviceFrame, useFrameViewport } from '../frame-viewport'

/**
 * Tablet / iPad frame with minimal chrome and thin bezels.
 * Renders children via the default slot inside the content area.
 */
export default defineComponent({
  name: 'DcTabletFrame',

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
    surfaceStyle: {
      type: Object as PropType<StyleValueMap>,
      default: undefined,
    },
    selectionPresentation: {
      type: Object as PropType<DeviceFrameSelectionPresentationHost>,
      default: undefined,
    },
  },

  setup(props, { slots }) {
    const renderViewport = useFrameViewport(() => ({
      content: slots.default?.() ?? [],
      chromeVNodes: props.chromeVNodes,
      layerVNodes: props.layerVNodes,
      plan: props.layoutPlan,
      surfaceStyle: props.surfaceStyle,
      selectionPresentation: props.selectionPresentation,
    }))

    return () =>
      renderDeviceFrame('dc-device-frame--tablet', props.selectionPresentation, [
        // Status bar (iPad-style)
        h('div', { class: 'dc-device-frame__status-bar' }, [
          h('span', { class: 'dc-device-frame__status-time' }, '9:41'),
          h('span', { class: 'dc-device-frame__status-icons' }, [
            h('span', null, h(IconSignal, { size: 10 })),
            h('span', null, h(IconSignalBar, { size: 10 })),
          ]),
        ]),
        renderViewport(),
      ], props.forbiddenOverlayVNode)
  },
})
