import type { DesignerInstance } from '@dragcraft/designer'
import type { PageRepository } from './page-repository'
import { ref } from 'vue'
import { createMemoryPageRepository, PageRevisionConflictError } from './page-repository'

export function usePageDraft(
  designer: DesignerInstance,
  pageId: string,
  repository: PageRepository = createMemoryPageRepository(),
) {
  const revision = ref(0)
  const status = ref('尚未保存')

  async function saveDraft() {
    try {
      const page = await repository.save({
        id: pageId,
        revision: revision.value,
        schema: designer.engine.exportSchema(),
      })
      revision.value = page.revision
      status.value = `已保存版本 ${page.revision}`
    }
    catch (error) {
      if (error instanceof PageRevisionConflictError) {
        status.value = '保存冲突：请先加载最新草稿。'
        return
      }

      status.value = '保存草稿失败'
      throw error
    }
  }

  async function reloadDraft() {
    const page = await repository.load(pageId)
    if (!page) {
      status.value = '还没有可加载的草稿'
      return
    }

    const result = designer.engine.importSchema(page.schema)
    if (!result.ok) {
      status.value = '草稿没有通过当前物料注册表校验'
      return
    }

    revision.value = page.revision
    status.value = `已加载版本 ${page.revision}`
  }

  return {
    reloadDraft,
    saveDraft,
    status,
  }
}
