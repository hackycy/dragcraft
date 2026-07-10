import type { IconProps } from '../types'
import { h } from 'vue'

export function IconGlobalConfig(props: IconProps = {}) {
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
    h('circle', { cx: 8, cy: 8, r: 5.75 }),
    h('path', { d: 'M2.45 8h11.1M8 2.25c1.55 1.55 2.35 3.47 2.35 5.75S9.55 12.2 8 13.75M8 2.25C6.45 3.8 5.65 5.72 5.65 8s.8 4.2 2.35 5.75' }),
  ])
}
