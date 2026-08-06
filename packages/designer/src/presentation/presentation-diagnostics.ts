import type { InjectionKey, ShallowRef } from 'vue'
import { shallowRef } from 'vue'

export type PresentationDiagnosticCode
  = | 'FRAME_SLOT_DUPLICATE'
    | 'FRAME_SLOT_MISSING'
    | 'REGION_OUTLET_DUPLICATE'
    | 'REGION_OUTLET_MISSING'
    | 'VIEWPORT_PORTAL_REGION_CHILD'

export interface PresentationDiagnostic {
  readonly code: PresentationDiagnosticCode
  readonly nodeId?: string
  readonly containerId?: string
  readonly regionId?: string
}

export interface PresentationDiagnosticRegistry {
  readonly diagnostics: Readonly<ShallowRef<readonly PresentationDiagnostic[]>>
  readonly register: (diagnostic: PresentationDiagnostic) => () => void
}

export const PRESENTATION_DIAGNOSTIC_REGISTRY_KEY: InjectionKey<PresentationDiagnosticRegistry>
  = Symbol('dc-presentation-diagnostic-registry')

export function createPresentationDiagnosticRegistry(): PresentationDiagnosticRegistry {
  const entries = new Map<symbol, PresentationDiagnostic>()
  const diagnostics = shallowRef<readonly PresentationDiagnostic[]>([])

  function publish(): void {
    diagnostics.value = Object.freeze(Array.from(entries.values()))
  }

  function register(diagnostic: PresentationDiagnostic): () => void {
    const token = Symbol(diagnostic.code)
    entries.set(token, Object.freeze({ ...diagnostic }))
    publish()
    return () => {
      if (!entries.delete(token))
        return
      publish()
    }
  }

  return Object.freeze({ diagnostics, register })
}
