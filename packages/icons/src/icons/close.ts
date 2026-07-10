import type { IconProps } from '../types'
import { h } from 'vue'

export function IconClose(props: IconProps = {}) {
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
  }, [h('path', { d: 'm4 4 8 8M12 4l-8 8' })])
}
