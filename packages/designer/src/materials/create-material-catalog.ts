import type {
  ContainerDeclaration,
  JsonObject,
  NodeBundle,
  NodeType,
  SchemaDefinitionSnapshot,
  SchemaTypeDeclaration,
} from '@dragcraft/core'
import type {
  DesignerPresentation,
  InspectorDefinition,
  MaterialAuthoringDefinition,
  MaterialBundleFactory,
  MaterialDefinition,
  MaterialPanelDefinition,
  MaterialPresentationLayout,
} from './types'
import { cloneJsonValue, collectInvalidJsonPaths } from '@dragcraft/core'

export type DesignerConfigurationErrorCode
  = | 'HISTORY_LIMIT_INVALID'
    | 'MATERIAL_AUTHORING_INVALID'
    | 'MATERIAL_CONTAINER_INVALID'
    | 'MATERIAL_HEADLESS_PREVIEW_FORBIDDEN'
    | 'MATERIAL_PRESENTATION_INVALID'
    | 'MATERIAL_SCHEMA_INVALID'
    | 'MATERIAL_TYPE_DUPLICATE'
    | 'MATERIAL_TYPE_INVALID'
    | 'MATERIAL_VISUAL_PREVIEW_MISSING'
    | 'MATERIALS_INVALID'

export class DesignerConfigurationError extends Error {
  readonly code: DesignerConfigurationErrorCode

  constructor(code: DesignerConfigurationErrorCode, materialType: string) {
    super(`${code}: ${materialType}`)
    this.name = 'DesignerConfigurationError'
    this.code = code
  }
}

export interface MaterialCatalog {
  readonly schemaDefinitions: SchemaDefinitionSnapshot
  createBundle: (type: NodeType, createNodeId: () => string) => NodeBundle | undefined
  getAuthoring: (type: NodeType) => Readonly<MaterialAuthoringDefinition> | undefined
  getAllMaterials: () => readonly Readonly<MaterialDefinition>[]
  getMaterial: (type: NodeType) => Readonly<MaterialDefinition> | undefined
  getPresentation: (type: NodeType) => Readonly<DesignerPresentation> | undefined
}

class ImmutableMap<Key, Value> implements ReadonlyMap<Key, Value> {
  readonly #map: Map<Key, Value>

  constructor(entries: Iterable<readonly [Key, Value]>) {
    this.#map = new Map(entries)
    Object.freeze(this)
  }

  get size(): number {
    return this.#map.size
  }

  [Symbol.iterator](): MapIterator<[Key, Value]> {
    return this.#map[Symbol.iterator]()
  }

  entries(): MapIterator<[Key, Value]> {
    return this.#map.entries()
  }

  forEach(callbackfn: (value: Value, key: Key, map: ReadonlyMap<Key, Value>) => void, thisArg?: unknown): void {
    this.#map.forEach((value, key) => callbackfn.call(thisArg, value, key, this))
  }

  get(key: Key): Value | undefined {
    return this.#map.get(key)
  }

  has(key: Key): boolean {
    return this.#map.has(key)
  }

  keys(): MapIterator<Key> {
    return this.#map.keys()
  }

  values(): MapIterator<Value> {
    return this.#map.values()
  }
}

function copyContainerDeclaration(container: ContainerDeclaration): ContainerDeclaration {
  return Object.freeze({
    regions: Object.freeze(container.regions.map((region) => {
      return Object.freeze({
        id: region.id,
        ...(region.accepts
          ? { accepts: Object.freeze({ types: region.accepts.types ? Object.freeze([...region.accepts.types]) : undefined }) }
          : {}),
        ...(region.cardinality
          ? { cardinality: Object.freeze({ ...region.cardinality }) }
          : {}),
      })
    })),
  })
}

function isJsonObject(value: unknown): value is JsonObject {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
    && collectInvalidJsonPaths(value).length === 0
}

function copyConfiguration<Value>(value: Value): Value {
  if (Array.isArray(value))
    return Object.freeze(value.map(item => copyConfiguration(item))) as Value
  if (value === null || typeof value !== 'object')
    return value
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null)
    return value
  return Object.freeze(Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, copyConfiguration(item)]),
  )) as Value
}

