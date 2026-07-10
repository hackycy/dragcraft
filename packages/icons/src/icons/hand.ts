import type { IconProps } from '../types'
import { h } from 'vue'

export function IconHand(props: IconProps = {}) {
  const { size = 16, color = 'currentColor', class: cls } = props
  return h('svg', {
    'width': size,
    'height': size,
    'viewBox': '0 0 16 16',
    'fill': 'none',
    'stroke': color,
    'stroke-width': 1.4,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'class': cls,
  }, [
    h('path', { d: 'M5.2 7V3.25a1 1 0 0 1 2 0V6M7.2 6V2.75a1 1 0 0 1 2 0V6M9.2 6V3.35a1 1 0 0 1 2 0v3.4M11.2 6.75V5.1a1 1 0 0 1 2 0v4.15c0 2.65-1.8 4.5-4.5 4.5H7.45c-1.25 0-2.25-.45-3.05-1.4L2.55 10.2a1.05 1.05 0 0 1 1.5-1.45L5.2 9.8V7Z' }),
  ])
}
