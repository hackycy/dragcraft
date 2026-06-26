import type { IconProps } from '../types'
import { h } from 'vue'

export function IconDesktop(props: IconProps = {}) {
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
    h('rect', { x: 1, y: 2, width: 14, height: 9, rx: 1 }),
    h('line', { x1: 5, y1: 14, x2: 11, y2: 14 }),
    h('line', { x1: 8, y1: 11, x2: 8, y2: 14 }),
  ])
}
