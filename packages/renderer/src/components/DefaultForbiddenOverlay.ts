import type { CreationBlockReason } from '@dragcraft/core'
import type { PropType } from 'vue'
import { useI18n } from '@dragcraft/utils'
import { defineComponent, h } from 'vue'

/**
 * Default forbidden overlay shown when a widget type cannot be dropped.
 * Renders a red dashed drop zone with the blocked reason in the center.
 */
export default defineComponent({
  name: 'DcDefaultForbiddenOverlay',

  props: {
    widgetType: {
      type: String as PropType<string>,
      required: true,
    },
    reason: {
      type: Object as PropType<CreationBlockReason | null>,
      default: null,
    },
  },

  setup(props) {
    const { t } = useI18n()

    const getMessage = () => {
      const fallback = props.reason?.message ?? t('forbidden.default', '当前物料不满足创建条件，无法添加到画布')
      return props.reason?.messageKey
        ? t(props.reason.messageKey, fallback)
        : fallback
    }

    return () =>
      h('div', { class: 'dc-forbidden-overlay' }, [
        h('span', { class: 'dc-forbidden-overlay__text' }, getMessage()),
      ])
  },
})
