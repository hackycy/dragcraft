import type { CoreEngine } from '../engine'

export interface EnginePlugin {
  name: string
  setup: (engine: CoreEngine) => void
}
