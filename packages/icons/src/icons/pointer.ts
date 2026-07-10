import type { IconProps } from '../types'
import { h } from 'vue'

export function IconPointer(props: IconProps = {}) {
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
    h('path', { d: 'M4 2.25v10.7l2.65-2.55 1.8 3.35 2.05-1.1-1.75-3.2 3.8-.35L4 2.25Z' }),
  ])
}
