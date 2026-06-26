import type { IconProps } from '../types'
import { h } from 'vue'

export function IconSignal(props: IconProps = {}) {
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
    h('path', { d: 'M8 3v10A5 5 0 0 0 8 3', fill: color, stroke: 'none' }),
  ])
}
