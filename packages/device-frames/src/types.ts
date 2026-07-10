import type { Component, InjectionKey, Ref } from 'vue'

// ──────────────────────────────────────────
// Device type
// ──────────────────────────────────────────

/**
 * Supported device frame identifiers.
 */
export type DeviceType = 'iphone' | 'android' | 'tablet' | 'desktop'

// ──────────────────────────────────────────
// Device preset
// ──────────────────────────────────────────

/**
 * Complete description of a device frame preset.
 */
export interface DevicePreset {
  /** Unique device identifier */
  type: DeviceType
  /** Human-readable label for toolbar display */
  label: string
  /** Optional i18n key resolved by a designer toolbar API. */
  labelKey?: string
  /** Icon character or component for compact toolbar buttons */
  icon: string | Component
  /** Content viewport width in CSS pixels */
  width: number
  /** Content viewport height in CSS pixels */
  height: number
  /** The Vue component rendering the frame chrome */
  frameComponent: Component
}

// ──────────────────────────────────────────
// Device frame context
// ──────────────────────────────────────────

/**
 * Reactive context provided to descendants via provide/inject.
 * Controls which device frame is currently active.
 */
export interface DeviceFrameContext {
  /** Reactive device type ref — mutate this to switch devices */
  currentDevice: Ref<DeviceType>
  /** All registered presets */
  presets: readonly DevicePreset[]
  /** Lookup a preset by type */
  getPreset: (type: DeviceType) => DevicePreset | undefined
  /** Switch to a device type */
  setDevice: (type: DeviceType) => void
}

/**
 * Injection key for the device frame context.
 */
export const DEVICE_FRAME_CONTEXT_KEY: InjectionKey<DeviceFrameContext>
  = Symbol('dc-device-frame')

// ──────────────────────────────────────────
// Setup options
// ──────────────────────────────────────────

/**
 * Options for createDeviceFrameContext.
 */
export interface DeviceFrameOptions {
  /** Initial device to display. Defaults to 'iphone'. */
  initialDevice?: DeviceType
  /** Override or extend the default presets. */
  presets?: DevicePreset[]
}
