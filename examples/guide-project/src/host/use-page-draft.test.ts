import { expect, it } from 'vitest'
import { createActivityDesigner } from '../editor/create-activity-designer'
import { createMemoryPageRepository } from './page-repository'
import { usePageDraft } from './use-page-draft'

it('reports a stale draft save without overwriting the newer revision', async () => {
  const repository = createMemoryPageRepository()
  const currentDesigner = createActivityDesigner()
  const staleDesigner = createActivityDesigner()
  const currentDraft = usePageDraft(currentDesigner, 'page-1', repository)
  const staleDraft = usePageDraft(staleDesigner, 'page-1', repository)

  await currentDraft.saveDraft()
  await staleDraft.saveDraft()

  expect(staleDraft.status.value).toBe('保存冲突：请先加载最新草稿。')
  expect((await repository.load('page-1'))?.revision).toBe(1)

  currentDesigner.dispose()
  staleDesigner.dispose()
})
