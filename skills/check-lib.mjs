import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'yaml'

export const expectedEvaluations = {
  'integration.md': 'integration',
  'widgets.md': 'widgets',
  'containers.md': 'containers',
  'forms.md': 'forms',
  'shell.md': 'shell',
  'lifecycle.md': 'lifecycle',
  'version-mismatch.md': 'integration',
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isNonEmptyStringList(value) {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString)
}

function readText(path, failures) {
  if (!existsSync(path)) {
    failures.push(`缺少文件: ${path}`)
    return ''
  }
  return readFileSync(path, 'utf8')
}

function readJson(path, failures) {
  const text = readText(path, failures)
  try {
    return JSON.parse(text)
  }
  catch {
    failures.push(`不是有效 JSON: ${path}`)
    return null
  }
}

export function parseMarkdownFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match)
    return { error: '缺少 YAML frontmatter' }

  try {
    const value = parse(match[1])
    return value && typeof value === 'object'
      ? { value }
      : { error: 'frontmatter 必须是对象' }
  }
  catch (error) {
    return { error: `frontmatter YAML 无效: ${error.message}` }
  }
}

export function findPlaybookLink(skill, workflow) {
  return skill.match(new RegExp(`\\[${workflow}\\]\\((references/[^)]+)\\)`))?.[1] ?? null
}

export function validateEvaluation(evaluation, filename, expectedWorkflow) {
  const failures = []
  const expectedId = filename.replace(/\.md$/, '')
  if (evaluation?.id !== expectedId)
    failures.push(`${filename} 的 id 必须是 ${expectedId}`)
  if (evaluation?.workflow !== expectedWorkflow)
    failures.push(`${filename} 必须路由到 ${expectedWorkflow}`)
  if (!isNonEmptyString(evaluation?.task))
    failures.push(`${filename} 缺少 task`)
  for (const field of ['evidence', 'boundary', 'verification']) {
    if (!isNonEmptyStringList(evaluation?.[field]))
      failures.push(`${filename} 缺少非空 ${field}`)
  }
  return failures
}

export function validateWorkflow(entry, workflow, options) {
  const { repositoryRoot, skillRoot, documentation, skill } = options
  const failures = []
  const expectedPlaybook = `references/${workflow}.md`
  if (entry?.playbook !== expectedPlaybook)
    failures.push(`${workflow} 必须映射到 ${expectedPlaybook}`)
  if (findPlaybookLink(skill, workflow) !== entry?.playbook)
    failures.push(`根 skill 的 ${workflow} 路由与 source map 不一致`)
  if (!existsSync(resolve(skillRoot, entry?.playbook ?? '')))
    failures.push(`${workflow} 的 playbook 不存在`)

  for (const type of ['docs', 'examples']) {
    const resources = entry?.[type]
    if (!Array.isArray(resources) || resources.length === 0) {
      failures.push(`${workflow} 缺少 ${type}`)
      continue
    }
    for (const resource of resources) {
      if (!isNonEmptyString(resource?.repositoryPath))
        failures.push(`${workflow} 的 ${type} 缺少 repositoryPath`)
      else if (!existsSync(resolve(repositoryRoot, resource.repositoryPath)))
        failures.push(`${workflow} 的 ${type} 路径不存在: ${resource.repositoryPath}`)
      if (!isNonEmptyString(resource?.url))
        failures.push(`${workflow} 的 ${type} 缺少 url`)
      else if (type === 'docs' && !resource.url.startsWith(`${documentation.site}/`))
        failures.push(`${workflow} 的文档 URL 不是官方站点: ${resource.url}`)
      else if (type === 'examples' && !resource.url.startsWith(`${documentation.repository}/blob/main/`))
        failures.push(`${workflow} 的范例 URL 不是官方仓库: ${resource.url}`)
    }
  }

  const packages = entry?.packages
  if (!Array.isArray(packages) || packages.length === 0) {
    failures.push(`${workflow} 缺少 packages`)
  }
  else {
    for (const pkg of packages) {
      if (!isNonEmptyString(pkg?.name) || !isNonEmptyString(pkg?.repositoryPath)) {
        failures.push(`${workflow} 的 package 缺少 name 或 repositoryPath`)
        continue
      }
      const manifestPath = resolve(repositoryRoot, pkg.repositoryPath)
      const manifest = readJson(manifestPath, failures)
      if (manifest?.name !== pkg.name)
        failures.push(`${workflow} 的 package 与 manifest 不一致: ${pkg.name}`)
    }
  }

  return failures
}

