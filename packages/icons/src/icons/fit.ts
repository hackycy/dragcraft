import type { IconProps } from '../types'
import { h } from 'vue'

export function IconFit(props: IconProps = {}) {
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
    h('path', { d: 'M6 2.5H3.5a1 1 0 0 0-1 1V6M10 2.5h2.5a1 1 0 0 1 1 1V6M13.5 10v2.5a1 1 0 0 1-1 1H10M6 13.5H3.5a1 1 0 0 1-1-1V10' }),
    h('path', { d: 'm5.25 5.25 1.5 1.5M10.75 5.25l-1.5 1.5M5.25 10.75l1.5-1.5M10.75 10.75l-1.5-1.5' }),
  ])
}
