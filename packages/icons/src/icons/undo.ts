import type { IconProps } from '../types'
import { h } from 'vue'

export function IconUndo(props: IconProps = {}) {
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
    h('path', { d: 'M3 7h7a3 3 0 0 1 0 6H9M3 7l3-3M3 7l3 3' }),
  ])
}
