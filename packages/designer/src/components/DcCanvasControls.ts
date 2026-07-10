import type { Component, VNodeChild } from 'vue'
import type { ToolbarSlotAPI } from '../types'
import { IconRedo, IconUndo } from '@dragcraft/icons'
import { useI18n } from '@dragcraft/utils'
import { defineComponent, h } from 'vue'
import { useDesignerContext } from '../context'

interface HistoryButtonOptions {
  key: 'undo' | 'redo'
  label: string
  icon: Component
  disabled: boolean
  onClick: () => void
}

export default defineComponent({
  name: 'DcCanvasControls',

  setup() {
    const { t } = useI18n()
    const { engine, extensions, workspace } = useDesignerContext()

    const api: ToolbarSlotAPI = {
      undo: () => engine.history.undo(),
      redo: () => engine.history.redo(),
      canUndo: () => engine.history.canUndo(),
      canRedo: () => engine.history.canRedo(),
      execute: engine.execute,
      engine,
      workspace,
      t,
    }

    const renderHistoryButton = (options: HistoryButtonOptions): VNodeChild => h('button', {
      'type': 'button',
      'class': 'dc-canvas-controls__button',
      'disabled': options.disabled,
      'title': options.label,
      'aria-label': options.label,
      'data-dc-workspace-control': options.key,
      'onClick': options.onClick,
    }, [h(options.icon, { size: 17 })])

    return () => {
      const history = engine.history.state.value
      const extensionContent = extensions.toolbarRenderer?.(api)

      return h('div', { class: 'dc-canvas-controls' }, [
        h('div', {
          'class': 'dc-canvas-controls__history',
          'role': 'toolbar',
          'aria-label': t('workspace.history.label', '历史操作'),
        }, [
          renderHistoryButton({
            key: 'undo',
            label: t('workspace.history.undo', '撤销'),
            icon: IconUndo,
            disabled: !history.canUndo,
            onClick: () => engine.history.undo(),
          }),
          renderHistoryButton({
            key: 'redo',
            label: t('workspace.history.redo', '重做'),
            icon: IconRedo,
            disabled: !history.canRedo,
            onClick: () => engine.history.redo(),
          }),
        ]),
        extensionContent
          ? h('div', { class: 'dc-canvas-controls__extension' }, [extensionContent])
          : null,
      ])
    }
  },
})
