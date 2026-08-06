import type { StructuralDestination } from '@dragcraft/core'
import type { AuthoringResult } from '../authoring/types'
import type { DesignerDragState } from '../context'
import type { DesignerInstance } from '../session/create-designer'
import { ref } from 'vue'

const DRAG_DATA_TYPE = 'application/x-dragcraft-authoring'

interface DragPayload {
  readonly kind: 'material' | 'node'
  readonly id: string
}

function setDragPayload(event: DragEvent, payload: DragPayload): void {
  event.dataTransfer?.setData(DRAG_DATA_TYPE, JSON.stringify(payload))
  if (event.dataTransfer)
    event.dataTransfer.effectAllowed = 'copyMove'
}

export function useDragDrop(designer: DesignerInstance): DesignerDragState {
  const activeDestination = ref<StructuralDestination | null>(null)
  const draggingMaterialType = ref<string | null>(null)
  const draggingNodeId = ref<string | null>(null)

  function handleMaterialDragStart(event: DragEvent, materialType: string): void {
    draggingMaterialType.value = materialType
    draggingNodeId.value = null
    setDragPayload(event, { kind: 'material', id: materialType })
  }

  function handleNodeDragStart(event: DragEvent, nodeId: string): void {
    draggingNodeId.value = nodeId
    draggingMaterialType.value = null
    setDragPayload(event, { kind: 'node', id: nodeId })
  }

  function handleDragEnd(): void {
    draggingMaterialType.value = null
    draggingNodeId.value = null
    activeDestination.value = null
  }

  function setDestination(destination: StructuralDestination): void {
    activeDestination.value = destination
  }

  function handleDrop(event: DragEvent): AuthoringResult {
    event.preventDefault()
    const destination = activeDestination.value
    const materialType = draggingMaterialType.value
    const nodeId = draggingNodeId.value
    const result = destination && materialType
      ? designer.execute({ type: 'create-node', materialType, to: destination })
      : destination && nodeId
        ? designer.execute({ type: 'move-node', nodeId, to: destination })
        : { status: 'rejected' as const, code: 'NO_DRAG_PAYLOAD' }
    handleDragEnd()
    return result
  }

  return Object.freeze({
    activeDestination,
    draggingMaterialType,
    draggingNodeId,
    handleDragEnd,
    handleDrop,
    handleMaterialDragStart,
    handleNodeDragStart,
    setDestination,
  })
}
