import type { IconProps } from '../types'
import { h } from 'vue'

export function IconSettings(props: IconProps = {}) {
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
    h('circle', { cx: 8, cy: 8, r: 2.25 }),
    h('path', { d: 'M8 2.25v1.2M8 12.55v1.2M2.25 8h1.2M12.55 8h1.2M3.95 3.95l.85.85M11.2 11.2l.85.85M12.05 3.95l-.85.85M4.8 11.2l-.85.85' }),
  ])
}
