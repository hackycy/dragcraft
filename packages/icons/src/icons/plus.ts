import type { IconProps } from '../types'
import { h } from 'vue'

export function IconPlus(props: IconProps = {}) {
  const { size = 16, color = 'currentColor', class: cls } = props
  return h('svg', {
    'width': size,
    'height': size,
    'viewBox': '0 0 16 16',
    'fill': 'none',
    'stroke': color,
    'stroke-width': 1.5,
    'stroke-linecap': 'round',
    'class': cls,
  }, [
    h('line', { x1: 8, y1: 3, x2: 8, y2: 13 }),
    h('line', { x1: 3, y1: 8, x2: 13, y2: 8 }),
  ])
}
