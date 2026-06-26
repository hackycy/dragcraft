import type { IconProps } from '../types'
import { h } from 'vue'

export function IconNavHome(props: IconProps = {}) {
  const { size = 16, color = 'currentColor', class: cls } = props
  return h('svg', {
    'width': size,
    'height': size,
    'viewBox': '0 0 16 16',
    'fill': 'none',
    'stroke': color,
    'stroke-width': 1.5,
    'class': cls,
  }, [
    h('circle', { cx: 8, cy: 8, r: 5 }),
  ])
}
