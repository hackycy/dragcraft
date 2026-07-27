import type { VNode } from 'vue'
import { h } from 'vue'

interface IconProps {
  size?: number | string
  color?: string
  class?: string
}

function icon(props: IconProps, children: VNode | VNode[]) {
  return h('svg', {
    'width': props.size ?? 16,
    'height': props.size ?? 16,
    'viewBox': '0 0 16 16',
    'fill': 'none',
    'stroke': props.color ?? 'currentColor',
    'stroke-width': 1.5,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'class': props.class,
  }, children)
}

export function IconArrowDown(props: IconProps = {}) {
  return icon(props, h('path', { d: 'M8 4v8M4 9l4 4 4-4' }))
}

export function IconArrowUp(props: IconProps = {}) {
  return icon(props, h('path', { d: 'M8 12V4M4 7l4-4 4 4' }))
}

export function IconCopy(props: IconProps = {}) {
  return icon(props, [
    h('rect', { x: 5, y: 5, width: 8, height: 8, rx: 1 }),
    h('path', { d: 'M2 11V3a1 1 0 0 1 1-1h9' }),
  ])
}

export function IconDelete(props: IconProps = {}) {
  return icon(props, h('path', { d: 'M4 4l8 8M12 4l-8 8' }))
}

export function IconMaterial(props: IconProps = {}) {
  return icon(props, [
    h('rect', { x: 2.5, y: 2.5, width: 4, height: 4, rx: 0.8 }),
    h('rect', { x: 9.5, y: 2.5, width: 4, height: 4, rx: 0.8 }),
    h('rect', { x: 2.5, y: 9.5, width: 4, height: 4, rx: 0.8 }),
    h('rect', { x: 9.5, y: 9.5, width: 4, height: 4, rx: 0.8 }),
  ])
}

export function IconNavBack(props: IconProps = {}) {
  return icon(props, h('path', { d: 'M10 3L5 8l5 5' }))
}

export function IconNavHome(props: IconProps = {}) {
  return icon(props, h('circle', { cx: 8, cy: 8, r: 5 }))
}

export function IconNavRecent(props: IconProps = {}) {
  return icon(props, h('rect', { x: 3, y: 3, width: 10, height: 10, rx: 1 }))
}

export function IconPhone(props: IconProps = {}) {
  return icon(props, [
    h('rect', { x: 4, y: 1, width: 8, height: 14, rx: 1.5 }),
    h('line', { x1: 7, y1: 12.5, x2: 9, y2: 12.5 }),
  ])
}

export function IconPlus(props: IconProps = {}) {
  return icon(props, [
    h('line', { x1: 8, y1: 3, x2: 8, y2: 13 }),
    h('line', { x1: 3, y1: 8, x2: 13, y2: 8 }),
  ])
}
