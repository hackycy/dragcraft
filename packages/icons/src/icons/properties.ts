import type { IconProps } from '../types'
import { h } from 'vue'

export function IconProperties(props: IconProps = {}) {
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
    h('path', { d: 'M3 3.5h4M10 3.5h3M3 8h1.5M7.5 8H13M3 12.5h5M11 12.5h2' }),
    h('circle', { cx: 8.5, cy: 3.5, r: 1.5 }),
    h('circle', { cx: 6, cy: 8, r: 1.5 }),
    h('circle', { cx: 9.5, cy: 12.5, r: 1.5 }),
  ])
}
