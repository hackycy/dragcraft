import type { Component, InjectionKey, Ref } from 'vue'
import type { PresentationOwner } from './node-host'
import { defineComponent, h, inject, onBeforeUnmount, Teleport } from 'vue'
import { PRESENTATION_DIAGNOSTIC_REGISTRY_KEY } from './presentation-diagnostics'

export const VIEWPORT_PLANE_TARGET_KEY: InjectionKey<Readonly<Ref<HTMLElement | null>>>
  = Symbol('dc-viewport-plane-target')

export const VIEWPORT_PORTAL_OWNER_KEY: InjectionKey<PresentationOwner>
  = Symbol('dc-viewport-portal-owner')

export default defineComponent({
  name: 'DcDesignerViewportPortal',
  setup(_, { slots }) {
    const owner = inject(VIEWPORT_PORTAL_OWNER_KEY)
    const target = inject(VIEWPORT_PLANE_TARGET_KEY)
    const diagnostics = inject(PRESENTATION_DIAGNOSTIC_REGISTRY_KEY)
    if (!owner || !target)
      throw new Error('DesignerViewportPortal must be rendered inside ApplicationSurface')
    const unregisterDiagnostic = owner.kind === 'container-region'
      ? diagnostics?.register({ code: 'VIEWPORT_PORTAL_REGION_CHILD' })
      : undefined
    onBeforeUnmount(() => unregisterDiagnostic?.())

    return () => {
      if (owner.kind === 'container-region') {
        return h('div', {
          'data-dc-presentation-diagnostic': 'VIEWPORT_PORTAL_REGION_CHILD',
        }, slots.default?.())
      }
      return target.value
        ? h(Teleport as unknown as Component, { to: target.value }, slots.default?.())
        : slots.default?.()
    }
  },
})
