import type { IconProps } from '../types'
import { h } from 'vue'

export function IconStructureTree(props: IconProps = {}) {
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
    h('path', { d: 'M4 3v10' }),
    h('path', { d: 'M4 5h3' }),
    h('path', { d: 'M4 11h3' }),
    h('rect', { x: 7, y: 2.5, width: 6, height: 4, rx: 0.8 }),
    h('rect', { x: 7, y: 9.5, width: 6, height: 4, rx: 0.8 }),
  ])
}
