import type { IconProps } from '../types'
import { h } from 'vue'

export function IconPhone(props: IconProps = {}) {
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
    h('rect', { x: 4, y: 1, width: 8, height: 14, rx: 1.5 }),
    h('line', { x1: 7, y1: 12.5, x2: 9, y2: 12.5 }),
  ])
}
