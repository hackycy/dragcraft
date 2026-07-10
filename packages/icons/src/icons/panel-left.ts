import type { IconProps } from '../types'
import { h } from 'vue'

export function IconPanelLeft(props: IconProps = {}) {
  const { size = 16, color = 'currentColor', class: cls } = props
  return h('svg', {
    'width': size,
    'height': size,
    'viewBox': '0 0 16 16',
    'fill': 'none',
    'stroke': color,
    'stroke-width': 1.5,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'class': cls,
  }, [
    h('rect', { x: 2, y: 2.5, width: 12, height: 11, rx: 1.5 }),
    h('path', { d: 'M6 2.5v11' }),
  ])
}
