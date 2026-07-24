import type { Component, PropType, VNodeChild } from 'vue'
import type { CanvasInteractionMode } from '../composables/useCanvasView'
import { useI18n } from '@dragcraft/i18n'
import { IconCenter, IconFit, IconHand, IconMinus, IconPlus, IconPointer, IconRedo, IconUndo } from '@dragcraft/icons'
import { defineComponent, h } from 'vue'
import { useDesignerContext } from '../context'

interface ControlButtonOptions {
  key: 'undo' | 'redo' | 'pointer' | 'hand' | 'zoom-out' | 'zoom-in' | 'fit' | 'center'
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
    showZoomControls: {
      type: Boolean,
      default: false,
    },
    viewScale: {
      type: Number,
      default: 1,
    },
    canZoomIn: {
      type: Boolean,
      default: false,
    },
    canZoomOut: {
      type: Boolean,
      default: false,
    },
  },

  emits: {
    modeChange: (_mode: CanvasInteractionMode) => true,
    zoomIn: () => true,
    zoomOut: () => true,
    fitView: () => true,
    resetView: () => true,
  },

  setup(props, { emit }) {
    const { t } = useI18n()
    const { engine } = useDesignerContext()

    const renderControlButton = (options: ControlButtonOptions): VNodeChild => h('button', {
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
      const zoomText = `${Math.round(props.viewScale * 100)}%`
      const zoomLabel = t('workspace.canvas.zoom', '当前缩放')
      const viewControls: VNodeChild[] = props.showZoomControls
        ? [
            h('span', { 'class': 'dc-canvas-controls__divider', 'data-dc-part': 'divider', 'aria-hidden': 'true' }),
            renderControlButton({
              key: 'zoom-out',
              label: t('workspace.canvas.zoom-out', '缩小'),
              icon: IconMinus,
              disabled: !props.canZoomOut,
              onClick: () => emit('zoomOut'),
            }),
            h('span', {
              'class': 'dc-canvas-controls__scale',
              'data-dc-part': 'scale',
              'aria-label': `${zoomLabel}: ${zoomText}`,
              'aria-live': 'polite',
            }, zoomText),
            renderControlButton({
              key: 'zoom-in',
              label: t('workspace.canvas.zoom-in', '放大'),
              icon: IconPlus,
              disabled: !props.canZoomIn,
              onClick: () => emit('zoomIn'),
            }),
            h('span', { 'class': 'dc-canvas-controls__divider', 'data-dc-part': 'divider', 'aria-hidden': 'true' }),
            renderControlButton({
              key: 'fit',
              label: t('workspace.canvas.fit', '适配画布'),
              icon: IconFit,
              onClick: () => emit('fitView'),
            }),
            h('span', { 'class': 'dc-canvas-controls__divider', 'data-dc-part': 'divider', 'aria-hidden': 'true' }),
          ]
        : [h('span', { 'class': 'dc-canvas-controls__divider', 'data-dc-part': 'divider', 'aria-hidden': 'true' })]

      return h('div', { 'class': 'dc-canvas-controls', 'data-dc-component': 'canvas-controls' }, [
        h('div', {
          'class': 'dc-canvas-controls__history',
          'data-dc-part': 'toolbar',
          'role': 'toolbar',
          'aria-label': t('workspace.canvas.controls', '画布工具'),
        }, [
          renderControlButton({
            key: 'undo',
            label: t('workspace.history.undo', '撤销'),
            icon: IconUndo,
            disabled: !history.canUndo,
            onClick: () => engine.history.undo(),
          }),
          renderControlButton({
            key: 'redo',
            label: t('workspace.history.redo', '重做'),
            icon: IconRedo,
            disabled: !history.canRedo,
            onClick: () => engine.history.redo(),
          }),
          h('span', { 'class': 'dc-canvas-controls__divider', 'data-dc-part': 'divider', 'aria-hidden': 'true' }),
          renderControlButton({
            key: 'pointer',
            label: t('workspace.canvas.pointer', '指针模式'),
            icon: IconPointer,
            active: props.interactionMode === 'pointer',
            onClick: () => emit('modeChange', 'pointer'),
          }),
          renderControlButton({
            key: 'hand',
            label: t('workspace.canvas.hand', '抓手模式（按住空格）'),
            icon: IconHand,
            active: props.interactionMode === 'hand',
            onClick: () => emit('modeChange', 'hand'),
          }),
          ...viewControls,
          renderControlButton({
            key: 'center',
            label: t('workspace.canvas.center', '居中画布'),
            icon: IconCenter,
            onClick: () => emit('resetView'),
          }),
        ]),
      ])
    }
  },
})
