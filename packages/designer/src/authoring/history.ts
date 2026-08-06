import type { DocumentDeepReadonly, DocumentSchema } from '@dragcraft/core'
import type { DesignerHistory } from './types'
import { computed, ref } from 'vue'

export interface SnapshotHistory {
  readonly state: Readonly<DesignerHistory>
  commit: (schema: DocumentDeepReadonly<DocumentSchema>) => void
  redo: () => DocumentDeepReadonly<DocumentSchema> | undefined
  reset: (schema: DocumentDeepReadonly<DocumentSchema>) => void
  undo: () => DocumentDeepReadonly<DocumentSchema> | undefined
}

export function createSnapshotHistory(
  initialSchema: DocumentDeepReadonly<DocumentSchema> | undefined,
  maxHistoryEntries: number | undefined = 50,
): SnapshotHistory {
  const timeline: DocumentDeepReadonly<DocumentSchema>[] = initialSchema ? [initialSchema] : []
  const cursor = ref(timeline.length - 1)

  return Object.freeze({
    state: Object.freeze({
      canRedo: computed(() => cursor.value < timeline.length - 1),
      canUndo: computed(() => cursor.value > 0),
      redoCount: computed(() => timeline.length - cursor.value - 1),
      undoCount: computed(() => Math.max(cursor.value, 0)),
    }),
    commit(schema: DocumentDeepReadonly<DocumentSchema>): void {
      if (maxHistoryEntries === 0)
        return
      timeline.splice(cursor.value + 1)
      timeline.push(schema)
      if (timeline.length > maxHistoryEntries + 1)
        timeline.splice(0, timeline.length - maxHistoryEntries - 1)
      cursor.value = timeline.length - 1
    },
    redo(): DocumentDeepReadonly<DocumentSchema> | undefined {
      if (cursor.value < 0 || cursor.value >= timeline.length - 1)
        return undefined
      cursor.value += 1
      return timeline[cursor.value]
    },
    reset(schema: DocumentDeepReadonly<DocumentSchema>): void {
      timeline.splice(0, timeline.length, schema)
      cursor.value = 0
    },
    undo(): DocumentDeepReadonly<DocumentSchema> | undefined {
      if (cursor.value <= 0)
        return undefined
      cursor.value -= 1
      return timeline[cursor.value]
    },
  })
}
