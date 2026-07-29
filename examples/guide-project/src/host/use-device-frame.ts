import {
  BUILT_IN_DEVICE_FRAMES,
  IPHONE_DEVICE_FRAME,
} from '@dragcraft/device-frames'
import { computed, ref } from 'vue'

export function useDeviceFrame() {
  const activeDeviceFrameId = ref(IPHONE_DEVICE_FRAME.id)
  const activeDeviceFrame = computed(() =>
    BUILT_IN_DEVICE_FRAMES.find(definition => definition.id === activeDeviceFrameId.value)
    ?? IPHONE_DEVICE_FRAME,
  )
  const activeContainerShell = computed(() => activeDeviceFrame.value.containerShell)

  function selectDeviceFrame(id: string) {
    if (BUILT_IN_DEVICE_FRAMES.some(definition => definition.id === id))
      activeDeviceFrameId.value = id
  }

  return {
    activeContainerShell,
    activeDeviceFrameId,
    definitions: BUILT_IN_DEVICE_FRAMES,
    selectDeviceFrame,
  }
}
