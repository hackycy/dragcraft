import type { Component, PropType, VNodeChild } from 'vue'
import type { CanvasInteractionMode } from '../composables/useCanvasPan'
import { useI18n } from '@dragcraft/i18n'
import { IconCenter, IconHand, IconPointer, IconRedo, IconUndo } from '@dragcraft/icons'
import { defineComponent, h } from 'vue'
import { useDesignerContext } from '../context'

interface ControlButton {
  readonly key: 'undo' | 'redo' | 'pointer' | 'hand' | 'center'
  readonly label: string
  readonly icon: Component
  readonly disabled?: boolean
  readonly active?: boolean
  readonly onClick: () => void
}

export default defineComponent({
  name: 'DcCanvasControls',
  props: { interactionMode: { type: String as PropType<CanvasInteractionMode>, required: true } },
  emits: {
    modeChange: (_mode: CanvasInteractionMode) => true,
    resetView: () => true,
  },
  setup(props, { emit }) {
    const { t } = useI18n()
    const { designer, executeWorkbenchAction } = useDesignerContext()
    const renderButton = (button: ControlButton): VNodeChild => h('button', {
      'type': 'button',
      'class': 'dc-canvas-controls__button',
      'data-dc-part': 'button',
      'data-dc-workspace-control': button.key,
      'disabled': button.disabled,
      'title': button.label,
      'aria-label': button.label,
      'aria-pressed': button.active,
      'onClick': button.onClick,
    }, [h(button.icon, { size: 17 })])
    return () => h('div', { 'class': 'dc-canvas-controls', 'data-dc-component': 'canvas-controls' }, [
      h('div', { 'class': 'dc-canvas-controls__history', 'data-dc-part': 'toolbar', 'role': 'toolbar' }, [
        renderButton({
          key: 'undo',
          label: t('workspace.history.undo', '撤销'),
          icon: IconUndo,
          disabled: !designer.history.canUndo.value,
          onClick: () => executeWorkbenchAction({ type: 'undo' }),
        }),
        renderButton({
          key: 'redo',
          label: t('workspace.history.redo', '重做'),
          icon: IconRedo,
          disabled: !designer.history.canRedo.value,
          onClick: () => executeWorkbenchAction({ type: 'redo' }),
        }),
        h('span', { 'class': 'dc-canvas-controls__divider', 'data-dc-part': 'divider', 'aria-hidden': 'true' }),
        renderButton({
          key: 'pointer',
          label: t('workspace.canvas.pointer', '指针模式'),
          icon: IconPointer,
          active: props.interactionMode === 'pointer',
          onClick: () => emit('modeChange', 'pointer'),
        }),
        renderButton({
          key: 'hand',
          label: t('workspace.canvas.hand', '抓手模式（按住空格）'),
          icon: IconHand,
          active: props.interactionMode === 'hand',
          onClick: () => emit('modeChange', 'hand'),
        }),
        h('span', { 'class': 'dc-canvas-controls__divider', 'data-dc-part': 'divider', 'aria-hidden': 'true' }),
        renderButton({
          key: 'center',
          label: t('workspace.canvas.reset', '重置画布位置'),
          icon: IconCenter,
          onClick: () => emit('resetView'),
        }),
      ]),
    ])
  },
})
