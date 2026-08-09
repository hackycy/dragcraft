import type { VNode, VNodeChild } from 'vue'
import { h } from 'vue'

export function renderCanvasViewport(content: VNodeChild[] | undefined): VNode {
  return h('div', { class: 'dc-device-frame__viewport' }, [
    h('div', { class: 'dc-device-frame__canvas' }, content),
  ])
}

export function renderDeviceContainerShell(modifierClass: string, children: VNodeChild[]): VNode {
  return h('div', {
    'class': ['dc-device-frame', modifierClass],
    'data-dc-canvas-fit': 'contain',
  }, [
    h('div', { class: 'dc-device-frame__surface' }, children),
  ])
}
