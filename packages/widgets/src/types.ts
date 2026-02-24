import type { WidgetMeta } from '@dragcraft/core'
import type { Component } from 'vue'

// ──────────────────────────────────────────
// Widget definition
// ──────────────────────────────────────────

/**
 * Complete widget definition combining metadata and Vue component.
 * Used for registering widgets with the engine and renderer.
 */
export interface WidgetDefinition {
  /** Widget metadata for core registry */
  meta: WidgetMeta
  /** Vue component for rendering in canvas */
  component: Component
}

// ──────────────────────────────────────────
// Widget groups
// ──────────────────────────────────────────

/**
 * Built-in widget group names for categorization in material panel.
 */
export type WidgetGroup = 'basic' | 'form'

/**
 * Widget group configuration with localized titles.
 */
export interface WidgetGroupConfig {
  name: WidgetGroup
  title: string
}

// ──────────────────────────────────────────
// Widget type strings
// ──────────────────────────────────────────

/**
 * All supported built-in widget type strings.
 */
export type WidgetType
  // basic group
  = | 'text'
    | 'button'
    | 'image'
    | 'link'
    | 'divider'
  // form group
    | 'form-input'
    | 'form-textarea'
    | 'form-select'
    | 'form-checkbox'
    | 'form-radio'
