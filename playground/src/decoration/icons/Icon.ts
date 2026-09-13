import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

import { ICON_GLYPHS } from './glyphs'

/**
 * 渲染本地字形注册表里的 Iconify 字形。
 *
 * prop 名沿用 prod 调用点的 `icon`（prod 的 `<Icon :icon="..." />`），这样照搬过来的
 * 物料 .vue 文件不需要改调用。尺寸通过 width/height 给出，不依赖字形的坐标系，
 * 因为 ant-design 字形是 1024 单位、material-symbols 与 bx 是 24 单位。
 */
export const Icon = defineComponent({
  name: 'DecorationIcon',
  props: {
    icon: { type: String as PropType<string>, required: true },
    size: { type: [Number, String] as PropType<number | string>, default: 16 },
    color: { type: String as PropType<string | undefined>, default: undefined },
  },
  setup(props) {
    return () => {
      const glyph = ICON_GLYPHS[props.icon]
      if (!glyph) {
        throw new Error(`[decoration] 未注册的图标字形: ${props.icon}`)
      }

      return h('svg', {
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: glyph.viewBox,
        width: props.size,
        height: props.size,
        style: props.color ? { color: props.color } : undefined,
        innerHTML: glyph.body,
      })
    }
  },
})
