import type { DeepReadonly, DocumentSchema } from '@dragcraft/core'
import type { MaterialDefinition, MaterialPanelVisibilityContext } from './materials/types'
import type { ResolvedMaterialItem } from './types'

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

export function resolveMaterialItem(material: Readonly<MaterialDefinition>, t: Translate): ResolvedMaterialItem {
  const panel = material.panel
  const titleFallback = panel?.title ?? material.type
  const title = resolveText(panel?.titleKey, titleFallback, t) ?? material.type

  return {
    title,
    icon: panel?.icon,
    description: resolveText(panel?.descriptionKey, panel?.description, t),
    thumbnail: panel?.thumbnail,
    tags: [...(panel?.tags ?? [])],
    keywords: [...(panel?.keywords ?? [])],
  }
}

export function materialItemMatchesQuery(
  material: Readonly<MaterialDefinition>,
  item: ResolvedMaterialItem,
  query: string,
): boolean {
  const normalizedQuery = query.toLowerCase().trim()
  if (!normalizedQuery)
    return true

  const values = [
    material.type,
    material.panel?.title,
    material.panel?.titleKey,
    material.panel?.group,
    item.title,
    item.description,
    item.tags.join(' '),
    item.keywords.join(' '),
  ]

  return values.some(value =>
    typeof value === 'string' && value.toLowerCase().includes(normalizedQuery),
  )
}

export function isMaterialPanelVisible(
  material: Readonly<MaterialDefinition>,
  schema: DeepReadonly<DocumentSchema> | null,
): boolean {
  const visible = material.panel?.visible
  if (typeof visible === 'function') {
    const context: MaterialPanelVisibilityContext = {
      materialType: material.type,
      schema,
    }
    return visible(context)
  }
  return visible ?? true
}
