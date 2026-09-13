import { createDiyV2BackgroundStyle, normalizeDiyV2BackgroundConfig } from './background'
import { getFileAccessHttpUrl } from './shims/file-url'

/**
 * 把全局配置里的背景值翻译成一组 CSS 自定义属性，供画布 surface 使用。
 *
 * 这是 prod 的做法（它的 `index.vue` 里 `pageBackgroundStyle` 那段）：**不写
 * `page.style.surface`**，而是在样式中覆盖设计器的画布 surface 元素。这样 `globalConfig`
 * 始终是唯一真源，导出的 schema 里不会多出一份派生数据。
 *
 * prod 还会读 `page.style.surface.backgroundColor` 作为旧数据的颜色回退；playground 没有存量
 * 数据（`page.style.surface` 恒为 `{}`），故不搬那一支。
 */
export function createPageBackgroundCssVars(
  background: unknown,
): Record<string, string> {
  const config = normalizeDiyV2BackgroundConfig(background)
  const style = createDiyV2BackgroundStyle(
    config,
    config.image ? getFileAccessHttpUrl(config.image) : '',
  )

  return {
    '--dc-internal-page-background-color': style.backgroundColor,
    '--dc-internal-page-background-image': style.backgroundImage,
    '--dc-internal-page-background-position': style.backgroundPosition,
    '--dc-internal-page-background-repeat': style.backgroundRepeat,
    '--dc-internal-page-background-size': style.backgroundSize,
  }
}
