import { expect, it } from 'vitest'
import { createGuideSchema } from '../editor/create-page-designer'
import { createMemoryPageRepository, PageRevisionConflictError } from './page-repository'

it('returns an isolated saved schema and advances its revision', async () => {
  const repository = createMemoryPageRepository()
  const saved = await repository.save({
    id: 'page-1',
    revision: 0,
    schema: createGuideSchema(),
  })

  saved.schema.globalConfig.title = '本地修改'
  const loaded = await repository.load('page-1')

  expect(saved.revision).toBe(1)
  expect(loaded?.schema.globalConfig.title).toBe('夏日活动页')
})

it('rejects stale writes', async () => {
  const repository = createMemoryPageRepository()
  await repository.save({ id: 'page-1', revision: 0, schema: createGuideSchema() })

  await expect(repository.save({
    id: 'page-1',
    revision: 0,
    schema: createGuideSchema(),
  })).rejects.toBeInstanceOf(PageRevisionConflictError)
})
