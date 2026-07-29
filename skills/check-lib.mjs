import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { relative, resolve, sep } from 'node:path'
import { parse } from 'yaml'

export const requiredWorkflows = [
  'integration',
  'commands',
  'widgets',
  'forms',
  'layout',
  'containers',
  'shell',
  'lifecycle',
]

export const supportedPublicPackages = [
  '@dragcraft/designer',
  '@dragcraft/device-frames',
  '@dragcraft/fields-ant-design-vue',
]

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isNonEmptyStringList(value) {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString)
}

function sameStringList(actual, expected) {
  return isNonEmptyStringList(actual) && JSON.stringify(actual) === JSON.stringify(expected)
}

function readText(path, failures) {
  if (!existsSync(path)) {
    failures.push(`缺少文件: ${path}`)
    return ''
  }
  try {
    return readFileSync(path, 'utf8')
  }
  catch {
    failures.push(`无法读取文件: ${path}`)
    return ''
  }
}

function readJson(path, failures) {
  const source = readText(path, failures)
  try {
    return JSON.parse(source)
  }
  catch {
    failures.push(`不是有效 JSON: ${path}`)
    return null
  }
}

function normalizedRelativePath(root, path) {
  return relative(root, path).split(sep).join('/')
}

function listMarkdownFiles(root) {
  return existsSync(root)
    ? readdirSync(root).filter(filename => filename.endsWith('.md')).sort()
    : []
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

export function validateEvaluation(evaluation, filename, knownWorkflows = requiredWorkflows) {
  const failures = []
  const expectedId = filename.replace(/\.md$/, '')
  if (evaluation?.id !== expectedId)
    failures.push(`${filename} 的 id 必须是 ${expectedId}`)
  if (!isNonEmptyStringList(evaluation?.workflows)) {
    failures.push(`${filename} 缺少非空 workflows`)
  }
  else {
    if (new Set(evaluation.workflows).size !== evaluation.workflows.length)
      failures.push(`${filename} 的 workflows 不能重复`)
    for (const workflow of evaluation.workflows) {
      if (!knownWorkflows.includes(workflow))
        failures.push(`${filename} 引用了未知工作流 ${workflow}`)
    }
  }
  if (!isNonEmptyString(evaluation?.task))
    failures.push(`${filename} 缺少 task`)
  for (const field of ['evidence', 'boundary', 'verification']) {
    if (!isNonEmptyStringList(evaluation?.[field]))
      failures.push(`${filename} 缺少非空 ${field}`)
  }
  return failures
}

export function validateResourceManifest(resources, workflow, options) {
  const { documentation, publicPackageNames, repositoryRoot } = options
  const failures = []
  if (resources?.workflow !== workflow)
    failures.push(`${workflow} 的 resources.workflow 必须是 ${workflow}`)

  for (const type of ['docs', 'examples']) {
    const entries = resources?.[type]
    if (!Array.isArray(entries) || entries.length === 0) {
      failures.push(`${workflow} 缺少 ${type}`)
      continue
    }
    for (const resource of entries) {
      if (!isNonEmptyString(resource?.repositoryPath)) {
        failures.push(`${workflow} 的 ${type} 缺少 repositoryPath`)
      }
      else {
        if (!existsSync(resolve(repositoryRoot, resource.repositoryPath)))
          failures.push(`${workflow} 的 ${type} 路径不存在: ${resource.repositoryPath}`)
        if (type === 'docs' && !resource.repositoryPath.startsWith('docs/'))
          failures.push(`${workflow} 的文档路径不在 docs/: ${resource.repositoryPath}`)
        if (type === 'examples' && !resource.repositoryPath.startsWith('examples/guide-project/'))
          failures.push(`${workflow} 的示例必须来自 guide-project: ${resource.repositoryPath}`)
      }

      if (!isNonEmptyString(resource?.url)) {
        failures.push(`${workflow} 的 ${type} 缺少 url`)
      }
      else if (type === 'docs' && !resource.url.startsWith(`${documentation.site}/`)) {
        failures.push(`${workflow} 的文档 URL 不是官方站点: ${resource.url}`)
      }
      else if (type === 'examples' && !resource.url.startsWith(`${documentation.repository}/blob/main/`)) {
        failures.push(`${workflow} 的示例 URL 不是官方仓库: ${resource.url}`)
      }
    }
  }

  if (!isNonEmptyStringList(resources?.packages)) {
    failures.push(`${workflow} 缺少 packages`)
  }
  else {
    for (const packageName of resources.packages) {
      if (!publicPackageNames.includes(packageName))
        failures.push(`${workflow} 引用了非公开 package: ${packageName}`)
    }
  }

  return failures
}

export function validateWorkflow(entry, workflow, options) {
  const { documentation, publicPackageNames, repositoryRoot, skill, skillRoot } = options
  const failures = []
  const expectedPlaybook = `references/${workflow}.md`
  const expectedResources = `references/resources/${workflow}.json`

  if (entry?.playbook !== expectedPlaybook)
    failures.push(`${workflow} 必须映射到 ${expectedPlaybook}`)
  if (entry?.resources !== expectedResources)
    failures.push(`${workflow} 必须映射到 ${expectedResources}`)
  if (findPlaybookLink(skill, workflow) !== entry?.playbook)
    failures.push(`根 skill 的 ${workflow} 路由与 source map 不一致`)
  if (!existsSync(resolve(skillRoot, entry?.playbook ?? '')))
    failures.push(`${workflow} 的 playbook 不存在`)

  const resourcePath = resolve(skillRoot, entry?.resources ?? '')
  const resources = readJson(resourcePath, failures)
  if (resources) {
    failures.push(...validateResourceManifest(resources, workflow, {
      documentation,
      publicPackageNames,
      repositoryRoot,
    }))
  }

  return failures
}

export function validateEvaluationManifest(manifest, evaluationRoot, knownWorkflows = requiredWorkflows) {
  const failures = []
  if (manifest?.schemaVersion !== 2 || manifest?.referenceAgentPolicy !== 'single' || !Array.isArray(manifest?.scenarios)) {
    failures.push('评测 manifest 必须包含 schemaVersion: 2、single reference agent policy 和 scenarios')
    return failures
  }
  if (manifest.scenarios.length !== knownWorkflows.length + 2)
    failures.push(`评测 manifest 必须包含 ${knownWorkflows.length + 2} 个场景`)

  const ids = new Set()
  const coveredWorkflows = new Set()
  for (const scenario of manifest.scenarios) {
    if (!isNonEmptyString(scenario?.id)) {
      failures.push('评测场景缺少 id')
      continue
    }
    if (ids.has(scenario.id))
      failures.push(`评测场景 id 重复: ${scenario.id}`)
    ids.add(scenario.id)

    if (!isNonEmptyStringList(scenario.workflows)) {
      failures.push(`${scenario.id} 缺少 workflows`)
    }
    else {
      for (const workflow of scenario.workflows) {
        if (!knownWorkflows.includes(workflow))
          failures.push(`${scenario.id} 引用了未知工作流 ${workflow}`)
        else
          coveredWorkflows.add(workflow)
      }
    }

    const expectedFile = `${scenario.id}.md`
    const expectedResult = `results/${scenario.id}.md`
    if (scenario.file !== expectedFile)
      failures.push(`${scenario.id} 的 file 必须是 ${expectedFile}`)
    if (scenario.result !== expectedResult)
      failures.push(`${scenario.id} 的 result 必须是 ${expectedResult}`)

    const evaluation = parseMarkdownFrontmatter(readText(resolve(evaluationRoot, scenario.file ?? ''), failures))
    if (evaluation.error) {
      failures.push(`${scenario.id} ${evaluation.error}`)
    }
    else {
      failures.push(...validateEvaluation(evaluation.value, scenario.file, knownWorkflows))
      if (!sameStringList(evaluation.value.workflows, scenario.workflows))
        failures.push(`${scenario.id} 的 workflows 与 manifest 不一致`)
    }
  }

  for (const workflow of knownWorkflows) {
    if (!coveredWorkflows.has(workflow))
      failures.push(`评测未覆盖工作流 ${workflow}`)
    const representative = manifest.scenarios.find(scenario => scenario.id === workflow)
    if (!representative)
      failures.push(`评测缺少 ${workflow} 代表场景`)
    else if (!representative.workflows?.includes(workflow))
      failures.push(`${workflow} 代表场景未路由到自身工作流`)
  }
  if (!ids.has('version-mismatch'))
    failures.push('评测缺少 version-mismatch 场景')
  const crossWorkflow = manifest.scenarios.find(scenario => scenario.id === 'cross-workflow')
  if (!crossWorkflow || !isNonEmptyStringList(crossWorkflow.workflows) || crossWorkflow.workflows.length < 2)
    failures.push('评测缺少跨工作流场景')

  const expectedFiles = manifest.scenarios.map(scenario => scenario.file).sort()
  if (JSON.stringify(listMarkdownFiles(evaluationRoot)) !== JSON.stringify(expectedFiles))
    failures.push('评测文件必须与 manifest 完全一致')

  return failures
}

export function computeScenarioDigest(repositoryRoot, sourceMap, scenario, failures = []) {
  const skillRoot = resolve(repositoryRoot, 'skills/dragcraft')
  const evaluationRoot = resolve(repositoryRoot, 'skills/evals')
  const paths = new Set([
    resolve(skillRoot, 'SKILL.md'),
    resolve(skillRoot, 'references/evidence.md'),
    resolve(evaluationRoot, scenario.file),
  ])
  const publicPackages = new Map((sourceMap?.publicPackages ?? []).map(item => [item.name, item.repositoryPath]))

  for (const workflow of scenario.workflows ?? []) {
    const entry = sourceMap?.workflows?.[workflow]
    if (!entry) {
      failures.push(`${scenario.id} 缺少工作流 ${workflow}`)
      continue
    }
    paths.add(resolve(skillRoot, entry.playbook))
    const resourcePath = resolve(skillRoot, entry.resources)
    paths.add(resourcePath)
    const resources = readJson(resourcePath, failures)
    for (const type of ['docs', 'examples']) {
      for (const resource of resources?.[type] ?? [])
        paths.add(resolve(repositoryRoot, resource.repositoryPath))
    }
    for (const packageName of resources?.packages ?? []) {
      const manifestPath = publicPackages.get(packageName)
      if (manifestPath)
        paths.add(resolve(repositoryRoot, manifestPath))
      else
        failures.push(`${scenario.id} 无法解析公开 package ${packageName}`)
    }
  }

  const hash = createHash('sha256')
  for (const path of [...paths].sort((left, right) => normalizedRelativePath(repositoryRoot, left).localeCompare(normalizedRelativePath(repositoryRoot, right)))) {
    const source = readText(path, failures)
    hash.update(normalizedRelativePath(repositoryRoot, path))
    hash.update('\0')
    hash.update(source)
    hash.update('\0')
  }
  return `sha256:${hash.digest('hex')}`
}

export function validateResultRecord(record, scenario, expectedDigest, filename, expectedRunner) {
  const failures = []
  if (record?.id !== scenario.id)
    failures.push(`${filename} 的 id 与 manifest 不一致`)
  if (!sameStringList(record?.workflows, scenario.workflows))
    failures.push(`${filename} 的 workflows 与 manifest 不一致`)
  if (record?.status !== 'passed')
    failures.push(`${filename} 尚未通过参考 Agent 评测`)
  if (!isNonEmptyString(record?.executedAt) || Number.isNaN(Date.parse(record.executedAt)))
    failures.push(`${filename} 缺少有效 executedAt`)
  if (!isNonEmptyString(record?.runner?.agent) || !isNonEmptyString(record?.runner?.model))
    failures.push(`${filename} 缺少 runner 信息`)
  else if (expectedRunner && (record.runner.agent !== expectedRunner.agent || record.runner.model !== expectedRunner.model))
    failures.push(`${filename} 与其他结果使用了不同的参考 Agent 或 model`)
  if (!isNonEmptyStringList(record?.evidence) || !isNonEmptyStringList(record?.verification))
    failures.push(`${filename} 缺少 evidence 或 verification`)
  if (record?.inputDigest !== expectedDigest)
    failures.push(`${filename} 的参考 Agent 结果已过期`)
  return failures
}

export function validateResults(manifest, evaluationRoot, options) {
  const { repositoryRoot, sourceMap } = options
  const failures = []
  const resultRoot = resolve(evaluationRoot, 'results')
  const expectedFiles = manifest.scenarios.map(scenario => scenario.result.replace(/^results\//, '')).sort()
  if (JSON.stringify(listMarkdownFiles(resultRoot)) !== JSON.stringify(expectedFiles))
    failures.push('评测结果文件必须与 manifest 完全一致')

  let referenceRunner
  for (const scenario of manifest.scenarios) {
    const filename = scenario.result.replace(/^results\//, '')
    const result = parseMarkdownFrontmatter(readText(resolve(evaluationRoot, scenario.result), failures))
    if (result.error) {
      failures.push(`${filename} ${result.error}`)
      continue
    }
    const expectedDigest = computeScenarioDigest(repositoryRoot, sourceMap, scenario, failures)
    if (!referenceRunner && isNonEmptyString(result.value?.runner?.agent) && isNonEmptyString(result.value?.runner?.model))
      referenceRunner = result.value.runner
    failures.push(...validateResultRecord(result.value, scenario, expectedDigest, filename, referenceRunner))
  }
  return failures
}

export function getEvaluationCount(repositoryRoot) {
  const failures = []
  const manifest = readJson(resolve(repositoryRoot, 'skills/evals/manifest.json'), failures)
  return failures.length === 0 && Array.isArray(manifest?.scenarios) ? manifest.scenarios.length : 0
}

export function validateSkills(repositoryRoot) {
  const failures = []
  const skillRoot = resolve(repositoryRoot, 'skills/dragcraft')
  const evaluationRoot = resolve(repositoryRoot, 'skills/evals')
  const skill = readText(resolve(skillRoot, 'SKILL.md'), failures)
  const skillMetadata = parseMarkdownFrontmatter(skill)
  if (skillMetadata.error) {
    failures.push(`SKILL.md ${skillMetadata.error}`)
  }
  else if (skillMetadata.value.name !== 'dragcraft' || skillMetadata.value['disable-model-invocation'] !== true || !isNonEmptyString(skillMetadata.value.description)) {
    failures.push('SKILL.md metadata 无效')
  }

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
  if (sourceMap?.schemaVersion !== 2 || !isNonEmptyString(documentation?.site) || !isNonEmptyString(documentation?.repository)
    || !isNonEmptyString(documentation?.llmsIndex) || !isNonEmptyString(documentation?.llmsFull) || !isNonEmptyString(documentation?.sourceCheckoutMarker)) {
    failures.push('source map documentation 无效')
  }
  else if (!existsSync(resolve(repositoryRoot, documentation.sourceCheckoutMarker))) {
    failures.push(`source checkout marker 不存在: ${documentation.sourceCheckoutMarker}`)
  }

  const publicPackages = sourceMap?.publicPackages
  const publicPackageNames = Array.isArray(publicPackages) ? publicPackages.map(item => item?.name) : []
  if (JSON.stringify([...publicPackageNames].sort()) !== JSON.stringify([...supportedPublicPackages].sort())) {
    failures.push('source map 的公开 package 列表无效')
  }
  else {
    for (const item of publicPackages) {
      const manifest = readJson(resolve(repositoryRoot, item.repositoryPath ?? ''), failures)
      if (manifest?.name !== item.name)
        failures.push(`公开 package 与 manifest 不一致: ${item.name}`)
    }
  }

  const workflowNames = sourceMap?.workflows && typeof sourceMap.workflows === 'object'
    ? Object.keys(sourceMap.workflows)
    : []
  if (JSON.stringify([...workflowNames].sort()) !== JSON.stringify([...requiredWorkflows].sort())) {
    failures.push('source map 必须定义八个固定工作流')
  }
  else {
    for (const workflow of requiredWorkflows) {
      failures.push(...validateWorkflow(sourceMap.workflows[workflow], workflow, {
        documentation: documentation ?? {},
        publicPackageNames,
        repositoryRoot,
        skill,
        skillRoot,
      }))
    }
  }

  const manifest = readJson(resolve(evaluationRoot, 'manifest.json'), failures)
  if (existsSync(resolve(evaluationRoot, 'results.json')))
    failures.push('评测结果索引已由 manifest.json 取代，必须删除 results.json')
  if (manifest) {
    failures.push(...validateEvaluationManifest(manifest, evaluationRoot, requiredWorkflows))
    if (sourceMap)
      failures.push(...validateResults(manifest, evaluationRoot, { repositoryRoot, sourceMap }))
  }

  const installationCommand = 'npx skills@latest add hackycy/dragcraft'
  const skillsReadme = readText(resolve(repositoryRoot, 'skills/README.md'), failures)
  const aiGuide = readText(resolve(repositoryRoot, 'docs/guide/tools/ai-assisted-development.md'), failures)
  if (!skillsReadme.includes(installationCommand))
    failures.push('skills/README.md 缺少统一安装命令')
  if (!aiGuide.includes(installationCommand))
    failures.push('AI 辅助开发文档缺少统一安装命令')
  const docsConfig = readText(resolve(repositoryRoot, 'docs/.vitepress/config.ts'), failures)
  if (!docsConfig.includes('{ text: \'AI 辅助开发\', link: \'/guide/tools/ai-assisted-development\' }'))
    failures.push('文档侧边栏缺少 AI 辅助开发入口')

  return failures
}
