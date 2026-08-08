import type { DeepReadonly, DocumentSchema } from '@dragcraft/core'
import type { DesignerHistory } from './types'
import { computed, ref } from 'vue'

export interface SnapshotHistory {
  readonly state: Readonly<DesignerHistory>
  commit: (schema: DeepReadonly<DocumentSchema>) => void
  redo: () => DeepReadonly<DocumentSchema> | undefined
  reset: (schema: DeepReadonly<DocumentSchema>) => void
  undo: () => DeepReadonly<DocumentSchema> | undefined
}

export function createSnapshotHistory(
  initialSchema: DeepReadonly<DocumentSchema> | undefined,
  maxHistoryEntries: number | undefined = 50,
): SnapshotHistory {
  const timeline: DeepReadonly<DocumentSchema>[] = initialSchema ? [initialSchema] : []
  const cursor = ref(timeline.length - 1)

  return Object.freeze({
    state: Object.freeze({
      canRedo: computed(() => cursor.value < timeline.length - 1),
      canUndo: computed(() => cursor.value > 0),
      redoCount: computed(() => timeline.length - cursor.value - 1),
      undoCount: computed(() => Math.max(cursor.value, 0)),
    }),
    commit(schema: DeepReadonly<DocumentSchema>): void {
      if (maxHistoryEntries === 0)
        return
      timeline.splice(cursor.value + 1)
      timeline.push(schema)
      if (timeline.length > maxHistoryEntries + 1)
        timeline.splice(0, timeline.length - maxHistoryEntries - 1)
      cursor.value = timeline.length - 1
    },
    redo(): DeepReadonly<DocumentSchema> | undefined {
      if (cursor.value < 0 || cursor.value >= timeline.length - 1)
        return undefined
      cursor.value += 1
      return timeline[cursor.value]
    },
    reset(schema: DeepReadonly<DocumentSchema>): void {
      timeline.splice(0, timeline.length, schema)
      cursor.value = 0
    },
    undo(): DeepReadonly<DocumentSchema> | undefined {
      if (cursor.value <= 0)
        return undefined
      cursor.value -= 1
      return timeline[cursor.value]
    },
  })
}
