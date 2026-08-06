import type { Component } from 'vue'
import type { MaterialDefinition } from './materials/types'

type Translate = (key: string, fallback?: string) => string

export interface ResolvedMaterialItem {
  readonly title: string
  readonly description?: string
  readonly icon?: Component | string
  readonly thumbnail?: string
  readonly tags: readonly string[]
  readonly keywords: readonly string[]
}

function resolveText(key: string | undefined, fallback: string | undefined, t: Translate): string | undefined {
  return key ? t(key, fallback ?? '') : fallback
}

export function resolveMaterialItem(material: MaterialDefinition, t: Translate): ResolvedMaterialItem {
  const panel = material.panel
  return {
    title: resolveText(panel?.titleKey, panel?.title, t) ?? material.type,
    description: resolveText(panel?.descriptionKey, panel?.description, t),
    icon: panel?.icon,
    thumbnail: panel?.thumbnail,
    tags: panel?.tags ?? [],
    keywords: panel?.keywords ?? [],
  }
}

export function materialItemMatchesQuery(
  material: MaterialDefinition,
  display: ResolvedMaterialItem,
  query: string,
): boolean {
  const normalized = query.toLowerCase().trim()
  if (!normalized)
    return true
  return [
    material.type,
    display.title,
    display.description,
    display.tags.join(' '),
    display.keywords.join(' '),
  ].some(value => value?.toLowerCase().includes(normalized))
}
