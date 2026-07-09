import type { CoreWidgetMeta } from '@dragcraft/core'
import type { Component } from 'vue'

// ──────────────────────────────────────────
// Widget definition
// ──────────────────────────────────────────

/**
 * Complete widget definition combining metadata and Vue component.
 * Used for registering widgets with the engine and renderer.
 */
export interface WidgetDefinition<Meta extends CoreWidgetMeta = CoreWidgetMeta> {
  /** Widget metadata for core registry */
  meta: Meta
  /** Vue component for rendering in canvas */
  component: Component
}

// ──────────────────────────────────────────
// Widget groups
// ──────────────────────────────────────────

/**
 * Widget group name type.
 * Accepts any string to support custom groups beyond built-in ones.
 */
export type WidgetGroup = string

/**
 * Widget group configuration with localized titles.
 */
export interface WidgetGroupConfig {
  name: string
  title: string
  /** i18n message key for title; overrides `title` when i18n is active */
  titleKey?: string
}
