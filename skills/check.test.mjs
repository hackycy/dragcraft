import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'
import {
  computeScenarioDigest,
  supportedPublicPackages,
  validateEvaluation,
  validateEvaluationManifest,
  validateResourceManifest,
  validateResultRecord,
  validateWorkflow,
} from './check-lib.mjs'

const repositoryRoot = resolve(import.meta.dirname, '..')
const documentation = {
  repository: 'https://github.com/hackycy/dragcraft',
  site: 'https://hackycy.github.io/dragcraft',
}

function validEvaluation(overrides = {}) {
  return {
    id: 'integration',
    workflows: ['integration'],
    task: '创建编辑器',
    evidence: ['公开类型'],
    boundary: ['宿主持有状态'],
    verification: ['类型检查'],
    ...overrides,
  }
}

function validResources(overrides = {}) {
  return {
    workflow: 'integration',
    docs: [{
      repositoryPath: 'docs/index.md',
      url: 'https://hackycy.github.io/dragcraft/',
    }],
    examples: [{
      repositoryPath: 'examples/guide-project/src/main.ts',
      url: 'https://github.com/hackycy/dragcraft/blob/main/examples/guide-project/src/main.ts',
    }],
    packages: ['@dragcraft/designer'],
    ...overrides,
  }
}

it('rejects an incomplete evaluation contract', () => {
  const failures = validateEvaluation({
    id: 'integration',
    workflows: ['integration'],
    task: '创建编辑器',
    evidence: ['公开类型'],
  }, 'integration.md')

  expect(failures).toEqual([
    'integration.md 缺少非空 boundary',
    'integration.md 缺少非空 verification',
  ])
})

it('rejects unknown and duplicated workflow dependencies', () => {
  const failures = validateEvaluation(validEvaluation({
    workflows: ['integration', 'integration', 'unknown'],
  }), 'integration.md')

  expect(failures).toContain('integration.md 的 workflows 不能重复')
  expect(failures).toContain('integration.md 引用了未知工作流 unknown')
})

it('rejects a missing workflow resource branch', () => {
  const failures = validateWorkflow({
    playbook: 'references/integration.md',
  }, 'integration', {
    documentation,
    publicPackageNames: supportedPublicPackages,
    repositoryRoot,
    skill: '[integration](references/integration.md)',
    skillRoot: resolve(repositoryRoot, 'skills/dragcraft'),
  })

  expect(failures).toContain('integration 必须映射到 references/resources/integration.json')
})

it('rejects an internal package from a resource manifest', () => {
  const failures = validateResourceManifest(validResources({
    packages: ['@dragcraft/core'],
  }), 'integration', {
    documentation,
    publicPackageNames: supportedPublicPackages,
    repositoryRoot,
  })

  expect(failures).toContain('integration 引用了非公开 package: @dragcraft/core')
})

it('rejects non-official documentation and example URLs', () => {
  const failures = validateResourceManifest(validResources({
    docs: [{ repositoryPath: 'docs/index.md', url: 'https://example.test/guide' }],
    examples: [{ repositoryPath: 'examples/guide-project/src/main.ts', url: 'https://example.test/example' }],
  }), 'integration', {
    documentation,
    publicPackageNames: supportedPublicPackages,
    repositoryRoot,
  })

  expect(failures).toContain('integration 的文档 URL 不是官方站点: https://example.test/guide')
  expect(failures).toContain('integration 的示例 URL 不是官方仓库: https://example.test/example')
})

it('rejects a manifest that leaves a workflow uncovered', () => {
  const evaluationRoot = mkdtempSync(resolve(tmpdir(), 'dragcraft-evals-'))
  try {
    writeFileSync(resolve(evaluationRoot, 'integration.md'), `---\nid: integration\nworkflows:\n  - integration\ntask: 创建编辑器\nevidence:\n  - 公开类型\nboundary:\n  - 宿主持有状态\nverification:\n  - 类型检查\n---\n`)
    const failures = validateEvaluationManifest({
      schemaVersion: 2,
      referenceAgentPolicy: 'single',
      scenarios: [{
        id: 'integration',
        workflows: ['integration'],
        file: 'integration.md',
        result: 'results/integration.md',
      }],
    }, evaluationRoot, ['integration', 'commands'])

    expect(failures).toContain('评测未覆盖工作流 commands')
    expect(failures).toContain('评测缺少跨工作流场景')
  }
  finally {
    rmSync(evaluationRoot, { force: true, recursive: true })
  }
})

