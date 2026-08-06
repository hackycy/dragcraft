import type { InjectionKey, Ref } from 'vue'
import type { PresentationOwner } from './node-host'
import { defineComponent, h, inject, Teleport } from 'vue'

export const VIEWPORT_PLANE_TARGET_KEY: InjectionKey<Readonly<Ref<HTMLElement | null>>>
  = Symbol('dc-viewport-plane-target')

export const VIEWPORT_PORTAL_OWNER_KEY: InjectionKey<PresentationOwner>
  = Symbol('dc-viewport-portal-owner')

export default defineComponent({
  name: 'DcDesignerViewportPortal',
  setup(_, { slots }) {
    const owner = inject(VIEWPORT_PORTAL_OWNER_KEY)
    const target = inject(VIEWPORT_PLANE_TARGET_KEY)
    if (!owner || !target)
      throw new Error('DesignerViewportPortal must be rendered inside ApplicationSurface')

    return () => {
      if (owner.kind === 'container-region') {
        return h('div', {
          'data-dc-presentation-diagnostic': 'VIEWPORT_PORTAL_REGION_CHILD',
        }, slots.default?.())
      }
      return target.value
        ? h(Teleport, { to: target.value }, slots.default?.())
        : slots.default?.()
    }
  },
})
