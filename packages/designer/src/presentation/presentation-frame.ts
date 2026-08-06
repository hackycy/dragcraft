import type { Component, PropType } from 'vue'
import { defineComponent, h, inject, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { PRESENTATION_DIAGNOSTIC_REGISTRY_KEY } from './presentation-diagnostics'

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
    const diagnostics = inject(PRESENTATION_DIAGNOSTIC_REGISTRY_KEY)
    const recoveryCode = ref<'FRAME_SLOT_DUPLICATE' | 'FRAME_SLOT_MISSING' | null>(null)
    let unregisterDiagnostic: (() => void) | undefined
    const stopWatchingRecovery = watch(recoveryCode, (code) => {
      unregisterDiagnostic?.()
      unregisterDiagnostic = code
        ? diagnostics?.register({ code, nodeId: props.nodeId })
        : undefined
    }, { flush: 'post' })
    onBeforeUnmount(() => {
      stopWatchingRecovery()
      unregisterDiagnostic?.()
    })
    let renderVersion = 0

    return () => {
      if (recoveryCode.value) {
        return h('div', {
          'key': 'recovery',
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
      return h(props.frame, { key: 'frame' }, {
        default: () => {
          slotCalls += 1
          return slots.default?.()
        },
      })
    }
  },
})
