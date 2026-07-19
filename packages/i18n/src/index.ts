import type { InjectionKey, Ref } from 'vue'
import { inject, ref } from 'vue'

export interface MessageTree { [key: string]: string | MessageTree }

export type LocaleMessages = Record<string, MessageTree>

export type FlatMessages = Record<string, string>

export interface I18nInstance {
  locale: Ref<string>
  t: (key: string, fallback?: string) => string
  setLocale: (locale: string) => void
  mergeMessages: (locale: string, msgs: MessageTree) => void
}

export const I18N_KEY: InjectionKey<I18nInstance> = Symbol('dc-i18n')

function flatten(tree: MessageTree, prefix = ''): FlatMessages {
  const result: FlatMessages = {}
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string')
      result[path] = value
    else
      Object.assign(result, flatten(value, path))
  }
  return result
}

export function createI18n(
  defaultLocale: string,
  defaultMessages: LocaleMessages = {},
): I18nInstance {
  const locale = ref(defaultLocale)
  const flatStore: Record<string, FlatMessages> = {}

  for (const [currentLocale, tree] of Object.entries(defaultMessages))
    flatStore[currentLocale] = flatten(tree)

  function t(key: string, fallback?: string): string {
    return flatStore[locale.value]?.[key] ?? fallback ?? key
  }

  function setLocale(nextLocale: string): void {
    locale.value = nextLocale
  }

  function mergeMessages(targetLocale: string, tree: MessageTree): void {
    flatStore[targetLocale] = { ...flatStore[targetLocale], ...flatten(tree) }
  }

  return { locale, t, setLocale, mergeMessages }
}

export function useI18n(): I18nInstance {
  const i18n = inject(I18N_KEY)
  if (i18n)
    return i18n

  return {
    locale: ref('zh-CN'),
    t: (key, fallback) => fallback ?? key,
    setLocale: () => {},
    mergeMessages: () => {},
  }
}
