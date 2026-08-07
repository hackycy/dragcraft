import type { ResolvedDocument, StructuralDestination } from '@dragcraft/core'
import type { ComputedRef, InjectionKey, Ref } from 'vue'
import type { AuthoringResult } from './authoring/types'
import type { DesignerInstance, DesignerInternals } from './session/create-designer'
import { inject } from 'vue'

export interface DesignerDragState {
  readonly activeDestination: Ref<StructuralDestination | null>
  readonly draggingMaterialType: Ref<string | null>
  readonly draggingNodeId: Ref<string | null>
  readonly dropRejectionCode: Ref<string | null>
  readonly handleDragEnd: () => void
  readonly handleDrop: (event: DragEvent) => AuthoringResult
  readonly handleMaterialDragStart: (event: DragEvent, materialType: string) => void
  readonly handleNodeDragStart: (event: DragEvent, nodeId: string) => void
  readonly setDestination: (destination: StructuralDestination) => void
}

export interface DesignerContext extends DesignerInternals {
  readonly designer: DesignerInstance
  readonly drag: DesignerDragState
  readonly resolvedDocument: ComputedRef<ResolvedDocument | null>
  readonly searchQuery: Ref<string>
}

export const DESIGNER_CONTEXT_KEY: InjectionKey<DesignerContext> = Symbol('dc-designer')

export function useDesignerContext(): DesignerContext {
  const context = inject(DESIGNER_CONTEXT_KEY)
  if (!context)
    throw new Error('useDesignerContext must be called inside DcDesigner')
  return context
}