export function validateResults(results, evaluationRoot) {
  const failures = []
  if (results?.schemaVersion !== 1 || !Array.isArray(results.runs)) {
    failures.push('评测结果必须包含 schemaVersion: 1 和 runs 数组')
    return failures
  }

  const expected = Object.entries(expectedEvaluations).map(([filename, workflow]) => ({
    id: filename.replace(/\.md$/, ''),
    workflow,
  }))
  if (results.runs.length !== expected.length)
    failures.push(`评测结果必须包含 ${expected.length} 条记录`)

  for (const item of expected) {
    const run = results.runs.find(candidate => candidate?.id === item.id)
    if (!run) {
      failures.push(`评测结果缺少 ${item.id}`)
      continue
    }
    if (run.workflow !== item.workflow)
      failures.push(`${item.id} 的结果工作流不正确`)
    if (run.status !== 'passed')
      failures.push(`${item.id} 尚未通过 agent 评测`)
    if (!isNonEmptyString(run.executedAt) || Number.isNaN(Date.parse(run.executedAt)))
      failures.push(`${item.id} 缺少有效 executedAt`)
    if (!isNonEmptyString(run.runner?.agent) || !isNonEmptyString(run.runner?.model))
      failures.push(`${item.id} 缺少 runner 信息`)
    if (!isNonEmptyString(run.record)) {
      failures.push(`${item.id} 缺少结果记录`)
      continue
    }

    const recordPath = resolve(evaluationRoot, run.record)
    const record = parseMarkdownFrontmatter(readText(recordPath, failures))
    if (record.error) {
      failures.push(`${item.id} 的结果记录 ${record.error}`)
      continue
    }
    if (record.value.id !== item.id || record.value.workflow !== item.workflow || record.value.status !== 'passed')
      failures.push(`${item.id} 的结果记录与结果索引不一致`)
    if (!isNonEmptyStringList(record.value.evidence) || !isNonEmptyStringList(record.value.verification))
      failures.push(`${item.id} 的结果记录缺少 evidence 或 verification`)
  }

  return failures
}

export function validateSkills(repositoryRoot) {
  const failures = []
  const skillRoot = resolve(repositoryRoot, 'skills/dragcraft')
  const evaluationRoot = resolve(repositoryRoot, 'skills/evals')
  const skill = readText(resolve(skillRoot, 'SKILL.md'), failures)
  const skillMetadata = parseMarkdownFrontmatter(skill)
  if (skillMetadata.error)
    failures.push(`SKILL.md ${skillMetadata.error}`)
  else if (skillMetadata.value.name !== 'dragcraft' || skillMetadata.value['disable-model-invocation'] !== true || !isNonEmptyString(skillMetadata.value.description))
    failures.push('SKILL.md metadata 无效')

  const agentMetadataText = readText(resolve(skillRoot, 'agents/openai.yaml'), failures)
  let agentMetadata
  try {
    agentMetadata = parse(agentMetadataText)
  }
  catch (error) {
    failures.push(`agents/openai.yaml 无效: ${error.message}`)
  }
  if (agentMetadata?.policy?.allow_implicit_invocation !== false)
    failures.push('agents/openai.yaml 必须关闭隐式调用')

  const sourceMap = readJson(resolve(skillRoot, 'references/source-map.json'), failures)
  const documentation = sourceMap?.documentation
  if (sourceMap?.schemaVersion !== 1 || !isNonEmptyString(documentation?.site) || !isNonEmptyString(documentation?.repository)
    || !isNonEmptyString(documentation?.llmsIndex) || !isNonEmptyString(documentation?.llmsFull) || !isNonEmptyString(documentation?.sourceCheckoutMarker)) {
    failures.push('source map documentation 无效')
  }
  else if (!existsSync(resolve(repositoryRoot, documentation.sourceCheckoutMarker))) {
    failures.push(`source checkout marker 不存在: ${documentation.sourceCheckoutMarker}`)
  }

  for (const workflow of new Set(Object.values(expectedEvaluations))) {
    const entry = sourceMap?.workflows?.[workflow]
    failures.push(...validateWorkflow(entry, workflow, { repositoryRoot, skillRoot, documentation: documentation ?? {}, skill }))
  }

  const files = existsSync(evaluationRoot)
    ? readdirSync(evaluationRoot).filter(filename => filename.endsWith('.md')).sort()
    : []
  const expectedFiles = Object.keys(expectedEvaluations).sort()
  if (JSON.stringify(files) !== JSON.stringify(expectedFiles))
    failures.push('评测文件必须与固定场景列表完全一致')
  for (const [filename, workflow] of Object.entries(expectedEvaluations)) {
    const evaluation = parseMarkdownFrontmatter(readText(resolve(evaluationRoot, filename), failures))
    if (evaluation.error)
      failures.push(`${filename} ${evaluation.error}`)
    else
      failures.push(...validateEvaluation(evaluation.value, filename, workflow))
  }

  const results = readJson(resolve(evaluationRoot, 'results.json'), failures)
  failures.push(...validateResults(results, evaluationRoot))

  if (!existsSync(resolve(repositoryRoot, 'skills/README.md')))
    failures.push('缺少 skills/README.md')
  if (!existsSync(resolve(repositoryRoot, 'docs/guide/ai-assisted-development.md')))
    failures.push('缺少 AI 辅助接入文档')
  const docsConfig = readText(resolve(repositoryRoot, 'docs/.vitepress/config.ts'), failures)
  if (!docsConfig.includes('{ text: \'AI 辅助接入\', link: \'/guide/ai-assisted-development\' }'))
    failures.push('文档侧边栏缺少 AI 辅助接入入口')

  return failures
}
