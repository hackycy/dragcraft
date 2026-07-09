import type { DesignerWidgetMeta, ResolvedMaterialItem } from './types'

type Translate = (key: string, fallback?: string) => string

function resolveText(
  key: string | undefined,
  fallback: string | undefined,
  t: Translate,
): string | undefined {
  if (!key)
    return fallback
  return t(key, fallback ?? '')
}

export function resolveMaterialItem(meta: DesignerWidgetMeta, t: Translate): ResolvedMaterialItem {
  const material = meta.material
  const titleFallback = material?.title ?? meta.title
  const title = resolveText(material?.titleKey ?? meta.titleKey, titleFallback, t) ?? meta.title

  return {
    title,
    icon: material?.icon ?? meta.icon,
    description: resolveText(material?.descriptionKey, material?.description, t),
    thumbnail: material?.thumbnail,
    tags: material?.tags ?? [],
    keywords: material?.keywords ?? [],
  }
}

export function materialItemMatchesQuery(
  meta: DesignerWidgetMeta,
  material: ResolvedMaterialItem,
  query: string,
): boolean {
  const normalizedQuery = query.toLowerCase().trim()
  if (!normalizedQuery)
    return true

  const values = [
    meta.type,
    meta.title,
    meta.titleKey,
    meta.icon,
    meta.group,
    material.title,
    material.description,
    material.tags.join(' '),
    material.keywords.join(' '),
  ]

  return values.some(value =>
    typeof value === 'string' && value.toLowerCase().includes(normalizedQuery),
  )
}
