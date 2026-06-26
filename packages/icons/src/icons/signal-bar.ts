import type { IconProps } from '../types'
import { h } from 'vue'

export function IconSignalBar(props: IconProps = {}) {
  const { size = 16, color = 'currentColor', class: cls } = props
  return h('svg', {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    class: cls,
  }, [
    h('rect', { x: 2, y: 5, width: 12, height: 6, rx: 1, fill: color }),
  ])
}