function copyPresentation(presentation: DesignerPresentation): DesignerPresentation {
  return Object.freeze({
    ...presentation,
    ...(presentation.layout
      ? { layout: copyConfiguration(presentation.layout) as MaterialPresentationLayout }
      : {}),
  }) as DesignerPresentation
}

export function createMaterialCatalog(materials: readonly MaterialDefinition[]): MaterialCatalog {
  const seenTypes = new Set<string>()
  const schemaEntries: [NodeType, SchemaTypeDeclaration][] = []
  const authoringByType = new Map<NodeType, Readonly<MaterialAuthoringDefinition>>()
  const bundleFactoryByType = new Map<NodeType, MaterialBundleFactory>()
  const bundleDefaultsByType = new Map<NodeType, {
    readonly props: JsonObject
    readonly regionIds: readonly string[]
    readonly style?: JsonObject
  }>()
  const presentationByType = new Map<NodeType, Readonly<DesignerPresentation>>()
  const materialByType = new Map<NodeType, Readonly<MaterialDefinition>>()
  const allMaterials: Readonly<MaterialDefinition>[] = []
  for (const material of materials) {
    if (typeof material.type !== 'string' || material.type.length === 0)
      throw new DesignerConfigurationError('MATERIAL_TYPE_INVALID', String(material.type))
    if (seenTypes.has(material.type))
      throw new DesignerConfigurationError('MATERIAL_TYPE_DUPLICATE', material.type)
    const presentation = material.presentation as unknown
    if (!presentation || typeof presentation !== 'object' || !('kind' in presentation))
      throw new DesignerConfigurationError('MATERIAL_PRESENTATION_INVALID', material.type)
    if (presentation.kind !== 'visual' && presentation.kind !== 'headless')
      throw new DesignerConfigurationError('MATERIAL_PRESENTATION_INVALID', material.type)
    if (presentation.kind === 'visual' && !('preview' in presentation && presentation.preview))
      throw new DesignerConfigurationError('MATERIAL_VISUAL_PREVIEW_MISSING', material.type)
    if (presentation.kind === 'headless' && 'preview' in presentation)
      throw new DesignerConfigurationError('MATERIAL_HEADLESS_PREVIEW_FORBIDDEN', material.type)
    const rawContainer = material.schema?.container as unknown
    if (rawContainer !== undefined
      && (rawContainer === null
        || typeof rawContainer !== 'object'
        || !Array.isArray((rawContainer as { readonly regions?: unknown }).regions))) {
      throw new DesignerConfigurationError('MATERIAL_CONTAINER_INVALID', material.type)
    }
    const container = rawContainer as ContainerDeclaration | undefined
    const regions = container?.regions
    if (regions) {
      const regionIds = regions.map(region => region.id)
      const hasInvalidRegion = regions.some(({ accepts, cardinality, id }) => {
        if (typeof id !== 'string' || id.length === 0)
          return true
        if (accepts?.types?.some(type => typeof type !== 'string' || type.length === 0))
          return true
        if (!cardinality)
          return false
        const { min = 0, max = Number.MAX_SAFE_INTEGER } = cardinality
        if (!Number.isInteger(min) || !Number.isInteger(max) || min < 0 || max < 0)
          return true
        return min > max
      })
      if (regions.length === 0 || new Set(regionIds).size !== regionIds.length || hasInvalidRegion)
        throw new DesignerConfigurationError('MATERIAL_CONTAINER_INVALID', material.type)
    }
    const defaultProps = material.schema?.defaultProps as unknown
    const defaultStyle = material.schema?.defaultStyle as unknown
    if ((defaultProps !== undefined && !isJsonObject(defaultProps))
      || (defaultStyle !== undefined && !isJsonObject(defaultStyle))) {
      throw new DesignerConfigurationError('MATERIAL_SCHEMA_INVALID', material.type)
    }
    const authoring = material.authoring as unknown
    if (authoring !== undefined) {
      if (authoring === null || typeof authoring !== 'object')
        throw new DesignerConfigurationError('MATERIAL_AUTHORING_INVALID', material.type)
      const { createBundle, policy } = authoring as {
        readonly createBundle?: unknown
        readonly policy?: unknown
      }
      const validPolicy = policy === undefined
        || (policy !== null
          && typeof policy === 'object'
          && !Array.isArray(policy)
          && Object.values(policy).every((rule) => {
            return typeof rule === 'function'
              || rule === 'allowed'
              || rule === 'confirmation-required'
              || rule === 'denied'
          }))
      if ((createBundle !== undefined && typeof createBundle !== 'function') || !validPolicy)
        throw new DesignerConfigurationError('MATERIAL_AUTHORING_INVALID', material.type)
    }
    seenTypes.add(material.type)
    schemaEntries.push([material.type, Object.freeze({
      ...(container
        ? { container: copyContainerDeclaration(container) }
        : {}),
    })])
    bundleDefaultsByType.set(material.type, Object.freeze({
      props: cloneJsonValue(material.schema?.defaultProps ?? {}) as JsonObject,
      regionIds: Object.freeze(container?.regions.map(region => region.id) ?? []),
      ...(material.schema?.defaultStyle
        ? { style: cloneJsonValue(material.schema.defaultStyle) as JsonObject }
        : {}),
    }))
    if (material.authoring) {
      authoringByType.set(material.type, Object.freeze({
        ...material.authoring,
        ...(material.authoring.policy
          ? { policy: Object.freeze({ ...material.authoring.policy }) }
          : {}),
      }))
    }
    if (material.authoring?.createBundle)
      bundleFactoryByType.set(material.type, material.authoring.createBundle)
    presentationByType.set(material.type, copyPresentation(material.presentation))
    const materialSnapshot = Object.freeze({
      type: material.type,
      ...(material.schema
        ? {
            schema: Object.freeze({
              ...(container ? { container: copyContainerDeclaration(container) } : {}),
              ...(material.schema.defaultProps
                ? { defaultProps: cloneJsonValue(material.schema.defaultProps) as JsonObject }
                : {}),
              ...(material.schema.defaultStyle
                ? { defaultStyle: cloneJsonValue(material.schema.defaultStyle) as JsonObject }
                : {}),
            }),
          }
        : {}),
      ...(material.authoring
        ? {
            authoring: Object.freeze({
              ...material.authoring,
              ...(material.authoring.policy
                ? { policy: Object.freeze({ ...material.authoring.policy }) }
                : {}),
            }),
          }
        : {}),
      ...(material.inspector
        ? { inspector: copyConfiguration(material.inspector) as InspectorDefinition }
        : {}),
      ...(material.panel
        ? { panel: copyConfiguration(material.panel) as MaterialPanelDefinition }
        : {}),
      presentation: copyPresentation(material.presentation),
    })
    materialByType.set(material.type, materialSnapshot)
    allMaterials.push(materialSnapshot)
  }

  const schemaDefinitions = Object.freeze({
    revision: 1,
    types: new ImmutableMap(schemaEntries),
  })
  const materialsSnapshot = Object.freeze([...allMaterials])

  return Object.freeze({
    schemaDefinitions,
    createBundle(type: NodeType, createNodeId: () => string): NodeBundle | undefined {
      const defaults = bundleDefaultsByType.get(type)
      if (!defaults)
        return undefined
      const customFactory = bundleFactoryByType.get(type)
      if (customFactory) {
        return customFactory(Object.freeze({
          createNodeId,
          defaultProps: cloneJsonValue(defaults.props) as JsonObject,
          ...(defaults.style
            ? { defaultStyle: cloneJsonValue(defaults.style) as JsonObject }
            : {}),
          type,
        }))
      }
      const id = createNodeId()
      return {
        entryId: id,
        nodes: [{
          id,
          type,
          props: cloneJsonValue(defaults.props) as JsonObject,
          ...(defaults.style
            ? { style: cloneJsonValue(defaults.style) as JsonObject }
            : {}),
        }],
        containers: defaults.regionIds.length > 0
          ? {
              [id]: {
                regions: Object.fromEntries(defaults.regionIds.map(regionId => [regionId, []])),
              },
            }
          : {},
      }
    },
    getAuthoring: (type: NodeType) => authoringByType.get(type),
    getAllMaterials: () => materialsSnapshot,
    getMaterial: (type: NodeType) => materialByType.get(type),
    getPresentation: (type: NodeType) => presentationByType.get(type),
  })
}
