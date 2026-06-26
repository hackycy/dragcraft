import type { IconProps } from '../types'
import { h } from 'vue'

export function IconRedo(props: IconProps = {}) {
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
    h('path', { d: 'M13 7H6a3 3 0 0 0 0 6h1M13 7l-3-3M13 7l-3 3' }),
  ])
}
