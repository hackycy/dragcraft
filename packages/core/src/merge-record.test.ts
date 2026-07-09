import { describe, expect, it } from 'vitest'
import { isPlainRecord, mergeRecord } from './merge-record'

describe('merge-record', () => {
  it('detects only non-array objects as plain records', () => {
    expect(isPlainRecord({})).toBe(true)
    expect(isPlainRecord(Object.create(null))).toBe(true)
    expect(isPlainRecord([])).toBe(false)
    expect(isPlainRecord(null)).toBe(false)
    expect(isPlainRecord('x')).toBe(false)
  })

  it('deep merges nested records and replaces arrays', () => {
    const target: Record<string, unknown> = {
      props: { title: 'Old', tags: ['a'] },
      style: { container: { marginTop: 4 } },
    }

    mergeRecord(target, {
      props: { tags: ['b'] },
      style: { container: { marginBottom: 8 } },
    })

    expect(target).toEqual({
      props: { title: 'Old', tags: ['b'] },
      style: { container: { marginTop: 4, marginBottom: 8 } },
    })
  })
})
