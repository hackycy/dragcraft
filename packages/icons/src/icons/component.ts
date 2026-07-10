import type { IconProps } from '../types'
import { h } from 'vue'

export function IconComponent(props: IconProps = {}) {
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
    h('rect', { x: 4.25, y: 4.25, width: 7.5, height: 7.5, rx: 1.25 }),
    h('path', { d: 'M2.25 5.5V3.25a1 1 0 0 1 1-1H5.5M10.5 2.25h2.25a1 1 0 0 1 1 1V5.5M13.75 10.5v2.25a1 1 0 0 1-1 1H10.5M5.5 13.75H3.25a1 1 0 0 1-1-1V10.5' }),
  ])
}
