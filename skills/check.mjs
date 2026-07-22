import { resolve } from 'node:path'
import process from 'node:process'
import { expectedEvaluations, validateSkills } from './check-lib.mjs'

const failures = validateSkills(resolve(import.meta.dirname, '..'))
if (failures.length > 0) {
  for (const failure of failures)
    console.error(`skills:check: ${failure}`)
  process.exitCode = 1
}
else {
  process.stdout.write(`skills:check: ${Object.keys(expectedEvaluations).length} 个场景及其 agent 结果有效\n`)
}
