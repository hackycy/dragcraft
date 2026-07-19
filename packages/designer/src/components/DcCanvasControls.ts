import type { Component, PropType, VNodeChild } from 'vue'
import type { CanvasInteractionMode } from '../composables/useCanvasPan'
import { useI18n } from '@dragcraft/i18n'
import { IconCenter, IconHand, IconPointer, IconRedo, IconUndo } from '@dragcraft/icons'
import { defineComponent, h } from 'vue'
import { useDesignerContext } from '../context'

interface ControlButtonOptions {
  key: 'undo' | 'redo' | 'pointer' | 'hand' | 'center'
  label: string
  icon: Component
  disabled?: boolean
  active?: boolean
  onClick: () => void
}

export default defineComponent({
  name: 'DcCanvasControls',

  props: {
    interactionMode: {
      type: String as PropType<CanvasInteractionMode>,
      required: true,
    },
  },

  emits: {
    modeChange: (_mode: CanvasInteractionMode) => true,
    resetView: () => true,
  },

  setup(props, { emit }) {
    const { t } = useI18n()
    const { engine } = useDesignerContext()

    const renderHistoryButton = (options: ControlButtonOptions): VNodeChild => h('button', {
      'type': 'button',
      'class': 'dc-canvas-controls__button',
      'data-dc-part': 'button',
      'disabled': options.disabled,
      'title': options.label,
      'aria-label': options.label,
      'aria-pressed': options.active,
      'data-dc-workspace-control': options.key,
      'onClick': options.onClick,
    }, [h(options.icon, { size: 17 })])

    return () => {
      const history = engine.history.state.value
      return h('div', { 'class': 'dc-canvas-controls', 'data-dc-component': 'canvas-controls' }, [
        h('div', {
          'class': 'dc-canvas-controls__history',
          'data-dc-part': 'toolbar',
          'role': 'toolbar',
          'aria-label': t('workspace.canvas.controls', '画布工具'),
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
          h('span', { 'class': 'dc-canvas-controls__divider', 'data-dc-part': 'divider', 'aria-hidden': 'true' }),
          renderHistoryButton({
            key: 'pointer',
            label: t('workspace.canvas.pointer', '指针模式'),
            icon: IconPointer,
            active: props.interactionMode === 'pointer',
            onClick: () => emit('modeChange', 'pointer'),
          }),
          renderHistoryButton({
            key: 'hand',
            label: t('workspace.canvas.hand', '抓手模式（按住空格）'),
            icon: IconHand,
            active: props.interactionMode === 'hand',
            onClick: () => emit('modeChange', 'hand'),
          }),
          h('span', { 'class': 'dc-canvas-controls__divider', 'data-dc-part': 'divider', 'aria-hidden': 'true' }),
          renderHistoryButton({
            key: 'center',
            label: t('workspace.canvas.reset', '重置画布位置'),
            icon: IconCenter,
            onClick: () => emit('resetView'),
          }),
        ]),
      ])
    }
  },
})
