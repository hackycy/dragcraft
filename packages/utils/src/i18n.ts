import type { InjectionKey, Ref } from 'vue'
import { inject, ref } from 'vue'

// ──────────────────────────────────────────
// Types
// ──────────────────────────────────────────

/** Nested message tree: leaf values are strings */
export interface MessageTree { [key: string]: string | MessageTree }

/** Locale -> MessageTree mapping */
export type LocaleMessages = Record<string, MessageTree>

/** Flat dot-separated key -> translated string */
export type FlatMessages = Record<string, string>

export interface I18nInstance {
  /** Reactive current locale */
  locale: Ref<string>
  /** Translate a message key. Returns fallback if key is missing. */
  t: (key: string, fallback?: string) => string
  /** Switch locale at runtime */
  setLocale: (locale: string) => void
  /** Merge additional messages into an existing locale */
  mergeMessages: (locale: string, msgs: MessageTree) => void
}

export const I18N_KEY: InjectionKey<I18nInstance> = Symbol('dc-i18n')

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────

function flatten(tree: MessageTree, prefix = ''): FlatMessages {
  const result: FlatMessages = {}
  for (const [k, v] of Object.entries(tree)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (typeof v === 'string') {
      result[key] = v
    }
    else {
      Object.assign(result, flatten(v, key))
    }
  }
  return result
}

// ──────────────────────────────────────────
// Factory
// ──────────────────────────────────────────

/**
 * Create a lightweight i18n instance.
 *
 * @param defaultLocale - Initial locale (e.g. 'zh-CN')
 * @param defaultMessages - Pre-registered messages keyed by locale
 */
export function createI18n(
  defaultLocale: string,
  defaultMessages: LocaleMessages = {},
): I18nInstance {
  const locale = ref(defaultLocale)
  const flatStore: Record<string, FlatMessages> = {}

  for (const [loc, tree] of Object.entries(defaultMessages)) {
    flatStore[loc] = flatten(tree)
  }

  function t(key: string, fallback?: string): string {
    return flatStore[locale.value]?.[key] ?? fallback ?? key
  }

  function setLocale(loc: string) {
    locale.value = loc
  }

  function mergeMessages(loc: string, tree: MessageTree) {
    flatStore[loc] = { ...flatStore[loc], ...flatten(tree) }
  }

  return { locale, t, setLocale, mergeMessages }
}

// ──────────────────────────────────────────
// Composable
// ──────────────────────────────────────────

/**
 * Inject the i18n instance from the component tree.
 * Falls back to a no-op instance that returns the key itself
 * when no provider is present (e.g. standalone renderer usage).
 */
export function useI18n(): I18nInstance {
  const i18n = inject(I18N_KEY)
  if (i18n)
    return i18n

  // Degraded fallback: return key as-is
  return {
    locale: ref('zh-CN'),
    t: (_key, fallback) => fallback ?? _key,
    setLocale: () => {},
    mergeMessages: () => {},
  }
}
