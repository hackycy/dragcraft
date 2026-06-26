import type { IconProps } from '../types'
import { h } from 'vue'

export function IconDrag(props: IconProps = {}) {
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
    h('line', { x1: 3, y1: 4, x2: 13, y2: 4 }),
    h('line', { x1: 3, y1: 8, x2: 13, y2: 8 }),
    h('line', { x1: 3, y1: 12, x2: 13, y2: 12 }),
  ])
}
