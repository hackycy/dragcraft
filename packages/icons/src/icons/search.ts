import type { IconProps } from '../types'
import { h } from 'vue'

export function IconSearch(props: IconProps = {}) {
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
    h('circle', { cx: 7, cy: 7, r: 4 }),
    h('path', { d: 'm10 10 3 3' }),
  ])
}