it('rejects evaluation workflows that disagree with the manifest', () => {
  const evaluationRoot = mkdtempSync(resolve(tmpdir(), 'dragcraft-evals-'))
  try {
    writeFileSync(resolve(evaluationRoot, 'integration.md'), `---\nid: integration\nworkflows:\n  - commands\ntask: 创建编辑器\nevidence:\n  - 公开类型\nboundary:\n  - 宿主持有状态\nverification:\n  - 类型检查\n---\n`)
    const failures = validateEvaluationManifest({
      schemaVersion: 2,
      referenceAgentPolicy: 'single',
      scenarios: [{
        id: 'integration',
        workflows: ['integration'],
        file: 'integration.md',
        result: 'results/integration.md',
      }],
    }, evaluationRoot, ['integration'])

    expect(failures).toContain('integration 的 workflows 与 manifest 不一致')
  }
  finally {
    rmSync(evaluationRoot, { force: true, recursive: true })
  }
})

it('rejects a stale reference Agent result', () => {
  const temporaryRoot = mkdtempSync(resolve(tmpdir(), 'dragcraft-digest-'))
  try {
    const files = {
      'skills/dragcraft/SKILL.md': 'root skill',
      'skills/dragcraft/references/evidence.md': 'evidence',
      'skills/dragcraft/references/integration.md': 'playbook',
      'skills/dragcraft/references/resources/integration.json': JSON.stringify({
        workflow: 'integration',
        docs: [{ repositoryPath: 'docs/guide.md' }],
        examples: [{ repositoryPath: 'examples/guide-project/src/main.ts' }],
        packages: ['@dragcraft/designer'],
      }),
      'skills/evals/integration.md': 'evaluation',
      'docs/guide.md': 'guide input',
      'examples/guide-project/src/main.ts': 'example input',
      'packages/designer/package.json': '{"name":"@dragcraft/designer"}',
    }
    for (const [path, contents] of Object.entries(files)) {
      const absolutePath = resolve(temporaryRoot, path)
      mkdirSync(resolve(absolutePath, '..'), { recursive: true })
      writeFileSync(absolutePath, contents)
    }

    const scenario = { id: 'integration', workflows: ['integration'], file: 'integration.md' }
    const sourceMap = {
      publicPackages: [{ name: '@dragcraft/designer', repositoryPath: 'packages/designer/package.json' }],
      workflows: {
        integration: {
          playbook: 'references/integration.md',
          resources: 'references/resources/integration.json',
        },
      },
    }
    const recordedDigest = computeScenarioDigest(temporaryRoot, sourceMap, scenario)
    writeFileSync(resolve(temporaryRoot, 'docs/guide.md'), 'changed guide input')
    const currentDigest = computeScenarioDigest(temporaryRoot, sourceMap, scenario)
    const failures = validateResultRecord({
      id: 'integration',
      workflows: ['integration'],
      status: 'passed',
      inputDigest: recordedDigest,
      executedAt: '2026-07-29T10:00:00Z',
      runner: { agent: 'Codex', model: 'reference' },
      evidence: ['公开类型'],
      verification: ['类型检查'],
    }, scenario, currentDigest, 'integration.md')

    expect(currentDigest).not.toBe(recordedDigest)
    expect(failures).toEqual(['integration.md 的参考 Agent 结果已过期'])
  }
  finally {
    rmSync(temporaryRoot, { force: true, recursive: true })
  }
})

it('rejects results from a different reference Agent or model', () => {
  const scenario = { id: 'integration', workflows: ['integration'] }
  const failures = validateResultRecord({
    id: 'integration',
    workflows: ['integration'],
    status: 'passed',
    inputDigest: 'sha256:current',
    executedAt: '2026-07-29T10:00:00Z',
    runner: { agent: 'Codex', model: 'different-model' },
    evidence: ['公开类型'],
    verification: ['类型检查'],
  }, scenario, 'sha256:current', 'integration.md', {
    agent: 'Codex',
    model: 'reference-model',
  })

  expect(failures).toEqual(['integration.md 与其他结果使用了不同的参考 Agent 或 model'])
})
