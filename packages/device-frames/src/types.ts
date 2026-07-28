import type { Component } from 'vue'

export interface DeviceFrameViewport {
  readonly width: number
  readonly height: number
}

export interface DeviceFrameGroup {
  readonly id: string
  readonly label: string
  readonly labelKey?: string
}

/** Stable, stateless metadata for one Container Shell. IDs are open strings. */
export interface DeviceFrameDefinition {
  readonly id: string
  readonly label: string
  readonly labelKey?: string
  readonly icon?: string | Component
  readonly group?: DeviceFrameGroup
  readonly viewport: DeviceFrameViewport
  readonly containerShell: Component
}

export type DeviceFrameTranslate = (key: string, fallback?: string) => string
