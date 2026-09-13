/**
 * prod 里用宿主 `/@/utils/common/compUtils` 的 `getFileAccessHttpUrl()` 把存储 key
 * 拼成可访问的 URL。playground 没有后端也没有存储服务，物料里的图片值本身就是可直接
 * 使用的 URL（用户填的链接或本地文件的 data URL），所以原样返回。
 */
export function getFileAccessHttpUrl(value: unknown): string {
  return typeof value === 'string' ? value : ''
}
