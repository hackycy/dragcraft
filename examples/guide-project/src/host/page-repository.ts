import type { DesignerSchema } from '@dragcraft/designer'

export interface SavedPage {
  id: string
  revision: number
  schema: DesignerSchema
}

export interface SavePageInput {
  id: string
  revision: number
  schema: DesignerSchema
}

export interface PageRepository {
  load: (id: string) => Promise<SavedPage | null>
  save: (input: SavePageInput) => Promise<SavedPage>
}

export class PageRevisionConflictError extends Error {
  constructor(id: string) {
    super(`页面 ${id} 已被其他编辑会话更新`)
    this.name = 'PageRevisionConflictError'
  }
}

function clonePersistedValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

// #region tutorial-page-repository
export function createMemoryPageRepository(seed: SavedPage[] = []): PageRepository {
  const pages = new Map(seed.map(page => [page.id, clonePersistedValue(page)]))

  return {
    async load(id) {
      const page = pages.get(id)
      return page ? clonePersistedValue(page) : null
    },
    async save(input) {
      const current = pages.get(input.id)
      if (current && current.revision !== input.revision)
        throw new PageRevisionConflictError(input.id)

      const page: SavedPage = {
        id: input.id,
        revision: (current?.revision ?? 0) + 1,
        schema: clonePersistedValue(input.schema),
      }
      pages.set(page.id, page)
      return clonePersistedValue(page)
    },
  }
}
// #endregion tutorial-page-repository
