import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(import.meta.dirname, '..')
const checker = path.join(root, 'scripts/check-obsolete-protocol.mjs')

function runFixture(name) {
  return spawnSync(process.execPath, [checker, '--strict', '--fixture', `scripts/fixtures/${name}`], {
    cwd: root,
    encoding: 'utf8',
  })
}

describe('obsolete protocol checker public-contract fixtures', () => {
  it('rejects obsolete protocol names with stable path, line, and identifier findings', () => {
    const result = runFixture('public-contract-invalid.md')

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('scripts/fixtures/public-contract-invalid.md:1 [G9] obsolete public name ContainerRegionOutlet')
    expect(result.stderr).toContain('scripts/fixtures/public-contract-invalid.md:1 [G9] obsolete protocol DesignerSchema')
    expect(result.stderr).toContain('scripts/fixtures/public-contract-invalid.md:1 [G9] obsolete protocol RendererExtensions')
  })

  it('accepts approved PresentationFrame and private geometry names', () => {
    const result = runFixture('public-contract-valid.md')

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('obsolete protocol denylist valid (0 prohibited findings, 0 permitted local external-runtime findings)')
  })

  it('permits explicitly local external runtime policy while inventorying it', () => {
    const result = spawnSync(process.execPath, [checker, '--inventory', '--fixture', 'examples/guide-project/src/runtime/layout.ts'], {
      cwd: root,
      encoding: 'utf8',
    })

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('[G7] permitted local external runtime policy placement')
  })
})
