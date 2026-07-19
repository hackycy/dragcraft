import { describe, expect, it } from 'vitest'
import { createI18n } from './index'

describe('createI18n', () => {
  it('resolves nested messages, fallbacks, locale changes, and runtime merges', () => {
    const i18n = createI18n('zh-CN', {
      'zh-CN': { common: { save: '保存' } },
    })

    expect(i18n.t('common.save')).toBe('保存')
    expect(i18n.t('common.cancel', '取消')).toBe('取消')

    i18n.mergeMessages('en', { common: { save: 'Save' } })
    i18n.setLocale('en')

    expect(i18n.locale.value).toBe('en')
    expect(i18n.t('common.save')).toBe('Save')
  })
})
