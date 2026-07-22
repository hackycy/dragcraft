import { resolve } from 'node:path'
import { expect, it } from 'vitest'
import { validateEvaluation, validateResults, validateWorkflow } from './check-lib.mjs'

it('rejects an incomplete evaluation contract', () => {
  const failures = validateEvaluation({
    id: 'containers',
    workflow: 'containers',
    task: '创建容器',
    evidence: ['类型'],
  }, 'containers.md', 'containers')

  expect(failures).toEqual([
    'containers.md 缺少非空 boundary',
    'containers.md 缺少非空 verification',
  ])
})

it('rejects an evaluation routed to the wrong workflow', () => {
  const failures = validateEvaluation({
    id: 'version-mismatch',
    workflow: 'widgets',
    task: '版本差异',
    evidence: ['锁文件'],
    boundary: ['本地类型优先'],
    verification: ['类型检查'],
  }, 'version-mismatch.md', 'integration')

  expect(failures).toEqual(['version-mismatch.md 必须路由到 integration'])
})

it('rejects a router link that disagrees with the source map', () => {
  const failures = validateWorkflow({
    playbook: 'references/widgets.md',
    docs: [],
    examples: [],
    packages: [],
  }, 'integration', {
    repositoryRoot: import.meta.dirname,
    skillRoot: import.meta.dirname,
    documentation: { site: 'https://hackycy.github.io/dragcraft', repository: 'https://github.com/hackycy/dragcraft' },
    skill: '[integration](references/integration.md)',
  })

  expect(failures).toContain('integration 必须映射到 references/integration.md')
  expect(failures).toContain('根 skill 的 integration 路由与 source map 不一致')
})

it('rejects a missing agent result record', () => {
  const failures = validateResults({ schemaVersion: 1, runs: [] }, import.meta.dirname)

  expect(failures).toContain('评测结果必须包含 7 条记录')
  expect(failures).toContain('评测结果缺少 integration')
})

it('rejects a non-official documentation URL', () => {
  const repositoryRoot = resolve(import.meta.dirname, '..')
  const failures = validateWorkflow({
    playbook: 'references/integration.md',
    docs: [{ repositoryPath: 'package.json', url: 'https://example.test/guide' }],
    examples: [{ repositoryPath: 'package.json', url: 'https://github.com/hackycy/dragcraft/blob/main/package.json' }],
    packages: [{ name: '@dragcraft/designer', repositoryPath: 'packages/designer/package.json' }],
  }, 'integration', {
    repositoryRoot,
    skillRoot: resolve(repositoryRoot, 'skills/dragcraft'),
    documentation: { site: 'https://hackycy.github.io/dragcraft', repository: 'https://github.com/hackycy/dragcraft' },
    skill: '[integration](references/integration.md)',
  })

  expect(failures).toContain('integration 的文档 URL 不是官方站点: https://example.test/guide')
})
