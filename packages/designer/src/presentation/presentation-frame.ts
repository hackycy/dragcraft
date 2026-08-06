import type { Component, PropType } from 'vue'
import { defineComponent, h, nextTick, ref } from 'vue'

export default defineComponent({
  name: 'DcPresentationFrame',
  props: {
    frame: {
      type: Object as PropType<Component>,
      required: true,
    },
    nodeId: { type: String, required: true },
  },
  setup(props, { slots }) {
    const recoveryCode = ref<'FRAME_SLOT_DUPLICATE' | 'FRAME_SLOT_MISSING' | null>(null)
    let renderVersion = 0

    return () => {
      if (recoveryCode.value) {
        return h('div', {
          'data-dc-frame-recovery': props.nodeId,
          'data-dc-presentation-diagnostic': recoveryCode.value,
        }, slots.default?.())
      }

      let slotCalls = 0
      const version = ++renderVersion
      void nextTick(() => {
        if (version !== renderVersion || slotCalls === 1)
          return
        recoveryCode.value = slotCalls === 0
          ? 'FRAME_SLOT_MISSING'
          : 'FRAME_SLOT_DUPLICATE'
      })
      return h(props.frame, null, {
        default: () => {
          slotCalls += 1
          return slots.default?.()
        },
      })
    }
  },
})
