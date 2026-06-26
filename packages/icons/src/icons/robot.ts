import type { IconProps } from '../types'
import { h } from 'vue'

export function IconRobot(props: IconProps = {}) {
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
    h('rect', { x: 3, y: 5, width: 10, height: 9, rx: 1.5 }),
    h('line', { x1: 5.5, y1: 2, x2: 5.5, y2: 5 }),
    h('line', { x1: 10.5, y1: 2, x2: 10.5, y2: 5 }),
    h('line', { x1: 2, y1: 8, x2: 3, y2: 8 }),
    h('line', { x1: 13, y1: 8, x2: 14, y2: 8 }),
    h('circle', { cx: 6, cy: 9, r: 0.5, fill: color, stroke: 'none' }),
    h('circle', { cx: 10, cy: 9, r: 0.5, fill: color, stroke: 'none' }),
    h('path', { d: 'M6 11.5h4' }),
  ])
}
