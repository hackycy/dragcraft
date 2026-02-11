import type { Engine } from '@dragcraft/core'
import type { DesignerWidgetDefinition, WidgetRegistry } from '../types'

export interface UseDragDropOptions {
  engine: Engine
  registry: WidgetRegistry
}

export interface UseDragDropReturn {
  handleMaterialDrop: (definition: DesignerWidgetDefinition) => string
  handleReorder: (orderedIds: string[]) => void
  materialGroup: { name: string, pull: string, put: boolean }
  canvasGroup: { name: string, pull: boolean, put: string[] }
}

export function useDragDrop(options: UseDragDropOptions): UseDragDropReturn {
  const { engine } = options

  function handleMaterialDrop(definition: DesignerWidgetDefinition): string {
    console.log('[useDragDrop] handleMaterialDrop called:', definition)
    const id = engine.addWidget(definition.type, {
      ...(definition.defaultProps ?? {}),
      __order: engine.state.widgets.length,
    })
    console.log('[useDragDrop] Widget added with id:', id)
    return id
  }

  function handleReorder(orderedIds: string[]): void {
    for (let i = 0; i < orderedIds.length; i++) {
      const widget = engine.state.widgets.find(w => w.id === orderedIds[i])
      if (widget && widget.props.__order !== i) {
        engine.updateWidget(orderedIds[i], { __order: i })
      }
    }
  }

  return {
    handleMaterialDrop,
    handleReorder,
    materialGroup: { name: 'designer', pull: 'clone', put: false },
    canvasGroup: { name: 'designer', pull: false, put: ['designer'] },
  }
}
