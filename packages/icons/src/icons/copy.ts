import type { IconProps } from '../types'
import { h } from 'vue'

export function IconCopy(props: IconProps = {}) {
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
    h('rect', { x: 5, y: 5, width: 8, height: 8, rx: 1 }),
    h('path', { d: 'M3 11V3a1 1 0 0 1 1-1h8' }),
  ])
}
