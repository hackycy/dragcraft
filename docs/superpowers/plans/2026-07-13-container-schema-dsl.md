# External Container Schema DSL Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add externally implemented container materials with schema-owned regions, material-owned variants and geometry, ownership-aware commands, and designer drag/drop support without adding any built-in layout semantics.

**Architecture:** Keep page projection (`flow/chrome/layer`) root-only and add a shallow container ownership tree at `SchemaNode.container.regions`. Core owns validation, placement decisions, commands, history, and plans; Renderer exposes region outlets; Designer routes UI interactions into Core destinations. External materials own all layout DOM, CSS, responsive behavior, variants, and insertion-index geometry.

**Tech Stack:** TypeScript, Vue 3 render functions and provide/inject, Vitest with happy-dom, pnpm workspaces, ESLint, tsdown.

## Global Constraints

- The framework must not implement or persist flex, grid, direction, track, breakpoint, or irregular-layout geometry.
- Container materials are root children and may contain ordinary widgets only; container nesting is rejected.
- Container regions and variants come from the external material registration protocol.
- Schema remains at its current version because the architecture has not been stably released.
- Region arrays are the only persisted ordering source for container children.
- All structural writes go through Core commands and return structured success or rejection results.
- Variant migration, placement predicates, and initial-state factories are synchronous and pure.
- Existing non-container schema, root `flow/chrome/layer`, sortable locks, history, and device-frame behavior must remain compatible.
- Do not add runtime dependencies.

**Design reference:** `docs/superpowers/specs/2026-07-13-container-schema-dsl-design.md`

---

## File Map

Create these focused units:

- `packages/core/src/container-definition.ts`: validate registered container definitions and reserved identifiers.
- `packages/core/src/container-plan.ts`: resolve a container instance into ordered region entries.
- `packages/core/src/container-placement.ts`: initialize container state and evaluate static/dynamic placement constraints.
- `packages/core/src/schema-index.ts`: index root and region-owned nodes without caching.
- `packages/core/src/schema-validation.ts`: structural and registry-aware validation plus safe empty-region canonicalization.
- `packages/core/src/commands/duplicate-node.ts`: deep-copy a root or region-owned subtree as one command.
- `packages/core/src/commands/change-container-variant.ts`: run material migration and atomically replace container state.
- `packages/renderer/src/container-runtime.ts`: Vue injection context exposed to external container components.
- `packages/renderer/src/components/ContainerRegionOutlet.ts`: framework-owned region rendering and drop-target boundary.
- `packages/renderer/src/components/DefaultContainerFallback.ts`: recovery rendering for unresolved containers.
- `playground/src/components/widgets/container.ts`: external single-region and irregular example materials.

Modify these established units:

- `packages/core/src/types.ts`, `constants.ts`, `registry.ts`, `helpers.ts`, `schema-store.ts`, `command-bus.ts`, `engine.ts`, `index.ts`, and built-in command handlers.
- `packages/renderer/src/types.ts`, `context.ts`, `components/WidgetRenderer.ts`, `components/RootRenderer.ts`, exports, and renderer tests.
- `packages/form-generator/src/types.ts` for the `container` binding scope.
- `packages/designer/src/types.ts`, `factory.ts`, `bindings/field-binding.ts`, `composables/useDragDrop.ts`, `composables/usePropertyBinding.ts`, `components/DcDesigner.ts`, `components/DcCanvas.ts`, and `components/DcStructurePanel.ts`.
- `packages/widgets/src/helpers.ts`, `index.ts`, and tests for typed container-definition helpers.
- `packages/themes/src/components/canvas.css` and `structure-panel.css` for interaction states only.
- Playground registration, styles, messages, and one template for end-to-end proof.
- `.github/architecture/02-schema-and-core.md`, `03-designer-and-renderer.md`, `05-widgets-fields-and-utils.md`, `08-layout-system.md`, and public reference docs.

---

### Task 1: Define And Validate The Container Registration Contract

**Files:**
- Create: `packages/core/src/container-definition.ts`
- Create: `packages/core/src/container-definition.test.ts`
- Modify: `packages/core/src/types.ts`
- Modify: `packages/core/src/registry.ts`
- Modify: `packages/core/src/registry.test.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Consumes: existing `SchemaNode`, `DesignerSchema`, `CoreWidgetMeta`, and `CreationBlockReason` types.
- Produces: `ContainerState`, `ContainerDefinition`, `ContainerVariantDefinition`, `ContainerRegionDefinition`, `ContainerRegionConstraints`, `PlacementDecision`, `validateContainerDefinition(definition)`.

- [ ] **Step 1: Write failing definition-validation tests**

```ts
import { describe, expect, it } from 'vitest'
import { validateContainerDefinition } from './container-definition'

const base = {
  defaultVariant: 'single',
  variants: {
    single: { title: 'Single', regions: [{ id: 'default', title: 'Default' }] },
  },
}

describe('validateContainerDefinition', () => {
  it('accepts an external definition without layout semantics', () => {
    expect(validateContainerDefinition(base)).toEqual({ valid: true, errors: [] })
  })

  it.each([
    [{ ...base, defaultVariant: 'missing' }, 'CONTAINER_DEFAULT_VARIANT_MISSING'],
    [{ ...base, variants: { single: { title: 'Single', regions: [{ id: '__proto__', title: 'Bad' }] } } }, 'CONTAINER_REGION_ID_RESERVED'],
    [{ ...base, variants: { single: { title: 'Single', regions: [{ id: 'a', title: 'A' }, { id: 'a', title: 'B' }] } } }, 'CONTAINER_REGION_ID_DUPLICATE'],
    [{ ...base, variants: { single: { title: 'Single', regions: [{ id: 'a', title: 'A', constraints: { minItems: 2, maxItems: 1 } }] } } }, 'CONTAINER_CARDINALITY_INVALID'],
    [{ ...base, variants: { single: { title: 'Single', regions: [{ id: 'a', title: 'A', constraints: { includeTypes: [''] } }] } } }, 'CONTAINER_TYPE_ID_INVALID'],
  ])('rejects invalid definitions', (definition, code) => {
    expect(validateContainerDefinition(definition as never).errors).toContainEqual(expect.objectContaining({ code }))
  })
})
```

- [ ] **Step 2: Run the test and verify the missing module failure**

Run: `pnpm --filter @dragcraft/core exec vitest run src/container-definition.test.ts`

Expected: FAIL because `./container-definition` does not exist.

- [ ] **Step 3: Add the persisted and registration types**

Add these exact public shapes to `packages/core/src/types.ts`:

```ts
export type ContainerVariantId = string
export type ContainerRegionId = string

export interface ContainerState {
  variant: ContainerVariantId
  regions: Record<ContainerRegionId, SchemaNode[]>
}

export interface ContainerRegionConstraints {
  includeTypes?: string[]
  excludeTypes?: string[]
  minItems?: number
  maxItems?: number
}

export interface ContainerRegionDefinition {
  id: ContainerRegionId
  title: string
  titleKey?: string
  constraints?: ContainerRegionConstraints
}

export interface ContainerVariantDefinition {
  title: string
  titleKey?: string
  regions: ContainerRegionDefinition[]
}

export interface PlacementDecision extends CreationBlockReason {
  allowed: boolean
  details?: Record<string, unknown>
}

export interface ContainerDefinition {
  defaultVariant: ContainerVariantId
  variants: Record<ContainerVariantId, ContainerVariantDefinition>
  createInitialState?: (ctx: ContainerInitContext) => ContainerState
  canPlace?: (ctx: ContainerPlacementContext) => PlacementDecision
  migrateVariant?: (ctx: ContainerVariantMigrationContext) => ContainerVariantMigrationResult
}

export interface ContainerInitContext {
  containerNode: Readonly<SchemaNode>
  schema: Readonly<DesignerSchema>
  createNode: (
    type: string,
    overrides?: Partial<Pick<SchemaNode, 'props' | 'style' | 'layout'>>,
  ) => SchemaNode
}

export interface ContainerPlacementContext {
  operation: 'add' | 'move'
  schema: Readonly<DesignerSchema>
  container: Readonly<SchemaNode>
  variant: Readonly<ContainerVariantDefinition>
  region: Readonly<ContainerRegionDefinition>
  child: Readonly<SchemaNode>
  targetIndex: number
}

export interface ContainerVariantMigrationContext {
  schema: Readonly<DesignerSchema>
  container: Readonly<SchemaNode>
  fromVariantId: ContainerVariantId
  toVariantId: ContainerVariantId
  fromVariant: Readonly<ContainerVariantDefinition>
  toVariant: Readonly<ContainerVariantDefinition>
  state: Readonly<ContainerState>
}

export type ContainerVariantMigrationResult =
  | { allowed: true, state: ContainerState }
  | ({ allowed: false } & Omit<PlacementDecision, 'allowed'>)

export type ContainerDefinitionValidationCode
  = | 'CONTAINER_DEFAULT_VARIANT_MISSING'
    | 'CONTAINER_VARIANT_ID_RESERVED'
    | 'CONTAINER_REGION_ID_RESERVED'
    | 'CONTAINER_REGION_ID_DUPLICATE'
    | 'CONTAINER_CARDINALITY_INVALID'
    | 'CONTAINER_TYPE_ID_INVALID'

export interface ContainerDefinitionValidationError {
  code: ContainerDefinitionValidationCode
  path: string
}

export interface ContainerDefinitionValidationResult {
  valid: boolean
  errors: ContainerDefinitionValidationError[]
}
```

Also add `container?: ContainerState` to `SchemaNode` and `container?: ContainerDefinition` to `CoreWidgetMeta`. Export every type above from `packages/core/src/index.ts`; callback inputs are read-only, synchronous values and must never receive the engine.

- [ ] **Step 4: Implement definition validation and registry rejection**

```ts
const RESERVED_IDS = new Set(['__proto__', 'prototype', 'constructor'])

export function validateContainerDefinition(definition: ContainerDefinition): ContainerDefinitionValidationResult {
  const errors: ContainerDefinitionValidationError[] = []
  if (!Object.hasOwn(definition.variants, definition.defaultVariant))
    errors.push({ code: 'CONTAINER_DEFAULT_VARIANT_MISSING', path: 'defaultVariant' })

  for (const [variantId, variant] of Object.entries(definition.variants)) {
    if (!variantId || RESERVED_IDS.has(variantId))
      errors.push({ code: 'CONTAINER_VARIANT_ID_RESERVED', path: `variants.${variantId}` })
    const seen = new Set<string>()
    for (const [index, region] of variant.regions.entries()) {
      const path = `variants.${variantId}.regions.${index}`
      if (!region.id || RESERVED_IDS.has(region.id))
        errors.push({ code: 'CONTAINER_REGION_ID_RESERVED', path })
      if (seen.has(region.id))
        errors.push({ code: 'CONTAINER_REGION_ID_DUPLICATE', path })
      seen.add(region.id)
      const { minItems = 0, maxItems = Number.POSITIVE_INFINITY } = region.constraints ?? {}
      if (!Number.isInteger(minItems) || minItems < 0 || !Number.isInteger(maxItems) || maxItems < 0 || minItems > maxItems)
        errors.push({ code: 'CONTAINER_CARDINALITY_INVALID', path: `${path}.constraints` })
      for (const [listName, typeIds] of Object.entries({
        includeTypes: region.constraints?.includeTypes ?? [],
        excludeTypes: region.constraints?.excludeTypes ?? [],
      })) {
        if (typeIds.some(typeId => typeof typeId !== 'string' || typeId.length === 0))
          errors.push({ code: 'CONTAINER_TYPE_ID_INVALID', path: `${path}.constraints.${listName}` })
      }
    }
  }
  return { valid: errors.length === 0, errors }
}
```

In `registerWidget`, call this validator before writing to the map. Log one warning containing the widget type and validation codes, then return without registration when invalid.

- [ ] **Step 5: Verify contract and registry tests pass**

Run: `pnpm --filter @dragcraft/core exec vitest run src/container-definition.test.ts src/registry.test.ts`

Expected: PASS with all container-definition and existing registry tests green.

- [ ] **Step 6: Commit the registration contract**

```bash
git add packages/core/src/types.ts packages/core/src/container-definition.ts packages/core/src/container-definition.test.ts packages/core/src/registry.ts packages/core/src/registry.test.ts packages/core/src/index.ts
git commit -m "feat(core): define container material contract"
```

---

### Task 2: Index And Validate Shallow Container Ownership

**Files:**
- Create: `packages/core/src/schema-index.ts`
- Create: `packages/core/src/schema-index.test.ts`
- Create: `packages/core/src/schema-validation.ts`
- Create: `packages/core/src/schema-validation.test.ts`
- Modify: `packages/core/src/helpers.ts`
- Modify: `packages/core/src/helpers.test.ts`
- Modify: `packages/core/src/schema-store.ts`
- Modify: `packages/core/src/types.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Consumes: `SchemaNode.container`, `RegistryInstance`, and validated container definitions from Task 1.
- Produces: `buildSchemaIndex(schema): SchemaIndexResult`, `findIndexedNode(index, id): IndexedNodeLocation | undefined`, `validateSchema(schema, registry): SchemaValidationResult`, and the exact result types below.

```ts
export type SchemaDiagnosticSeverity = 'warning' | 'error'

export interface SchemaDiagnostic {
  code: string
  severity: SchemaDiagnosticSeverity
  nodeId?: string
  ownerId?: string
  regionId?: string
  path?: string
  details?: Record<string, unknown>
}

export interface IndexedNodeLocation {
  node: SchemaNode
  owner: 'root' | string
  regionId?: string
  index: number
  depth: 1 | 2
}

export interface SchemaIndexResult {
  index: Map<string, IndexedNodeLocation>
  diagnostics: SchemaDiagnostic[]
}

export interface SchemaValidationResult {
  valid: boolean
  schema: DesignerSchema
  diagnostics: SchemaDiagnostic[]
}

export function findIndexedNode(
  result: SchemaIndexResult,
  nodeId: string,
): IndexedNodeLocation | undefined {
  return result.index.get(nodeId)
}
```

- [ ] **Step 1: Write failing index tests for root and region children**

```ts
it('indexes root and region-owned nodes with one global ID namespace', () => {
  const schema = makeSchema([
    makeNode('plain'),
    makeContainer('layout', { left: [makeNode('nested')] }),
  ])
  const result = buildSchemaIndex(schema)
  expect(result.diagnostics).toEqual([])
  expect(result.index.get('plain')).toMatchObject({ owner: 'root', index: 0, depth: 1 })
  expect(result.index.get('nested')).toMatchObject({ owner: 'layout', regionId: 'left', index: 0, depth: 2 })
})

it('reports duplicate IDs and nested containers', () => {
  const nestedContainer = makeContainer('nested-layout', { default: [] })
  const schema = makeSchema([makeContainer('layout', { left: [makeNode('dup'), makeNode('dup'), nestedContainer] })])
  expect(buildSchemaIndex(schema).diagnostics.map(item => item.code)).toEqual(expect.arrayContaining([
    'SCHEMA_NODE_ID_DUPLICATE',
    'SCHEMA_CONTAINER_NESTED',
  ]))
})
```

- [ ] **Step 2: Run the index test and verify it fails**

Run: `pnpm --filter @dragcraft/core exec vitest run src/schema-index.test.ts`

Expected: FAIL because `buildSchemaIndex` is not exported.

- [ ] **Step 3: Implement a non-cached index builder**

```ts
export function buildSchemaIndex(schema: DesignerSchema): SchemaIndexResult {
  const index = new Map<string, IndexedNodeLocation>()
  const diagnostics: SchemaDiagnostic[] = []

  const add = (node: SchemaNode, location: Omit<IndexedNodeLocation, 'node'>) => {
    if (index.has(node.id))
      diagnostics.push({ code: 'SCHEMA_NODE_ID_DUPLICATE', severity: 'error', nodeId: node.id })
    else
      index.set(node.id, { node, ...location })
  }

  for (const [rootIndex, node] of (schema.root.children ?? []).entries()) {
    add(node, { owner: 'root', index: rootIndex, depth: 1 })
    for (const [regionId, children] of Object.entries(node.container?.regions ?? {})) {
      for (const [childIndex, child] of children.entries()) {
        add(child, { owner: node.id, regionId, index: childIndex, depth: 2 })
        if (child.container)
          diagnostics.push({ code: 'SCHEMA_CONTAINER_NESTED', severity: 'error', nodeId: child.id, ownerId: node.id, regionId })
      }
    }
  }
  return { index, diagnostics }
}
```

Replace helper/store lookup bodies with the index-backed forms below; engine state continues to delegate to `store.getNodeById`:

```ts
export function findNodeById(root: SchemaNode, id: string): SchemaNode | null {
  if (root.id === id)
    return root
  const schema: DesignerSchema = { version: '', globalConfig: {}, root }
  return buildSchemaIndex(schema).index.get(id)?.node ?? null
}

export function findParentNode(
  root: SchemaNode,
  targetId: string,
): { parent: SchemaNode, regionId?: string, index: number } | null {
  const schema: DesignerSchema = { version: '', globalConfig: {}, root }
  const indexed = buildSchemaIndex(schema)
  const location = indexed.index.get(targetId)
  if (!location)
    return null
  if (location.owner === 'root')
    return { parent: root, index: location.index }
  const parent = indexed.index.get(location.owner)?.node
  return parent && location.regionId
    ? { parent, regionId: location.regionId, index: location.index }
    : null
}

// schema-store.ts
function getNodeById(id: string): SchemaNode | null {
  if (schema.value.root.id === id)
    return schema.value.root
  return buildSchemaIndex(schema.value).index.get(id)?.node ?? null
}
```

- [ ] **Step 4: Write failing registry-aware schema validation tests**

```ts
it('canonicalizes only missing empty regions', () => {
  const registry = makeRegistryWithSplitContainer()
  const schema = makeSchema([makeContainer('layout', { left: [] }, 'split', 'split-layout')])
  const result = validateSchema(schema, registry)
  expect(result.valid).toBe(true)
  expect(result.schema.root.children![0].container!.regions).toEqual({ left: [], right: [] })
})

it('preserves unresolved containers as warnings and rejects capability mismatches', () => {
  const unresolved = validateSchema(makeSchema([makeContainer('x', { custom: [makeNode('a')] }, 'v', 'missing-layout')]), createRegistry())
  expect(unresolved.valid).toBe(true)
  expect(unresolved.diagnostics).toContainEqual(expect.objectContaining({ code: 'UNRESOLVED_CONTAINER_TYPE', severity: 'warning' }))

  const registry = createRegistry()
  registry.registerWidget(makeMeta('ordinary'))
  const mismatch = validateSchema(makeSchema([makeContainer('x', { custom: [] }, 'v', 'ordinary')]), registry)
  expect(mismatch.valid).toBe(false)
  expect(mismatch.diagnostics).toContainEqual(expect.objectContaining({ code: 'CONTAINER_CAPABILITY_MISMATCH' }))
})
```

- [ ] **Step 5: Implement structural and registry-aware validation**

```ts
export function validateSchema(input: DesignerSchema, registry: RegistryInstance): SchemaValidationResult {
  const schema = cloneSchema(input)
  const indexed = buildSchemaIndex(schema)
  const diagnostics = [...indexed.diagnostics]

  for (const node of schema.root.children ?? []) {
    for (const [regionId, children] of Object.entries(node.container?.regions ?? {})) {
      for (const child of children) {
        if (registry.getWidget(child.type)?.container && !child.container) {
          diagnostics.push({
            code: 'SCHEMA_CONTAINER_NESTED',
            severity: 'error',
            nodeId: child.id,
            ownerId: node.id,
            regionId,
          })
        }
        if (child.layout?.placement !== undefined || child.layout?.order !== undefined) {
          diagnostics.push({
            code: 'CONTAINER_CHILD_PAGE_LAYOUT_FORBIDDEN',
            severity: 'error',
            nodeId: child.id,
            ownerId: node.id,
            regionId,
          })
        }
      }
    }
    const meta = registry.getWidget(node.type)
    if (node.container && !meta) {
      diagnostics.push({ code: 'UNRESOLVED_CONTAINER_TYPE', severity: 'warning', nodeId: node.id })
      continue
    }
    if (node.container && !meta?.container) {
      diagnostics.push({ code: 'CONTAINER_CAPABILITY_MISMATCH', severity: 'error', nodeId: node.id })
      continue
    }
    if (!node.container && meta?.container) {
      diagnostics.push({ code: 'CONTAINER_STATE_MISSING', severity: 'error', nodeId: node.id })
      continue
    }
    if (!node.container || !meta?.container)
      continue

    const variant = meta.container.variants[node.container.variant]
    if (!variant) {
      diagnostics.push({ code: 'CONTAINER_VARIANT_UNKNOWN', severity: 'error', nodeId: node.id })
      continue
    }
    const known = new Set(variant.regions.map(region => region.id))
    for (const regionId of Object.keys(node.container.regions)) {
      if (!known.has(regionId))
        diagnostics.push({ code: 'CONTAINER_REGION_UNKNOWN', severity: 'error', nodeId: node.id, regionId })
    }
    for (const region of variant.regions)
      node.container.regions[region.id] ??= []

    for (const region of variant.regions) {
      const children = node.container.regions[region.id]
      const { minItems = 0, maxItems = Number.POSITIVE_INFINITY } = region.constraints ?? {}
      if (children.length < minItems) {
        diagnostics.push({
          code: 'CONTAINER_REGION_MIN_ITEMS',
          severity: 'error',
          nodeId: node.id,
          regionId: region.id,
          details: { actual: children.length, minItems },
        })
      }
      if (children.length > maxItems) {
        diagnostics.push({
          code: 'CONTAINER_REGION_MAX_ITEMS',
          severity: 'error',
          nodeId: node.id,
          regionId: region.id,
          details: { actual: children.length, maxItems },
        })
      }
      for (const child of children) {
        if (region.constraints?.includeTypes
          && !region.constraints.includeTypes.includes(child.type)) {
          diagnostics.push({
            code: 'CONTAINER_TYPE_NOT_INCLUDED',
            severity: 'error',
            nodeId: child.id,
            ownerId: node.id,
            regionId: region.id,
          })
        }
        if (region.constraints?.excludeTypes?.includes(child.type)) {
          diagnostics.push({
            code: 'CONTAINER_TYPE_EXCLUDED',
            severity: 'error',
            nodeId: child.id,
            ownerId: node.id,
            regionId: region.id,
          })
        }
      }
    }
  }

  return {
    valid: diagnostics.every(item => item.severity !== 'error'),
    schema,
    diagnostics,
  }
}
```

Do not remove unknown regions or move nodes during validation. Missing declared regions are the only canonicalization performed on the cloned schema.

- [ ] **Step 6: Run index, validation, helper, and store tests**

Run: `pnpm --filter @dragcraft/core exec vitest run src/schema-index.test.ts src/schema-validation.test.ts src/helpers.test.ts src/schema-store.test.ts`

Expected: PASS; existing flat helper behavior remains green and nested nodes are discoverable.

- [ ] **Step 7: Commit ownership indexing and validation**

```bash
git add packages/core/src/schema-index.ts packages/core/src/schema-index.test.ts packages/core/src/schema-validation.ts packages/core/src/schema-validation.test.ts packages/core/src/helpers.ts packages/core/src/helpers.test.ts packages/core/src/schema-store.ts packages/core/src/types.ts packages/core/src/index.ts
git commit -m "feat(core): validate container ownership trees"
```

---

### Task 3: Build Container Plans And Placement Decisions

**Files:**
- Create: `packages/core/src/container-plan.ts`
- Create: `packages/core/src/container-plan.test.ts`
- Create: `packages/core/src/container-placement.ts`
- Create: `packages/core/src/container-placement.test.ts`
- Modify: `packages/core/src/types.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Consumes: resolved container definitions and `SchemaIndexResult` from Tasks 1-2.
- Produces: the exact projection, initialization, and placement types and functions below.

```ts
export interface ContainerPlanRegion {
  definition: ContainerRegionDefinition
  nodes: SchemaNode[]
  isEmpty: boolean
}

export interface ContainerPlan {
  containerId: string
  variant: ContainerVariantDefinition
  regions: ContainerPlanRegion[]
}

export type ContainerPlanResult =
  | { ok: true, plan: ContainerPlan }
  | { ok: false, code: 'CONTAINER_UNRESOLVED' | 'CONTAINER_VARIANT_UNKNOWN', containerId: string }

export type CreateRegisteredNode = ContainerInitContext['createNode']

export type ContainerStateCreationResult =
  | { ok: true, state: ContainerState }
  | { ok: false, code: string, message?: string, details?: Record<string, unknown> }

export interface ResolvePlacementContext {
  definition: ContainerDefinition
  region: ContainerRegionDefinition
  child: SchemaNode
  childHasContainerCapability: boolean
  targetCount: number
  callbackContext: ContainerPlacementContext
}

export function createContainerState(
  node: SchemaNode,
  schema: DesignerSchema,
  registry: RegistryInstance,
  createNode: CreateRegisteredNode,
): ContainerStateCreationResult

export function createContainerPlan(
  node: SchemaNode,
  registry: RegistryInstance,
): ContainerPlanResult

export function resolvePlacementDecision(
  ctx: ResolvePlacementContext,
): PlacementDecision

export function createRegisteredNode(
  registry: RegistryInstance,
  createId?: () => string,
): CreateRegisteredNode
```

- [ ] **Step 1: Write failing plan and placement tests**

```ts
function makePlacementContext(options: {
  child?: SchemaNode
  canPlace?: ContainerDefinition['canPlace']
} = {}): ResolvePlacementContext {
  const container = makeContainer('layout', { left: [] })
  const child = options.child ?? makeNode('child', 'text')
  const region: ContainerRegionDefinition = {
    id: 'left',
    title: 'Left',
    constraints: { excludeTypes: ['blocked'] },
  }
  const variant: ContainerVariantDefinition = { title: 'Split', regions: [region] }
  const definition: ContainerDefinition = {
    defaultVariant: 'split',
    variants: { split: variant },
    canPlace: options.canPlace,
  }
  return {
    definition,
    region,
    child,
    childHasContainerCapability: Boolean(child.container),
    targetCount: 0,
    callbackContext: {
      operation: 'add',
      schema: makeSchema([container]),
      container,
      variant,
      region,
      child,
      targetIndex: 0,
    },
  }
}

it('projects schema regions in registration order without geometry', () => {
  const result = createContainerPlan(makeContainer('layout', { right: [makeNode('b')], left: [makeNode('a')] }), makeSplitRegistry())
  expect(result.ok).toBe(true)
  if (!result.ok)
    throw new Error(result.code)
  expect(result.plan.regions.map(region => region.definition.id)).toEqual(['left', 'right'])
  expect(result.plan.regions.map(region => region.nodes.map(node => node.id))).toEqual([['a'], ['b']])
})

it.each([
  ['nested container', makeContainer('child', { default: [] }), 'CONTAINER_NESTING_FORBIDDEN'],
  ['excluded type', makeNode('child', 'blocked'), 'CONTAINER_TYPE_EXCLUDED'],
])('rejects %s before calling the material predicate', (_label, child, code) => {
  const predicate = vi.fn(() => ({ allowed: true }))
  const result = resolvePlacementDecision(makePlacementContext({ child, canPlace: predicate }))
  expect(result).toMatchObject({ allowed: false, code })
  expect(predicate).not.toHaveBeenCalled()
})

it('turns a throwing predicate into a structured denial', () => {
  const result = resolvePlacementDecision(makePlacementContext({ canPlace: () => { throw new Error('bad material') } }))
  expect(result).toMatchObject({ allowed: false, code: 'CONTAINER_PLACEMENT_PREDICATE_FAILED' })
})
```

- [ ] **Step 2: Run tests and verify missing exports**

Run: `pnpm --filter @dragcraft/core exec vitest run src/container-plan.test.ts src/container-placement.test.ts`

Expected: FAIL because the container projection and placement modules do not exist.

- [ ] **Step 3: Implement ordered plan projection**

```ts
export function createContainerPlan(node: SchemaNode, registry: RegistryInstance): ContainerPlanResult {
  const definition = registry.getWidget(node.type)?.container
  if (!node.container || !definition)
    return { ok: false, code: 'CONTAINER_UNRESOLVED', containerId: node.id }
  const variant = definition.variants[node.container.variant]
  if (!variant)
    return { ok: false, code: 'CONTAINER_VARIANT_UNKNOWN', containerId: node.id }
  return {
    ok: true,
    plan: {
      containerId: node.id,
      variant,
      regions: variant.regions.map(region => ({
        definition: region,
        nodes: node.container!.regions[region.id] ?? [],
        isEmpty: (node.container!.regions[region.id]?.length ?? 0) === 0,
      })),
    },
  }
}
```

- [ ] **Step 4: Implement initialization and layered placement checks**

```ts
export function resolvePlacementDecision(ctx: ResolvePlacementContext): PlacementDecision {
  if (ctx.child.container || ctx.childHasContainerCapability)
    return { allowed: false, code: 'CONTAINER_NESTING_FORBIDDEN' }

  const constraints = ctx.region.constraints ?? {}
  if (constraints.includeTypes && !constraints.includeTypes.includes(ctx.child.type))
    return { allowed: false, code: 'CONTAINER_TYPE_NOT_INCLUDED' }
  if (constraints.excludeTypes?.includes(ctx.child.type))
    return { allowed: false, code: 'CONTAINER_TYPE_EXCLUDED' }
  if (ctx.targetCount + 1 > (constraints.maxItems ?? Number.POSITIVE_INFINITY))
    return { allowed: false, code: 'CONTAINER_REGION_MAX_ITEMS' }

  try {
    const decision = ctx.definition.canPlace?.(ctx.callbackContext) ?? { allowed: true }
    if (!decision || typeof decision.allowed !== 'boolean') {
      return {
        allowed: false,
        code: 'CONTAINER_PLACEMENT_PREDICATE_INVALID',
        details: {
          nodeId: ctx.child.id,
          containerId: ctx.callbackContext.container.id,
          regionId: ctx.region.id,
        },
      }
    }
    return decision
  }
  catch (error) {
    return {
      allowed: false,
      code: 'CONTAINER_PLACEMENT_PREDICATE_FAILED',
      message: error instanceof Error ? error.message : String(error),
      details: {
        nodeId: ctx.child.id,
        containerId: ctx.callbackContext.container.id,
        regionId: ctx.region.id,
      },
    }
  }
}

export function createContainerState(
  node: SchemaNode,
  schema: DesignerSchema,
  registry: RegistryInstance,
  createNode: CreateRegisteredNode,
): ContainerStateCreationResult {
  const definition = registry.getWidget(node.type)?.container
  if (!definition)
    return { ok: false, code: 'CONTAINER_DEFINITION_MISSING' }
  const variant = definition.variants[definition.defaultVariant]
  if (!variant)
    return { ok: false, code: 'CONTAINER_DEFAULT_VARIANT_MISSING' }

  const emptyState: ContainerState = {
    variant: definition.defaultVariant,
    regions: Object.fromEntries(variant.regions.map(region => [region.id, []])),
  }
  let state = emptyState
  try {
    state = cloneDeep(definition.createInitialState?.({
      containerNode: cloneDeep(node),
      schema: cloneSchema(schema),
      createNode,
    }) ?? emptyState)
  }
  catch (error) {
    return {
      ok: false,
      code: 'CONTAINER_INITIAL_STATE_FAILED',
      message: error instanceof Error ? error.message : String(error),
      details: { nodeId: node.id, containerId: node.id },
    }
  }

  const candidateNode = cloneDeep(node)
  candidateNode.container = state
  const candidate = cloneSchema(schema)
  candidate.root.children ??= []
  candidate.root.children.push(candidateNode)
  const validation = validateSchema(candidate, registry)
  const ownDiagnostics = validation.diagnostics.filter(item => item.nodeId === node.id || item.ownerId === node.id)
  if (ownDiagnostics.some(item => item.severity === 'error')) {
    return {
      ok: false,
      code: 'CONTAINER_INITIAL_STATE_INVALID',
      details: { diagnostics: ownDiagnostics },
    }
  }
  return { ok: true, state: cloneDeep(state) }
}

export function createRegisteredNode(
  registry: RegistryInstance,
  createId: () => string = generateShortId,
): CreateRegisteredNode {
  return (type, overrides = {}) => {
    const meta = registry.getWidget(type)
    if (!meta)
      throw new Error(`Cannot initialize unregistered widget type: ${type}`)
    const layout = overrides.layout !== undefined
      ? cloneDeep(overrides.layout)
      : cloneDeep(meta.defaultLayout)
    if (layout) {
      delete layout.placement
      delete layout.order
    }
    return {
      id: createId(),
      type,
      props: { ...cloneDeep(meta.defaultProps), ...cloneDeep(overrides.props ?? {}) },
      style: overrides.style !== undefined
        ? cloneDeep(overrides.style)
        : cloneDeep(meta.defaultStyle),
      layout,
    }
  }
}
```

The initialization callback receives clones, its output is cloned again, and only the candidate container subtree's validation errors block initialization.

- [ ] **Step 5: Run Core container service tests**

Run: `pnpm --filter @dragcraft/core exec vitest run src/container-plan.test.ts src/container-placement.test.ts src/schema-validation.test.ts`

Expected: PASS, including static-rule precedence and callback-exception cases.

- [ ] **Step 6: Commit container services**

```bash
git add packages/core/src/container-plan.ts packages/core/src/container-plan.test.ts packages/core/src/container-placement.ts packages/core/src/container-placement.test.ts packages/core/src/types.ts packages/core/src/index.ts
git commit -m "feat(core): project and validate container regions"
```

---

### Task 4: Return Structured Command Results

**Files:**
- Modify: `packages/core/src/types.ts`
- Modify: `packages/core/src/command-bus.ts`
- Modify: `packages/core/src/command-bus.test.ts`
- Modify: `packages/core/src/engine.ts`
- Modify: `packages/core/src/engine.test.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Consumes: existing command snapshot/rollback behavior.
- Produces: `CommandExecutionResult`, `commandFailure(code, reason?)`, `engine.execute(): CommandExecutionResult`; successful handlers may override the emitted command-specific event payload with resolved ownership data.

- [ ] **Step 1: Replace boolean-only cancellation tests with structured-result tests**

```ts
it('returns a structured failure and leaves history and events untouched', () => {
  const { commandBus, eventHub, history, store } = setup(makeSchema([makeNode('a')]))
  const changed = vi.fn()
  eventHub.on(EventName.SCHEMA_CHANGED, changed)
  commandBus.registerHandler('DENY', ({ store }) => {
    store.getRawSchema().root.children = []
    return { ok: false, code: 'DENIED', message: 'No change' }
  })

  expect(commandBus.execute({ type: 'DENY', payload: null })).toEqual({ ok: false, code: 'DENIED', message: 'No change' })
  expect(store.getSchema().root.children).toHaveLength(1)
  expect(history.canUndo()).toBe(false)
  expect(changed).not.toHaveBeenCalled()
})

it('returns a stable failure when a handler throws', () => {
  const { commandBus } = setup()
  commandBus.registerHandler('THROW', () => { throw new Error('boom') })
  expect(commandBus.execute({ type: 'THROW', payload: null })).toMatchObject({ ok: false, code: 'COMMAND_HANDLER_FAILED' })
})
```

- [ ] **Step 2: Run command-bus tests and verify return-type failures**

Run: `pnpm --filter @dragcraft/core exec vitest run src/command-bus.test.ts src/engine.test.ts`

Expected: FAIL because `execute()` currently returns `void`.

- [ ] **Step 3: Implement command results without changing success-event timing**

```ts
export type CommandExecutionResult =
  | { ok: true, eventPayload?: unknown }
  | ({ ok: false, code: string } & CreationBlockReason & { details?: Record<string, unknown> })

export type CommandResult = false | void | CommandExecutionResult

export function commandFailure(
  code: string,
  reason: Omit<Extract<CommandExecutionResult, { ok: false }>, 'ok' | 'code'> = {},
): Extract<CommandExecutionResult, { ok: false }> {
  return { ok: false, code, ...reason }
}

function normalizeHandlerResult(result: CommandResult): CommandExecutionResult {
  if (result === false)
    return { ok: false, code: 'COMMAND_REJECTED' }
  if (result)
    return result
  return { ok: true }
}
```

Implement the `execute` tail exactly so failed handlers restore before history/events, while successful handlers preserve their event payload:

```ts
const normalized = normalizeHandlerResult(result)
if (!normalized.ok) {
  store.setSchema(beforeSnapshot)
  return normalized
}

history.pushSnapshot(command.type, beforeSnapshot)
store.triggerUpdate()
const specificEvent = COMMAND_EVENT_MAP[command.type]
if (specificEvent)
  eventHub.emit(specificEvent, normalized.eventPayload ?? command.payload)
eventHub.emit(EventName.SCHEMA_CHANGED, store.getSchema())
return normalized
```

On an unregistered command return `{ ok: false, code: 'COMMAND_HANDLER_MISSING' }`. On exception, restore the snapshot and return `{ ok: false, code: 'COMMAND_HANDLER_FAILED', message: error instanceof Error ? error.message : String(error) }`.

- [ ] **Step 4: Update engine signatures and existing callers' tests**

Change `DesignerEngine.execute` and `CommandBusInstance.execute` to return `CommandExecutionResult`. Keep existing handlers returning `void` or `false` so this task is behavior-compatible.

- [ ] **Step 5: Run command and engine suites**

Run: `pnpm --filter @dragcraft/core exec vitest run src/command-bus.test.ts src/engine.test.ts`

Expected: PASS; success commands still create one history entry and emit existing events once.

- [ ] **Step 6: Commit structured results**

```bash
git add packages/core/src/types.ts packages/core/src/command-bus.ts packages/core/src/command-bus.test.ts packages/core/src/engine.ts packages/core/src/engine.test.ts packages/core/src/index.ts
git commit -m "feat(core): return structured command results"
```

---

### Task 5: Add And Move Nodes Across Owners

**Files:**
- Modify: `packages/core/src/types.ts`
- Modify: `packages/core/src/layout.ts`
- Modify: `packages/core/src/commands/add-node.ts`
- Modify: `packages/core/src/commands/add-node.test.ts`
- Modify: `packages/core/src/commands/move-node.ts`
- Modify: `packages/core/src/commands/move-node.test.ts`
- Modify: `packages/core/src/index.ts`
- Modify: `packages/renderer/src/action-registry.ts`
- Modify: `packages/renderer/src/action-registry.test.ts`
- Modify: `packages/renderer/src/composables/useNodeActions.ts`
- Modify: `packages/renderer/src/composables/useNodeActions.test.ts`

**Interfaces:**
- Consumes: `SchemaIndexResult`, `createContainerState`, `resolvePlacementDecision`, and structured command results.
- Produces: `NodeDestination`, ownership-aware `AddNodePayload`, ownership-aware `MoveNodePayload`, and deterministic source/destination resolvers used by all structural commands.

- [ ] **Step 1: Write failing cross-owner command tests**

```ts
it('adds a container at root and initializes every default region', () => {
  const { ctx, store } = setupWithSplitMeta()
  const result = addNodeHandler(ctx, {
    node: makeNode('layout', 'split-layout'),
    destination: { kind: 'root', index: 0 },
  })
  expect(result).toEqual({ ok: true })
  expect(store.getRawSchema().root.children![0].container).toEqual({
    variant: 'split',
    regions: { left: [], right: [] },
  })
})

it('moves a root widget into a region and strips page placement', () => {
  const text = makeNode('text', 'text', { placement: { kind: 'flow', region: 'hero' }, order: 3 })
  const { ctx, store } = setupWithSplitMeta([text, makeSplitContainer('layout')])
  const result = moveNodeHandler(ctx, {
    nodeId: 'text',
    destination: { kind: 'container', containerId: 'layout', regionId: 'left', index: 0 },
  })
  expect(result).toEqual({ ok: true })
  expect(store.getRawSchema().root.children!.map(node => node.id)).toEqual(['layout'])
  expect(store.getRawSchema().root.children![0].container!.regions.left[0]).toMatchObject({ id: 'text', layout: {} })
})

it('moves between regions atomically and honors source min plus target max', () => {
  const { ctx, store } = setupWithConstrainedContainer()
  const before = store.getSchema()
  expect(moveNodeHandler(ctx, {
    nodeId: 'required',
    destination: { kind: 'container', containerId: 'layout', regionId: 'full', index: 0 },
  })).toMatchObject({ ok: false, code: 'CONTAINER_REGION_MIN_ITEMS' })
  expect(store.getSchema()).toEqual(before)
})
```

- [ ] **Step 2: Run add/move tests and verify payload failures**

Run: `pnpm --filter @dragcraft/core exec vitest run src/commands/add-node.test.ts src/commands/move-node.test.ts`

Expected: FAIL because payloads do not accept `destination` and commands only mutate root.

- [ ] **Step 3: Add the destination types and child-array resolver**

```ts
export type NodeOwner =
  | { kind: 'root', sortScope?: string }
  | { kind: 'container', containerId: string, regionId: string }

export type NodeDestination =
  | ({ kind: 'root', sortScope?: string } & { index?: number })
  | ({ kind: 'container', containerId: string, regionId: string } & { index?: number })

export interface AddNodePayload {
  node: SchemaNode
  destination?: NodeDestination
}

export interface MoveNodePayload {
  nodeId: string
  destination: NodeDestination
}

export interface ResolvedNodeSource {
  location: IndexedNodeLocation
  children: SchemaNode[]
  index: number
  destination: NodeDestination
}

export interface ResolvedNodeDestination {
  children: SchemaNode[]
  destination: NodeDestination
  container?: SchemaNode
  definition?: ContainerDefinition
  variant?: ContainerVariantDefinition
  region?: ContainerRegionDefinition
}

export type OwnerResolutionResult<T> =
  | { ok: true, value: T }
  | { ok: false, code: string, message?: string }

export function resolveNodeSource(
  schema: DesignerSchema,
  indexed: SchemaIndexResult,
  nodeId: string,
): OwnerResolutionResult<ResolvedNodeSource> {
  const location = indexed.index.get(nodeId)
  if (!location)
    return { ok: false, code: 'NODE_NOT_FOUND' }
  if (location.owner === 'root') {
    return {
      ok: true,
      value: {
        location,
        children: schema.root.children ?? [],
        index: location.index,
        destination: { kind: 'root', index: location.index },
      },
    }
  }
  const owner = indexed.index.get(location.owner)?.node
  const regionId = location.regionId
  const children = regionId ? owner?.container?.regions[regionId] : undefined
  if (!owner || !regionId || !children)
    return { ok: false, code: 'CONTAINER_OWNER_INVALID' }
  return {
    ok: true,
    value: {
      location,
      children,
      index: location.index,
      destination: { kind: 'container', containerId: owner.id, regionId, index: location.index },
    },
  }
}

export function resolveDestination(
  schema: DesignerSchema,
  registry: RegistryInstance,
  destination: NodeDestination,
): OwnerResolutionResult<ResolvedNodeDestination> {
  if (destination.kind === 'root') {
    schema.root.children ??= []
    return { ok: true, value: { children: schema.root.children, destination } }
  }
  const location = buildSchemaIndex(schema).index.get(destination.containerId)
  const container = location?.owner === 'root' ? location.node : undefined
  const definition = container && registry.getWidget(container.type)?.container
  const variant = container?.container && definition?.variants[container.container.variant]
  const region = variant?.regions.find(item => item.id === destination.regionId)
  const children = container?.container?.regions[destination.regionId]
  if (!container || !definition || !variant)
    return { ok: false, code: 'CONTAINER_UNRESOLVED' }
  if (!region || !children)
    return { ok: false, code: 'CONTAINER_REGION_UNKNOWN' }
  return { ok: true, value: { children, destination, container, definition, variant, region } }
}

export function clampInsertIndex(index: number | undefined, length: number): number {
  return Math.max(0, Math.min(index ?? length, length))
}

export function stripPageLayout(node: SchemaNode): SchemaNode {
  const clone = cloneDeep(node)
  if (clone.layout) {
    delete clone.layout.placement
    delete clone.layout.order
  }
  return clone
}
```

Preserve compatibility for existing add calls by defaulting `destination` to `{ kind: 'root' }`. Move callers must migrate in the same implementation branch so there is no ambiguous `index + sortScope + destination` combination.

Extend renderer `NodeActionContext` with `owner: NodeOwner`. In `useNodeActions`, root action contexts use `{ kind: 'root', sortScope: layout.sortScope === false ? undefined : layout.sortScope }`; move-up/down create `MOVE_NODE` with `destination: { ...ctx.owner, index: ctx.index - 1 }` or `index: ctx.index + 2` respectively, because destination indices are pre-removal insertion boundaries. Update both action-registry and composable tests in this task so the Core payload type change never leaves the workspace uncompilable.

Change `canReorder`'s early return to `if (ctx.owner.kind === 'root' && ctx.sortScope === false) return false`; container-owned siblings are ordered by their region array even though they have no page sort scope.

- [ ] **Step 4: Implement ownership-aware add**

For root destinations, retain existing sort-scope and locked-index mapping. For container destinations, resolve the owner and region, initialize a container node when the added node's meta has container capability, evaluate `creatable`, evaluate placement, then splice only after every check succeeds.

```ts
const destination = payload.destination ?? { kind: 'root' as const }
const node = cloneDeep(payload.node)
if (node.container && !meta)
  return { ok: false, code: 'UNRESOLVED_CONTAINER_READ_ONLY' }
if (node.container && !meta?.container)
  return { ok: false, code: 'CONTAINER_CAPABILITY_MISMATCH' }
if (destination.kind === 'container' && meta?.container)
  return { ok: false, code: 'CONTAINER_NESTING_FORBIDDEN' }
if (meta?.container && !node.container) {
  const initialized = createContainerState(node, rawSchema, registry, createRegisteredNode(registry))
  if (!initialized.ok)
    return initialized
  node.container = initialized.state
}
if (node.container) {
  const candidate = cloneSchema(rawSchema)
  candidate.root.children ??= []
  candidate.root.children.push(cloneDeep(node))
  const validation = validateSchema(candidate, registry)
  if (!validation.valid) {
    return {
      ok: false,
      code: 'CONTAINER_STATE_INVALID',
      details: { diagnostics: validation.diagnostics },
    }
  }
}
if (destination.kind === 'container') {
  const targetResult = resolveDestination(rawSchema, registry, destination)
  if (!targetResult.ok)
    return targetResult
  const target = targetResult.value
  if (!target.container || !target.definition || !target.variant || !target.region)
    return { ok: false, code: 'CONTAINER_DESTINATION_REQUIRED' }
  const index = clampInsertIndex(destination.index, target.children.length)
  const decision = resolvePlacementDecision({
    definition: target.definition,
    region: target.region,
    child: node,
    childHasContainerCapability: Boolean(meta?.container),
    targetCount: target.children.length,
    callbackContext: {
      operation: 'add',
      schema: rawSchema,
      container: target.container,
      variant: target.variant,
      region: target.region,
      child: node,
      targetIndex: index,
    },
  })
  if (!decision.allowed)
    return { ok: false, ...decision }
  target.children.splice(index, 0, stripPageLayout(node))
  return {
    ok: true,
    eventPayload: { nodeId: node.id, destination: { ...destination, index } },
  }
}

rawSchema.root.children ??= []
const rootChildren = rawSchema.root.children
const nodeLayout = resolveNodeLayout(node, registry)
const resolvedScope = destination.sortScope
  ?? (nodeLayout.sortScope === false ? undefined : nodeLayout.sortScope)
let resolvedArrayIndex = rootChildren.length
if (destination.index !== undefined && resolvedScope !== undefined) {
  const scopeEntries = getSortScopeEntries(createLayoutPlan(rawSchema, registry), resolvedScope)
  const lockedIndices = getLockedIndicesFromEntries(scopeEntries, registry, rawSchema)
  if (!isInsertAllowed(destination.index, lockedIndices))
    return { ok: false, code: 'SORTABLE_LOCK_VIOLATION' }
  resolvedArrayIndex = getSortableArrayIndexForInsert(
    scopeEntries,
    rootChildren,
    destination.index,
  )
}
else if (destination.index !== undefined) {
  resolvedArrayIndex = clampInsertIndex(destination.index, rootChildren.length)
}
rootChildren.splice(resolvedArrayIndex, 0, node)
return {
  ok: true,
  eventPayload: {
    nodeId: node.id,
    destination: { kind: 'root', sortScope: resolvedScope, index: resolvedArrayIndex },
  },
}
```

The command evaluates the existing `creatable` behavior before this block and returns its structured reason on denial.

- [ ] **Step 5: Implement atomic move across owners**

Resolve source and destination before mutation. Validate source `minItems`, target placement, root sortable locks, and no-op identity. `NodeDestination.index` is a pre-removal insertion boundary; when moving forward in the same array, decrement it exactly once after removal.

```ts
const indexed = buildSchemaIndex(rawSchema)
const sourceResult = resolveNodeSource(rawSchema, indexed, payload.nodeId)
if (!sourceResult.ok)
  return sourceResult
const targetResult = resolveDestination(rawSchema, registry, payload.destination)
if (!targetResult.ok)
  return targetResult
const source = sourceResult.value
const target = targetResult.value
const node = source.location.node
if (node.container && !registry.getWidget(node.type)?.container)
  return { ok: false, code: 'UNRESOLVED_CONTAINER_READ_ONLY' }
const sourceMeta = registry.getWidget(node.type)
const behaviorContext = { node, schema: rawSchema }
if (!resolveBehavior(sourceMeta?.draggable, behaviorContext)
  || !resolveBehavior(sourceMeta?.sortable, behaviorContext)) {
  return { ok: false, code: 'NODE_NOT_MOVABLE' }
}

if (source.destination.kind === 'container') {
  const owner = indexed.index.get(source.destination.containerId)?.node
  const definition = owner && registry.getWidget(owner.type)?.container
  if (!definition)
    return { ok: false, code: 'UNRESOLVED_CONTAINER_READ_ONLY' }
  const variant = owner?.container && definition?.variants[owner.container.variant]
  const region = variant?.regions.find(item => item.id === source.destination.regionId)
  const sameRegion = target.children === source.children
  const minItems = region?.constraints?.minItems ?? 0
  if (!sameRegion && source.children.length - 1 < minItems)
    return { ok: false, code: 'CONTAINER_REGION_MIN_ITEMS' }
}

let requestedIndex = payload.destination.kind === 'container'
  ? clampInsertIndex(payload.destination.index, target.children.length)
  : Math.max(0, payload.destination.index ?? Number.MAX_SAFE_INTEGER)
if (target.container && target.definition && target.variant && target.region) {
  const targetCount = target.children.length - (target.children === source.children ? 1 : 0)
  const decision = resolvePlacementDecision({
    definition: target.definition,
    region: target.region,
    child: node,
    childHasContainerCapability: Boolean(sourceMeta?.container),
    targetCount,
    callbackContext: {
      operation: 'move',
      schema: rawSchema,
      container: target.container,
      variant: target.variant,
      region: target.region,
      child: node,
      targetIndex: requestedIndex,
    },
  })
  if (!decision.allowed)
    return { ok: false, ...decision }
}

if (payload.destination.kind === 'container'
  && source.destination.kind === 'container'
  && target.children === source.children
  && source.index < requestedIndex) {
  requestedIndex -= 1
}
if (payload.destination.kind === 'container'
  && source.destination.kind === 'container'
  && target.children === source.children
  && source.index === requestedIndex) {
  return { ok: false, code: 'MOVE_NOOP' }
}

const sourceScope = source.destination.kind === 'root'
  ? resolveNodeLayout(node, registry).sortScope
  : undefined
const targetScope = payload.destination.kind === 'root'
  ? (payload.destination.sortScope ?? (sourceScope === false ? DEFAULT_SORT_SCOPE : sourceScope ?? resolveNodeLayout(node, registry).sortScope))
  : undefined
const targetEntriesBefore = payload.destination.kind === 'root'
  ? getSortScopeEntries(createLayoutPlan(rawSchema, registry), targetScope || DEFAULT_SORT_SCOPE)
  : []
if (payload.destination.kind === 'root')
  requestedIndex = clampInsertIndex(payload.destination.index, targetEntriesBefore.length)
if (source.destination.kind === 'root') {
  if (sourceScope === false)
    return { ok: false, code: 'NODE_NOT_SORTABLE' }
  const sourceEntries = getSortScopeEntries(createLayoutPlan(rawSchema, registry), sourceScope)
  const sourceScopeIndex = sourceEntries.findIndex(entry => entry.node.id === node.id)
  const sourceLocks = getLockedIndicesFromEntries(sourceEntries, registry, rawSchema)
  if (payload.destination.kind === 'root' && targetScope === sourceScope) {
    if (sourceScopeIndex < requestedIndex)
      requestedIndex -= 1
    if (sourceScopeIndex === requestedIndex)
      return { ok: false, code: 'MOVE_NOOP' }
    if (!isMoveAllowed(sourceScopeIndex, requestedIndex, sourceLocks))
      return { ok: false, code: 'SORTABLE_LOCK_VIOLATION' }
  }
  else if (!isRemoveAllowed(sourceScopeIndex, sourceLocks)) {
    return { ok: false, code: 'SORTABLE_LOCK_VIOLATION' }
  }
}
if (payload.destination.kind === 'root' && targetScope !== sourceScope) {
  const targetLocks = getLockedIndicesFromEntries(targetEntriesBefore, registry, rawSchema)
  if (!isInsertAllowed(requestedIndex, targetLocks))
    return { ok: false, code: 'SORTABLE_LOCK_VIOLATION' }
}

const [removed] = source.children.splice(source.index, 1)
const inserted = payload.destination.kind === 'container' ? stripPageLayout(removed) : cloneDeep(removed)
const insertedIndex = payload.destination.kind === 'root'
  ? getSortableArrayIndexForInsert(
      getSortScopeEntries(createLayoutPlan(rawSchema, registry), targetScope || DEFAULT_SORT_SCOPE),
      target.children,
      requestedIndex,
    )
  : clampInsertIndex(requestedIndex, target.children.length)
target.children.splice(insertedIndex, 0, inserted)
return {
  ok: true,
  eventPayload: {
    nodeId: payload.nodeId,
    source: source.destination,
    destination: { ...payload.destination, index: insertedIndex },
  },
}
```

- [ ] **Step 6: Run add, move, layout, and sortable regressions**

Run: `pnpm --filter @dragcraft/core exec vitest run src/commands/add-node.test.ts src/commands/move-node.test.ts src/layout.test.ts src/sortable.test.ts`

Run: `pnpm --filter @dragcraft/renderer exec vitest run src/action-registry.test.ts src/composables/useNodeActions.test.ts`

Expected: PASS; root chrome/layer ordering and existing locked root positions remain unchanged.

- [ ] **Step 7: Commit cross-owner add and move**

```bash
git add packages/core/src/types.ts packages/core/src/layout.ts packages/core/src/commands/add-node.ts packages/core/src/commands/add-node.test.ts packages/core/src/commands/move-node.ts packages/core/src/commands/move-node.test.ts packages/core/src/index.ts packages/renderer/src/action-registry.ts packages/renderer/src/action-registry.test.ts packages/renderer/src/composables/useNodeActions.ts packages/renderer/src/composables/useNodeActions.test.ts
git commit -m "feat(core): move nodes across container regions"
```

---

### Task 6: Add Cascade Removal, Deep Copy, And Variant Changes

**Files:**
- Create: `packages/core/src/commands/duplicate-node.ts`
- Create: `packages/core/src/commands/duplicate-node.test.ts`
- Create: `packages/core/src/commands/change-container-variant.ts`
- Create: `packages/core/src/commands/change-container-variant.test.ts`
- Modify: `packages/core/src/commands/remove-node.ts`
- Modify: `packages/core/src/commands/remove-node.test.ts`
- Modify: `packages/core/src/helpers.ts`
- Modify: `packages/core/src/helpers.test.ts`
- Modify: `packages/core/src/constants.ts`
- Modify: `packages/core/src/commands/index.ts`
- Modify: `packages/core/src/engine.ts`
- Modify: `packages/core/src/engine.test.ts`
- Modify: `packages/core/src/index.ts`
- Modify: `packages/renderer/src/action-registry.ts`
- Modify: `packages/renderer/src/action-registry.test.ts`

**Interfaces:**
- Consumes: ownership index, registry validation, and structured commands.
- Produces: `DUPLICATE_NODE`, `CHANGE_CONTAINER_VARIANT`, `cloneNodeSubtree(node, createId)`, cascade-aware remove, and a new default duplicate action.

```ts
export interface DuplicateNodePayload {
  nodeId: string
}

export interface ChangeContainerVariantPayload {
  containerId: string
  variant: ContainerVariantId
}
```

- [ ] **Step 1: Write failing cascade, copy, and migration tests**

```ts
it('removes a container subtree and clears descendant interaction state', () => {
  const { ctx, store } = setup([makeContainer('layout', { left: [makeNode('child')] })])
  store.selectNode('child')
  store.hoverNode('child')
  expect(removeNodeHandler(ctx, { nodeId: 'layout' })).toEqual({ ok: true })
  expect(store.getRawSchema().root.children).toEqual([])
  expect(store.selectedNodeId.value).toBeNull()
  expect(store.hoveredNodeId.value).toBeNull()
})

it('deep-clones every ID in a container subtree', () => {
  const ids = ['copy-layout', 'copy-child'][Symbol.iterator]()
  const clone = cloneNodeSubtree(makeContainer('layout', { left: [makeNode('child')] }), () => ids.next().value!)
  expect(clone.id).toBe('copy-layout')
  expect(clone.container!.regions.left[0].id).toBe('copy-child')
})

it('duplicates a container beside its source as one command', () => {
  const engine = makeContainerEngine()
  const result = engine.execute({
    type: CommandType.DUPLICATE_NODE,
    payload: { nodeId: 'layout' },
  })
  expect(result).toMatchObject({ ok: true })
  const [source, copy] = engine.exportSchema().root.children!
  expect(copy.type).toBe(source.type)
  expect(copy.id).not.toBe(source.id)
  expect(copy.container!.regions.left[0].id).not.toBe(source.container!.regions.left[0].id)
  expect(engine.history.canUndo()).toBe(true)
})

it('commits one migrated state and rejects invalid migration output', () => {
  const engine = makeVariantEngine()
  const before = engine.exportSchema()
  expect(engine.execute({ type: CommandType.CHANGE_CONTAINER_VARIANT, payload: { containerId: 'layout', variant: 'invalid-output' } })).toMatchObject({ ok: false, code: 'CONTAINER_VARIANT_MIGRATION_INVALID' })
  expect(engine.exportSchema()).toEqual(before)
  expect(engine.history.canUndo()).toBe(false)
})
```

- [ ] **Step 2: Run focused tests and verify failures**

Run: `pnpm --filter @dragcraft/core exec vitest run src/commands/remove-node.test.ts src/commands/duplicate-node.test.ts src/commands/change-container-variant.test.ts src/helpers.test.ts`

Expected: FAIL because nested removal, deep cloning, and both new commands are absent.

- [ ] **Step 3: Implement subtree removal and cloning**

```ts
export function cloneNodeSubtree(node: SchemaNode, createId: () => string): SchemaNode {
  const clone = cloneDeep(node)
  clone.id = createId()
  for (const children of Object.values(clone.container?.regions ?? {})) {
    for (let index = 0; index < children.length; index++)
      children[index] = cloneNodeSubtree(children[index], createId)
  }
  return clone
}

export function collectSubtreeIds(node: SchemaNode): Set<string> {
  const ids = new Set([node.id])
  for (const children of Object.values(node.container?.regions ?? {})) {
    for (const child of children) {
      for (const id of collectSubtreeIds(child))
        ids.add(id)
    }
  }
  return ids
}
```

Implement removal after the existing `deletable` behavior check with the same ownership resolver used by move:

```ts
const indexed = buildSchemaIndex(rawSchema)
const sourceResult = resolveNodeSource(rawSchema, indexed, payload.nodeId)
if (!sourceResult.ok)
  return sourceResult
const source = sourceResult.value
if (source.location.node.container && !ctx.registry.getWidget(source.location.node.type)?.container)
  return { ok: false, code: 'UNRESOLVED_CONTAINER_READ_ONLY' }
if (source.destination.kind === 'container') {
  const owner = indexed.index.get(source.destination.containerId)?.node
  const definition = owner && ctx.registry.getWidget(owner.type)?.container
  if (!definition)
    return { ok: false, code: 'UNRESOLVED_CONTAINER_READ_ONLY' }
  const variant = owner?.container && definition?.variants[owner.container.variant]
  const region = variant?.regions.find(item => item.id === source.destination.regionId)
  if (source.children.length - 1 < (region?.constraints?.minItems ?? 0))
    return { ok: false, code: 'CONTAINER_REGION_MIN_ITEMS' }
}
const removedIds = collectSubtreeIds(source.location.node)
source.children.splice(source.index, 1)
if (ctx.store.selectedNodeId.value && removedIds.has(ctx.store.selectedNodeId.value))
  ctx.store.selectNode(null)
if (ctx.store.hoveredNodeId.value && removedIds.has(ctx.store.hoveredNodeId.value))
  ctx.store.hoverNode(null)
return { ok: true, eventPayload: { nodeId: payload.nodeId, source: source.destination } }
```

- [ ] **Step 4: Implement deep duplication as a dedicated command and action**

```ts
export function duplicateNodeHandler(
  ctx: CommandContext,
  payload: DuplicateNodePayload,
): CommandResult {
  const schema = ctx.store.getRawSchema()
  const indexed = buildSchemaIndex(schema)
  const sourceResult = resolveNodeSource(schema, indexed, payload.nodeId)
  if (!sourceResult.ok)
    return sourceResult
  const source = sourceResult.value
  const clone = cloneNodeSubtree(source.location.node, generateShortId)
  const destination: NodeDestination = source.destination.kind === 'root'
    ? { ...source.destination, index: source.index + 1 }
    : { ...source.destination, index: source.index + 1 }
  const added = addNodeHandler(ctx, { node: clone, destination })
  if (!added || added === false)
    return { ok: false, code: 'DUPLICATE_ADD_REJECTED' }
  if (!added.ok)
    return added
  return {
    ok: true,
    eventPayload: { sourceNodeId: payload.nodeId, nodeId: clone.id, destination },
  }
}
```

Add `CommandType.DUPLICATE_NODE`, `EventName.NODE_DUPLICATED`, register the handler, and add `DUPLICATE_NODE` to `COMMAND_EVENT_MAP`. Add a default renderer action with key `duplicate`, `IconCopy`, order `350`, `type: 'button'`, and `command: ctx => ({ type: CommandType.DUPLICATE_NODE, payload: { nodeId: ctx.node.id } })`; include it between move-down and delete without changing the existing actions' behavior.

- [ ] **Step 5: Implement variant migration as one command**

```ts
function sameRegionIds(
  left: ContainerVariantDefinition,
  right: ContainerVariantDefinition,
): boolean {
  const leftIds = left.regions.map(region => region.id).sort()
  const rightIds = right.regions.map(region => region.id).sort()
  return leftIds.length === rightIds.length
    && leftIds.every((id, index) => id === rightIds[index])
}

function safelyMigrateVariant(
  definition: ContainerDefinition,
  ctx: ContainerVariantMigrationContext,
): ContainerVariantMigrationResult {
  if (!definition.migrateVariant)
    return { allowed: false, code: 'CONTAINER_VARIANT_MIGRATION_REQUIRED' }
  try {
    const result = cloneDeep(definition.migrateVariant(cloneDeep(ctx)))
    if (!result || typeof result.allowed !== 'boolean') {
      return {
        allowed: false,
        code: 'CONTAINER_VARIANT_MIGRATION_INVALID',
        details: { containerId: ctx.container.id },
      }
    }
    if (result.allowed
      && (!result.state || typeof result.state.variant !== 'string' || typeof result.state.regions !== 'object')) {
      return {
        allowed: false,
        code: 'CONTAINER_VARIANT_MIGRATION_INVALID',
        details: { containerId: ctx.container.id },
      }
    }
    return result
  }
  catch (error) {
    return {
      allowed: false,
      code: 'CONTAINER_VARIANT_MIGRATION_FAILED',
      message: error instanceof Error ? error.message : String(error),
      details: {
        nodeId: ctx.container.id,
        containerId: ctx.container.id,
        fromVariantId: ctx.fromVariantId,
        toVariantId: ctx.toVariantId,
      },
    }
  }
}

export function changeContainerVariantHandler(ctx: CommandContext, payload: ChangeContainerVariantPayload): CommandResult {
  const rawSchema = ctx.store.getRawSchema()
  const indexed = buildSchemaIndex(rawSchema).index.get(payload.containerId)
  const definition = indexed && ctx.registry.getWidget(indexed.node.type)?.container
  if (!indexed?.node.container || !definition)
    return { ok: false, code: 'CONTAINER_UNRESOLVED' }
  const fromVariantId = indexed.node.container.variant
  const from = definition.variants[fromVariantId]
  const to = definition.variants[payload.variant]
  if (!from || !to)
    return { ok: false, code: 'CONTAINER_VARIANT_UNKNOWN' }

  const sameRegions = sameRegionIds(from, to)
  const result = sameRegions
    ? { allowed: true as const, state: { ...cloneDeep(indexed.node.container), variant: payload.variant } }
    : safelyMigrateVariant(definition, {
        schema: rawSchema,
        container: indexed.node,
        fromVariantId,
        toVariantId: payload.variant,
        fromVariant: from,
        toVariant: to,
        state: indexed.node.container,
      })
  if (!result.allowed)
    return { ok: false, code: result.code ?? 'CONTAINER_VARIANT_MIGRATION_REJECTED', message: result.message }
  if (result.state.variant !== payload.variant)
    return { ok: false, code: 'CONTAINER_VARIANT_MIGRATION_TARGET_MISMATCH' }
  const candidate = cloneSchema(rawSchema)
  const candidateNode = buildSchemaIndex(candidate).index.get(indexed.node.id)?.node
  if (!candidateNode)
    return { ok: false, code: 'CONTAINER_NOT_FOUND' }
  candidateNode.container = cloneDeep(result.state)
  const validation = validateSchema(candidate, ctx.registry)
  if (!validation.valid)
    return { ok: false, code: 'CONTAINER_VARIANT_MIGRATION_INVALID', details: { diagnostics: validation.diagnostics } }
  indexed.node.container = cloneDeep(result.state)
  return {
    ok: true,
    eventPayload: {
      containerId: indexed.node.id,
      fromVariant: fromVariantId,
      toVariant: payload.variant,
    },
  }
}
```

Register `CommandType.CHANGE_CONTAINER_VARIANT`, `EventName.CONTAINER_VARIANT_CHANGED`, and its command-event mapping.

- [ ] **Step 6: Verify removal, duplicate, variant, action, history, and event behavior**

Run: `pnpm --filter @dragcraft/core exec vitest run src/commands/remove-node.test.ts src/commands/duplicate-node.test.ts src/commands/change-container-variant.test.ts src/helpers.test.ts src/engine.test.ts`

Run: `pnpm --filter @dragcraft/renderer exec vitest run src/action-registry.test.ts`

Expected: both commands PASS; one variant switch produces one undo entry and one variant event.

- [ ] **Step 7: Commit structural lifecycle commands**

```bash
git add packages/core/src/commands/duplicate-node.ts packages/core/src/commands/duplicate-node.test.ts packages/core/src/commands/change-container-variant.ts packages/core/src/commands/change-container-variant.test.ts packages/core/src/commands/remove-node.ts packages/core/src/commands/remove-node.test.ts packages/core/src/helpers.ts packages/core/src/helpers.test.ts packages/core/src/constants.ts packages/core/src/commands/index.ts packages/core/src/engine.ts packages/core/src/engine.test.ts packages/core/src/index.ts packages/renderer/src/action-registry.ts packages/renderer/src/action-registry.test.ts
git commit -m "feat(core): manage container subtree lifecycle"
```

---

### Task 7: Validate Imports And Provide Typed Widget Helpers

**Files:**
- Modify: `packages/core/src/engine.ts`
- Modify: `packages/core/src/engine.test.ts`
- Modify: `packages/designer/src/factory.ts`
- Modify: `packages/designer/src/factory.test.ts`
- Modify: `packages/widgets/src/helpers.ts`
- Modify: `packages/widgets/src/index.ts`
- Modify: `packages/widgets/src/index.test.ts`

**Interfaces:**
- Consumes: `validateSchema` and container types.
- Produces: `engine.importSchema(): SchemaImportResult`, correct register-before-import ordering, `defineContainerWidget()`.

```ts
export type SchemaImportResult =
  | { ok: true, diagnostics: SchemaDiagnostic[] }
  | { ok: false, diagnostics: SchemaDiagnostic[] }
```

- [ ] **Step 1: Write failing import-order and helper tests**

```ts
it('registers container metas before importing the initial schema', () => {
  const instance = createDesigner({
    engineOptions: { initialSchema: makeSchema([makeValidContainerNode()]) },
    widgetMetas: [makeContainerMeta()],
  })
  expect(instance.engine.state.getNodeById('layout')?.container?.variant).toBe('single')
})

it('rejects an invalid import without replacing current state', () => {
  const engine = createRegisteredContainerEngine()
  const before = engine.exportSchema()
  const result = engine.importSchema(makeSchemaWithUnknownResolvedRegion())
  expect(result).toMatchObject({ ok: false })
  expect(engine.exportSchema()).toEqual(before)
})

it('preserves metadata inference through defineContainerWidget', () => {
  const definition = defineContainerWidget({ meta: makeContainerMeta(), component: componentA })
  expect(definition.meta.container!.defaultVariant).toBe('single')
})
```

- [ ] **Step 2: Run engine, factory, and widgets tests**

Run: `pnpm --filter @dragcraft/core exec vitest run src/engine.test.ts`

Run: `pnpm --filter @dragcraft/designer exec vitest run src/factory.test.ts`

Run: `pnpm --filter @dragcraft/widgets exec vitest run src/index.test.ts`

Expected: FAIL on import results, initialization order, and missing helper.

- [ ] **Step 3: Validate imports before store replacement**

```ts
function importSchema(schema: DesignerSchema): SchemaImportResult {
  if (!schema?.root || !schema.version)
    return { ok: false, diagnostics: [{ code: 'SCHEMA_ENVELOPE_INVALID', severity: 'error' }] }
  const migrated = migrateSchema(cloneSchema(schema))
  const validation = validateSchema(migrated, registry)
  if (!validation.valid)
    return { ok: false, diagnostics: validation.diagnostics }
  store.setSchema(validation.schema)
  history.clear()
  eventHub.emit(EventName.SCHEMA_CHANGED, store.getSchema())
  return { ok: true, diagnostics: validation.diagnostics }
}
```

Do not change `schema.version`. Warning-only unresolved containers remain importable and return their diagnostics.

- [ ] **Step 4: Register before initial import in createDesigner**

```ts
const { initialSchema, ...engineOptions } = options.engineOptions ?? {}
const engine = createEngine(engineOptions)
for (const meta of options.widgetMetas ?? [])
  engine.registerWidget(meta)
if (initialSchema) {
  const result = engine.importSchema(initialSchema)
  if (!result.ok)
    console.warn('[dragcraft/designer] initial schema rejected', result.diagnostics)
}
```

- [ ] **Step 5: Add the zero-runtime helper**

```ts
export function defineContainerWidget<Meta extends WidgetMeta & { container: ContainerDefinition }>(
  definition: WidgetDefinition<Meta>,
): WidgetDefinition<Meta> {
  return definition
}
```

Export it from `@dragcraft/widgets` and cover inference without adding a runtime registry layer.

- [ ] **Step 6: Run the three package suites**

Run: `pnpm --filter @dragcraft/core exec vitest run src/engine.test.ts src/schema-validation.test.ts`

Run: `pnpm --filter @dragcraft/designer exec vitest run src/factory.test.ts`

Run: `pnpm --filter @dragcraft/widgets exec vitest run src/index.test.ts`

Expected: PASS; current schema version remains unchanged in every import assertion.

- [ ] **Step 7: Commit import and helper integration**

```bash
git add packages/core/src/engine.ts packages/core/src/engine.test.ts packages/designer/src/factory.ts packages/designer/src/factory.test.ts packages/widgets/src/helpers.ts packages/widgets/src/index.ts packages/widgets/src/index.test.ts
git commit -m "feat: validate container schemas during setup"
```

---

### Task 8: Render External Containers Through Region Outlets

**Files:**
- Create: `packages/renderer/src/container-runtime.ts`
- Create: `packages/renderer/src/container-runtime.test.ts`
- Create: `packages/renderer/src/components/ContainerRegionOutlet.ts`
- Create: `packages/renderer/src/components/ContainerRegionOutlet.test.ts`
- Create: `packages/renderer/src/components/DefaultContainerFallback.ts`
- Modify: `packages/renderer/src/components/WidgetRenderer.ts`
- Modify: `packages/renderer/src/components/WidgetRenderer.test.ts`
- Modify: `packages/renderer/src/composables/useNodeActions.ts`
- Modify: `packages/renderer/src/composables/useNodeActions.test.ts`
- Modify: `packages/renderer/src/components/index.ts`
- Modify: `packages/renderer/src/index.ts`
- Modify: `packages/renderer/src/types.ts`

**Interfaces:**
- Consumes: `createContainerPlan`, `CHANGE_CONTAINER_VARIANT`, renderer context, and existing `WidgetRenderer`.
- Produces: `ContainerRuntime`, `useContainerRuntime()`, `CONTAINER_RUNTIME_CONTEXT_KEY`, `ContainerRegionOutlet`, unresolved recovery fallback.

```ts
export interface WidgetRendererProps {
  node: SchemaNode
  owner?: NodeOwner
}

export interface ContainerRegionOutletProps {
  regionId: ContainerRegionId
  as?: string | Component
}

export interface ContainerRuntime {
  nodeId: ComputedRef<string>
  variant: ComputedRef<ContainerVariantId>
  regionDefinitions: ComputedRef<readonly ContainerRegionDefinition[]>
  getRegionNodes: (regionId: ContainerRegionId) => readonly SchemaNode[]
  requestVariantChange: (variant: ContainerVariantId) => CommandExecutionResult
}
```

- [ ] **Step 1: Write failing runtime and one-render-path tests**

```ts
it('exposes the active variant and region nodes to an external component', () => {
  const runtime = createContainerRuntime(() => makeSplitNode(), rendererContext)
  expect(runtime.variant.value).toBe('split')
  expect(runtime.getRegionNodes('left').map(node => node.id)).toEqual(['left-child'])
})

it('renders each nested widget exactly once through its owner outlet', () => {
  const { host } = mountRendererWithExternalSplit()
  expect(host.querySelectorAll('[data-node-id="left-child"]')).toHaveLength(1)
  expect(host.querySelectorAll('[data-node-id="right-child"]')).toHaveLength(1)
  expect(host.querySelector('[data-dc-container-region="left"]')).not.toBeNull()
})

it('renders unresolved children in a recovery fallback', () => {
  const { host } = mountUnresolvedContainer()
  expect(host.querySelector('[data-dc-unresolved-container="layout"]')).not.toBeNull()
  expect(host.querySelector('[data-node-id="preserved-child"]')).not.toBeNull()
})
```

- [ ] **Step 2: Run renderer tests and verify missing runtime/outlet failures**

Run: `pnpm --filter @dragcraft/renderer exec vitest run src/container-runtime.test.ts src/components/ContainerRegionOutlet.test.ts src/components/WidgetRenderer.test.ts`

Expected: FAIL because runtime injection and outlet components are absent.

- [ ] **Step 3: Implement the read-only container runtime**

```ts
export function createContainerRuntime(getNode: () => SchemaNode, ctx: RendererContext): ContainerRuntime {
  const plan = computed(() => createContainerPlan(getNode(), ctx.engine.registry))
  return {
    nodeId: computed(() => getNode().id),
    variant: computed(() => getNode().container?.variant ?? ''),
    regionDefinitions: computed(() => plan.value.ok ? plan.value.plan.variant.regions : []),
    getRegionNodes: regionId => getNode().container?.regions[regionId] ?? [],
    requestVariantChange: variant => ctx.engine.execute({
      type: CommandType.CHANGE_CONTAINER_VARIANT,
      payload: { containerId: getNode().id, variant },
    }),
  }
}
```

Provide this context only for resolved container nodes. Use this exact accessor:

```ts
export function useContainerRuntime(): ContainerRuntime {
  const runtime = inject(CONTAINER_RUNTIME_CONTEXT_KEY)
  if (!runtime) {
    throw new Error(
      '[dragcraft/renderer] ContainerRuntime not found. '
      + 'ContainerRegionOutlet must be rendered inside a resolved container material.',
    )
  }
  return runtime
}
```

- [ ] **Step 4: Implement the framework-owned outlet**

```ts
export default defineComponent({
  name: 'DcContainerRegionOutlet',
  inheritAttrs: false,
  props: {
    regionId: { type: String, required: true },
    as: { type: [String, Object] as PropType<string | Component>, default: 'div' },
  },
  setup(props, { attrs }) {
    const runtime = useContainerRuntime()
    const definition = computed(() => runtime.regionDefinitions.value.find(item => item.id === props.regionId))
    return () => h(props.as, {
      ...attrs,
      'class': ['dc-container-region', attrs.class],
      'data-dc-container-id': runtime.nodeId.value,
      'data-dc-container-region': props.regionId,
      'role': attrs.role ?? 'group',
      'aria-label': attrs['aria-label'] ?? definition.value?.title ?? props.regionId,
    }, runtime.getRegionNodes(props.regionId).map(node => h(WidgetRenderer, {
      key: node.id,
      node,
      owner: { kind: 'container', containerId: runtime.nodeId.value, regionId: props.regionId },
    })))
  },
})
```

The outlet must not set display, flex, grid, gap, direction, width, or height. Forward `class`, `style`, and semantic attrs so the external material controls its DOM.

- [ ] **Step 5: Integrate resolved and unresolved container rendering**

Add the `owner` prop to `WidgetRenderer` with default `{ kind: 'root' }`, change `useNodeActions(getNode, ctx, getOwner)` to accept `getOwner: () => NodeOwner = () => ({ kind: 'root' })`, and calculate region-local `index`/`siblingCount` from the owner container when `getOwner().kind === 'container'`. For a container-owned node, do not resolve or emit page placement, region, sort-scope, or page-order attributes; render it as an ordinary child of the external outlet. Detect `meta.container` and valid state, provide the runtime, and render the external component normally. Set `usesBlockingMask` to false for resolved containers. When a node has container state but no meta, render `DefaultContainerFallback`, enumerating persisted region IDs and child `WidgetRenderer` instances exactly once with their container owner.

Use this owner branch inside `useNodeActions` before the existing root layout-plan branch:

```ts
const owner = getOwner()
if (owner.kind === 'container') {
  const container = engine.state.getNodeById(owner.containerId)
  const siblings = container?.container?.regions[owner.regionId] ?? []
  return {
    node,
    owner,
    index: siblings.findIndex(item => item.id === node.id),
    siblingCount: siblings.length,
    sortScope: false,
    meta,
    engine,
  }
}
```

- [ ] **Step 6: Run renderer and RootRenderer regressions**

Run: `pnpm --filter @dragcraft/renderer exec vitest run src/container-runtime.test.ts src/components/ContainerRegionOutlet.test.ts src/components/WidgetRenderer.test.ts src/components/RootRenderer.test.ts`

Expected: PASS; root plan still creates one VNode for the container and does not include region children.

- [ ] **Step 7: Commit static container rendering**

```bash
git add packages/renderer/src/container-runtime.ts packages/renderer/src/container-runtime.test.ts packages/renderer/src/components/ContainerRegionOutlet.ts packages/renderer/src/components/ContainerRegionOutlet.test.ts packages/renderer/src/components/DefaultContainerFallback.ts packages/renderer/src/components/WidgetRenderer.ts packages/renderer/src/components/WidgetRenderer.test.ts packages/renderer/src/composables/useNodeActions.ts packages/renderer/src/composables/useNodeActions.test.ts packages/renderer/src/components/index.ts packages/renderer/src/index.ts packages/renderer/src/types.ts
git commit -m "feat(renderer): render external container regions"
```

---

### Task 9: Add Material-Owned Drop Geometry And Region Feedback

**Files:**
- Modify: `packages/renderer/src/types.ts`
- Modify: `packages/renderer/src/context.ts`
- Modify: `packages/renderer/src/components/ContainerRegionOutlet.ts`
- Modify: `packages/renderer/src/components/ContainerRegionOutlet.test.ts`
- Modify: `packages/renderer/src/components/RootRenderer.ts`
- Modify: `packages/renderer/src/components/RootRenderer.test.ts`
- Modify: `packages/renderer/src/index.ts`

**Interfaces:**
- Consumes: Designer-provided active drop destination and decision refs.
- Produces: `ResolveContainerDropIndex`, `ContainerDropTarget`, outlet-level resolver override and default `RendererWidgetMeta.containerAdapter`.

- [ ] **Step 1: Write failing adapter and feedback tests**

```ts
it('uses the outlet resolver and publishes the resulting destination', () => {
  const resolveDropIndex = vi.fn(() => 1)
  const onTarget = vi.fn()
  const { region } = mountOutlet({ resolveDropIndex, onTarget })
  region.dispatchEvent(new DragEvent('dragover', { bubbles: true, clientX: 20, clientY: 30 }))
  expect(resolveDropIndex).toHaveBeenCalledWith(expect.objectContaining({
    regionElement: region,
    nodes: expect.any(Array),
  }))
  expect(onTarget).toHaveBeenCalledWith({ kind: 'container', containerId: 'layout', regionId: 'left', index: 1 })
})

it('blocks drop when no resolver exists and does not guess append', () => {
  const { region, onTarget } = mountOutlet({ resolveDropIndex: undefined })
  region.dispatchEvent(new DragEvent('dragover', { bubbles: true }))
  expect(onTarget).toHaveBeenCalledWith(expect.objectContaining({ allowed: false, code: 'CONTAINER_DROP_ADAPTER_MISSING' }))
})

it('rejects a non-integer or out-of-range material index', () => {
  const { region, onTarget } = mountOutlet({ resolveDropIndex: () => 99 })
  region.dispatchEvent(new DragEvent('dragover', { bubbles: true }))
  expect(onTarget).toHaveBeenCalledWith(expect.objectContaining({
    allowed: false,
    code: 'CONTAINER_DROP_ADAPTER_INVALID',
  }))
})

it('renders empty, active, and forbidden region states without layout styles', () => {
  const { region } = mountOutlet({
    nodes: [],
    activeDestination: ref({ kind: 'container', containerId: 'layout', regionId: 'left', index: 0 }),
    dropDecision: ref({ allowed: false, code: 'CONTAINER_REGION_MAX_ITEMS' }),
  })
  expect(region.classList).toContain('dc-container-region--empty')
  expect(region.classList).toContain('dc-container-region--active')
  expect(region.classList).toContain('dc-container-region--forbidden')
  expect(region.style.display).toBe('')
})
```

- [ ] **Step 2: Run outlet tests and verify missing adapter contract**

Run: `pnpm --filter @dragcraft/renderer exec vitest run src/components/ContainerRegionOutlet.test.ts`

Expected: FAIL because outlets do not publish destinations or feedback states.

- [ ] **Step 3: Add renderer-only adapter types**

```ts
export interface ResolveContainerDropIndexContext {
  event: DragEvent
  regionElement: HTMLElement
  itemElements: readonly HTMLElement[]
  nodes: readonly SchemaNode[]
}

export type ResolveContainerDropIndex = (ctx: ResolveContainerDropIndexContext) => number | null

export interface ContainerRegionOutletDropProps extends ContainerRegionOutletProps {
  resolveDropIndex?: ResolveContainerDropIndex
}

export type ContainerDropTarget = {
  event: DragEvent
  destination: Extract<NodeDestination, { kind: 'container' }>
}

export type ContainerDropRejection = {
  event: DragEvent
  containerId: string
  regionId: string
  allowed: false
  code: 'CONTAINER_DROP_ADAPTER_MISSING' | 'CONTAINER_DROP_ADAPTER_FAILED' | 'CONTAINER_DROP_ADAPTER_INVALID'
  message?: string
}

export interface RendererContainerAdapter {
  resolveDropIndex?: ResolveContainerDropIndex
}

export interface RendererWidgetMeta extends CoreWidgetMeta {
  containerAdapter?: RendererContainerAdapter
}

export interface ContainerDropRendererOptions {
  activeDestination?: Ref<NodeDestination | null>
  containerDropDecision?: Ref<PlacementDecision | null>
  onContainerDragOver?: (target: ContainerDropTarget | ContainerDropRejection) => void
  onContainerDragLeave?: (event: DragEvent) => void
  onContainerDrop?: (event: DragEvent) => void
}
```

Extend both `RendererOptions` and `RendererContext` with `ContainerDropRendererOptions`; `createRendererContext` supplies `ref(null)` defaults for both refs and forwards the three callbacks. Add `resolveDropIndex` to `ContainerRegionOutlet` using the exact optional function type above. These callbacks carry the resolver result and DOM event to Designer but never mutate schema.

- [ ] **Step 4: Implement outlet event isolation and state rendering**

Implement `onDragover` with this exact control flow:

```ts
function handleDragOver(event: DragEvent): void {
  const regionElement = event.currentTarget as HTMLElement
  if (event.target instanceof Element && event.target.closest('[data-dc-container-region]') !== regionElement)
    return
  event.preventDefault()
  event.stopPropagation()
  const containerNode = ctx.engine.state.getNodeById(runtime.nodeId.value)
  const meta = containerNode
    ? ctx.engine.registry.getWidget(containerNode.type) as RendererWidgetMeta | undefined
    : undefined
  const resolver = props.resolveDropIndex ?? meta?.containerAdapter?.resolveDropIndex
  if (!resolver) {
    ctx.onContainerDragOver?.({
      event,
      containerId: runtime.nodeId.value,
      regionId: props.regionId,
      allowed: false,
      code: 'CONTAINER_DROP_ADAPTER_MISSING',
    })
    return
  }
  try {
    const nodes = runtime.getRegionNodes(props.regionId)
    const index = resolver({
      event,
      regionElement,
      itemElements: Array.from(regionElement.querySelectorAll<HTMLElement>(':scope > [data-node-id]')),
      nodes,
    })
    if (index === null)
      return
    if (!Number.isInteger(index) || index < 0 || index > nodes.length) {
      ctx.onContainerDragOver?.({
        event,
        containerId: runtime.nodeId.value,
        regionId: props.regionId,
        allowed: false,
        code: 'CONTAINER_DROP_ADAPTER_INVALID',
      })
      return
    }
    ctx.onContainerDragOver?.({
      event,
      destination: { kind: 'container', containerId: runtime.nodeId.value, regionId: props.regionId, index },
    })
  }
  catch (error) {
    ctx.onContainerDragOver?.({
      event,
      containerId: runtime.nodeId.value,
      regionId: props.regionId,
      allowed: false,
      code: 'CONTAINER_DROP_ADAPTER_FAILED',
      message: error instanceof Error ? error.message : String(error),
    })
  }
}
```

Derive `isEmpty` from `runtime.getRegionNodes`, `isActive` by matching `ctx.activeDestination.value`, and `isForbidden` from `isActive && ctx.containerDropDecision.value?.allowed === false`. Render the existing `dropIndicator`, `emptyState`, and `forbidden` extension components from those computed values. Forward `dragover`, `dragleave`, and `drop` to the callbacks, and add only state classes/ARIA; do not add geometry styles.

- [ ] **Step 5: Run renderer interaction regressions**

Run: `pnpm --filter @dragcraft/renderer exec vitest run src/components/ContainerRegionOutlet.test.ts src/components/RootRenderer.test.ts src/components/WidgetRenderer.test.ts`

Expected: PASS; root forbidden overlay behavior remains unchanged for root targets.

- [ ] **Step 6: Commit the drop bridge**

```bash
git add packages/renderer/src/types.ts packages/renderer/src/context.ts packages/renderer/src/components/ContainerRegionOutlet.ts packages/renderer/src/components/ContainerRegionOutlet.test.ts packages/renderer/src/components/RootRenderer.ts packages/renderer/src/components/RootRenderer.test.ts packages/renderer/src/index.ts
git commit -m "feat(renderer): bridge container drop geometry"
```

---

### Task 10: Generalize Designer Drag And Drop Destinations

**Files:**
- Modify: `packages/designer/src/composables/useDragDrop.ts`
- Modify: `packages/designer/src/composables/useDragDrop.test.ts`
- Modify: `packages/designer/src/types.ts`
- Modify: `packages/designer/src/components/DcDesigner.ts`
- Modify: `packages/designer/src/components/DcCanvas.ts`
- Modify: `packages/renderer/src/types.ts`

**Interfaces:**
- Consumes: renderer outlet callbacks, `NodeDestination`, `resolvePlacementDecision`, and structured command results.
- Produces: `activeDestination`, unified root/container preflight decision, root and container drop handlers.

- [ ] **Step 1: Write failing root-to-region and region-to-root drag tests**

```ts
it('adds a material to the active container destination', () => {
  const dd = useDragDrop(engine)
  dd.handleMaterialDragStart(mockDragEvent(), makeMeta('image'))
  dd.handleContainerDragOver({
    event: mockDragEvent(),
    destination: { kind: 'container', containerId: 'layout', regionId: 'left', index: 0 },
  })
  dd.handleContainerDrop(mockDragEvent())
  expect(engine.state.getNodeById('layout')!.container!.regions.left[0].type).toBe('image')
})

it('moves a nested node back to root', () => {
  const dd = useDragDrop(engineWithNestedText())
  engine.store.setDragTarget({ sourceNodeId: 'nested', widgetType: null })
  dd.dragOverDestination.value = { kind: 'root', sortScope: 'content', index: 0 }
  dd.handleCanvasDrop(mockDragEvent())
  expect(engine.state.getSchema().root.children![0].id).toBe('nested')
})

it('surfaces the final Core rejection even after a successful preflight', () => {
  vi.spyOn(engine, 'execute').mockReturnValue({ ok: false, code: 'CONTAINER_REGION_MAX_ITEMS', message: 'Full' })
  const dd = useDragDrop(engine)
  dd.commitDrop()
  expect(dd.isForbidden.value).toBe(true)
  expect(dd.forbiddenReason.value).toMatchObject({ code: 'CONTAINER_REGION_MAX_ITEMS', message: 'Full' })
})
```

- [ ] **Step 2: Run drag/drop tests and verify destination failures**

Run: `pnpm --filter @dragcraft/designer exec vitest run src/composables/useDragDrop.test.ts`

Expected: FAIL because drag state only records root node/index.

- [ ] **Step 3: Replace root-only state with a destination ref**

```ts
const dragOverDestination = ref<NodeDestination | null>(null)
const activeDestination = dragOverDestination
const containerDropDecision = ref<PlacementDecision | null>(null)
const dragOverNodeId = computed(() => {
  const destination = dragOverDestination.value
  return destination?.kind === 'container' ? destination.containerId : destination ? 'root' : null
})
const dragOverIndex = computed(() => dragOverDestination.value?.index ?? null)
```

Keep `dragOverNodeId` and `dragOverIndex` as compatibility projections for root renderer extensions during this release.

- [ ] **Step 4: Route material and existing-node drops through one commit function**

```ts
function commitDrop(): CommandExecutionResult {
  const destination = dragOverDestination.value
  const target = engine.store.dragTarget.value
  if (!destination || !target)
    return { ok: false, code: 'DROP_TARGET_MISSING' }

  let result: CommandExecutionResult
  if (target.sourceNodeId) {
    result = engine.execute({
      type: CommandType.MOVE_NODE,
      payload: { nodeId: target.sourceNodeId, destination },
    })
  }
  else {
    const meta = target.widgetType
      ? engine.registry.getWidget(target.widgetType) as RendererWidgetMeta | undefined
      : undefined
    if (!meta) {
      result = { ok: false, code: 'DRAGGED_WIDGET_META_MISSING' }
    }
    else {
      result = engine.execute({
        type: CommandType.ADD_NODE,
        payload: { node: createSchemaNode(meta), destination },
      })
    }
  }
  if (!result.ok)
    setForbidden(result)
  else
    clearDragOverState()
  return result
}

function setForbidden(reason: Extract<CommandExecutionResult, { ok: false }>): void {
  isForbidden.value = true
  forbiddenReason.value = {
    code: reason.code,
    messageKey: reason.messageKey,
    message: reason.message,
  }
}
```

Root `handleCanvasDragOver` continues to calculate Y-midpoint content indices. Container callbacks accept the material's resolved index and run Core placement preflight without recalculating geometry.

- [ ] **Step 5: Wire callbacks through Designer and Renderer**

Pass `activeDestination`, `containerDropDecision`, `handleContainerDragOver`, `handleContainerDragLeave`, and `handleContainerDrop` from `useDragDrop` through `DcDesigner` and `DcCanvas` into the exact `RendererOptions` fields from Task 9. `handleContainerDragOver` stores `payload.destination` and runs the same Core placement resolver used by commands; a `ContainerDropRejection` calls `setForbidden`. `handleContainerDragLeave` clears only when `relatedTarget` is outside the active region, and `handleContainerDrop` calls `commitDrop`. Outlet events stop root handlers from replacing an active container destination.

```ts
function handleContainerDragOver(payload: ContainerDropTarget | ContainerDropRejection): void {
  if ('allowed' in payload) {
    containerDropDecision.value = { allowed: false, code: payload.code, message: payload.message }
    setForbidden({ ok: false, code: payload.code, message: payload.message })
    return
  }
  dragOverDestination.value = payload.destination
  const decision = preflightContainerDestination(payload.destination)
  containerDropDecision.value = decision
  if (!decision.allowed) {
    setForbidden({
      ok: false,
      code: decision.code ?? 'CONTAINER_PLACEMENT_REJECTED',
      messageKey: decision.messageKey,
      message: decision.message,
      details: decision.details,
    })
  }
  else {
    isForbidden.value = false
    forbiddenReason.value = null
  }
}

function handleContainerDragLeave(event: DragEvent): void {
  const current = event.currentTarget as HTMLElement | null
  if (current && event.relatedTarget instanceof Node && current.contains(event.relatedTarget))
    return
  clearDragOverState()
}

function handleContainerDrop(event: DragEvent): CommandExecutionResult {
  event.preventDefault()
  event.stopPropagation()
  return commitDrop()
}

const rendererOptions: Pick<RendererOptions,
  'activeDestination' | 'containerDropDecision' | 'onContainerDragOver' | 'onContainerDragLeave' | 'onContainerDrop'> = {
  activeDestination,
  containerDropDecision,
  onContainerDragOver: handleContainerDragOver,
  onContainerDragLeave: handleContainerDragLeave,
  onContainerDrop: handleContainerDrop,
}
```

Use this read-only preflight; the command repeats every check at commit time:

```ts
function preflightContainerDestination(
  destination: Extract<NodeDestination, { kind: 'container' }>,
): PlacementDecision {
  const schema = engine.state.getSchema()
  const dragTarget = engine.store.dragTarget.value
  if (!dragTarget)
    return { allowed: false, code: 'DROP_SOURCE_MISSING' }
  const child = dragTarget.sourceNodeId
    ? engine.state.getNodeById(dragTarget.sourceNodeId)
    : (() => {
        const meta = dragTarget.widgetType
          ? engine.registry.getWidget(dragTarget.widgetType) as RendererWidgetMeta | undefined
          : undefined
        return meta ? createSchemaNode(meta) : null
      })()
  if (!child)
    return { allowed: false, code: 'DROP_SOURCE_MISSING' }
  const targetResult = resolveDestination(schema, engine.registry, destination)
  if (!targetResult.ok)
    return { allowed: false, code: targetResult.code, message: targetResult.message }
  const target = targetResult.value
  if (!target.container || !target.definition || !target.variant || !target.region)
    return { allowed: false, code: 'CONTAINER_DESTINATION_REQUIRED' }
  const source = dragTarget.sourceNodeId
    ? buildSchemaIndex(schema).index.get(dragTarget.sourceNodeId)
    : undefined
  const sameRegion = source?.owner === destination.containerId
    && source.regionId === destination.regionId
  return resolvePlacementDecision({
    definition: target.definition,
    region: target.region,
    child,
    childHasContainerCapability: Boolean(engine.registry.getWidget(child.type)?.container),
    targetCount: target.children.length - (sameRegion ? 1 : 0),
    callbackContext: {
      operation: dragTarget.sourceNodeId ? 'move' : 'add',
      schema,
      container: target.container,
      variant: target.variant,
      region: target.region,
      child,
      targetIndex: clampInsertIndex(destination.index, target.children.length),
    },
  })
}
```

- [ ] **Step 6: Run designer drag and renderer outlet suites together**

Run: `pnpm --filter @dragcraft/designer exec vitest run src/composables/useDragDrop.test.ts src/components/DcDesigner.test.ts`

Run: `pnpm --filter @dragcraft/renderer exec vitest run src/components/ContainerRegionOutlet.test.ts src/components/RootRenderer.test.ts`

Expected: PASS for root sorting, region drops, cross-owner moves, forbidden reasons, and cleanup.

- [ ] **Step 7: Commit generalized drag/drop**

```bash
git add packages/designer/src/composables/useDragDrop.ts packages/designer/src/composables/useDragDrop.test.ts packages/designer/src/types.ts packages/designer/src/components/DcDesigner.ts packages/designer/src/components/DcCanvas.ts packages/renderer/src/types.ts
git commit -m "feat(designer): drop widgets into container regions"
```

---

### Task 11: Expose Container Structure And Variant Binding

**Files:**
- Modify: `packages/form-generator/src/types.ts`
- Modify: `packages/form-generator/src/index.ts`
- Modify: `packages/designer/src/bindings/field-binding.ts`
- Modify: `packages/designer/src/bindings/field-binding.test.ts`
- Modify: `packages/designer/src/composables/usePropertyBinding.ts`
- Modify: `packages/designer/src/composables/usePropertyBinding.test.ts`
- Modify: `packages/designer/src/components/DcPropertyPanel.ts`
- Modify: `packages/designer/src/components/DcStructurePanel.ts`
- Modify: `packages/designer/src/components/DcStructurePanel.test.ts`
- Modify: `packages/themes/src/components/structure-panel.css`

**Interfaces:**
- Consumes: container definition titles, `CHANGE_CONTAINER_VARIANT`, and nested node lookup.
- Produces: `FieldBindingScope = ... | 'container'`, derived variant options, virtual region rows, nested child actions.

- [ ] **Step 1: Write failing binding and structure tests**

```ts
it('translates container.variant binding into the dedicated command', () => {
  const command = createBindingCommand({ scope: 'container', path: 'variant' }, 'stacked', 'layout')
  expect(command).toEqual({
    type: CommandType.CHANGE_CONTAINER_VARIANT,
    payload: { containerId: 'layout', variant: 'stacked' },
  })
})

it('reads container variant and derives registered options for the property form', () => {
  const binding = usePropertyBinding(makeSelectedContainerEngine(), {
    t: (key, fallback) => key === 'variant.split' ? 'Split' : fallback ?? key,
  })
  expect(binding.selectedNodeProps.value.variant).toBe('split')
  const field = binding.selectedFormSchema.value!.sections[0].fields[0]
  expect(typeof field.componentProps).toBe('function')
  expect((field.componentProps as Function)({ values: {} }).options).toEqual([
    { label: 'Split', value: 'split' },
    { label: 'Stacked', value: 'stacked' },
  ])
})

it('renders virtual regions and nested widgets in registration order', () => {
  const { host } = mountStructurePanel(makeStructureEngine())
  expect(Array.from(host.querySelectorAll('[data-dc-region-id]')).map(el => el.getAttribute('data-dc-region-id'))).toEqual(['left', 'right'])
  expect(host.querySelector('[data-node-id="nested"]')).not.toBeNull()
})
```

- [ ] **Step 2: Run binding and structure tests**

Run: `pnpm --filter @dragcraft/designer exec vitest run src/bindings/field-binding.test.ts src/composables/usePropertyBinding.test.ts src/components/DcStructurePanel.test.ts`

Expected: FAIL because `container` is not a valid binding scope and structure is root-flat.

- [ ] **Step 3: Add the binding scope and command translation**

```ts
export type FieldBindingScope = 'node' | 'schema' | 'globalConfig' | 'container'

if (binding.scope === 'container') {
  if (!nodeId || binding.path !== 'variant' || typeof value !== 'string')
    return null
  return {
    type: CommandType.CHANGE_CONTAINER_VARIANT,
    payload: { containerId: nodeId, variant: value },
  }
}

// readBindingValue
if (binding.scope === 'container') {
  if (!node || binding.path !== 'variant')
    return undefined
  return node.container?.variant
}
```

Do not allow arbitrary container paths or region writes from form fields.

- [ ] **Step 4: Derive variant options without duplicating schema data**

Extend the composable options and pass the already available translator from `DcPropertyPanel`:

```ts
export interface UsePropertyBindingOptions {
  globalConfigSchema?: FormSchema | null
  t?: (key: string, fallback?: string) => string
}

// DcPropertyPanel.setup()
const binding = usePropertyBinding(engine, { globalConfigSchema, t })
```

Clone the selected form schema and replace only fields whose resolved binding is `{ scope: 'container', path: 'variant' }`:

```ts
const translate = options.t ?? ((_key: string, fallback?: string) => fallback ?? _key)
const selectedFormSchema = computed<FormSchema | null>(() => {
  const meta = selectedWidgetMeta.value
  if (!meta)
    return null
  const schema = cloneDeep(meta.formSchema as FormSchema)
  if (!meta.container)
    return schema
  const variantOptions = Object.entries(meta.container.variants).map(([value, variant]) => ({
    value,
    label: variant.titleKey ? translate(variant.titleKey, variant.title) : variant.title,
  }))
  for (const section of schema.sections) {
    for (const field of section.fields) {
      const binding = resolveFieldBinding(field.bindTo, { scope: 'node', path: `props.${field.key}` })
      if (binding.scope !== 'container' || binding.path !== 'variant')
        continue
      const original = field.componentProps
      field.componentProps = (ctx) => ({
        ...(typeof original === 'function' ? original(ctx) : original ?? {}),
        options: variantOptions,
      })
    }
  }
  return schema
})
```

- [ ] **Step 5: Render virtual region branches and nested actions**

Build structure view models from `createContainerPlan`. Region rows use `data-dc-region-id`, translated titles, and item counts but have no selection action. For every nested child call the existing action registry with `owner: { kind: 'container', containerId: plan.containerId, regionId: region.definition.id }`, its region-local `index`, and `siblingCount: region.nodes.length`; this makes move, duplicate, and delete commands ownership-aware without a second action implementation.

```ts
interface ContainerStructureRegion {
  id: string
  title: string
  owner: Extract<NodeOwner, { kind: 'container' }>
  nodes: SchemaNode[]
}

function createContainerStructureRegions(
  node: SchemaNode,
  engine: DesignerEngine,
  t: (key: string, fallback?: string) => string,
): ContainerStructureRegion[] {
  const result = createContainerPlan(node, engine.registry)
  if (!result.ok)
    return []
  return result.plan.regions.map(region => ({
    id: region.definition.id,
    title: region.definition.titleKey
      ? t(region.definition.titleKey, region.definition.title)
      : region.definition.title,
    owner: {
      kind: 'container',
      containerId: result.plan.containerId,
      regionId: region.definition.id,
    },
    nodes: region.nodes,
  }))
}
```

Render each result as an unselectable region row followed by the existing node-row renderer. Pass `owner`, the array-local index, and array length into the node-row action context; clicking a nested node still calls `engine.store.selectNode(node.id)`.

- [ ] **Step 6: Add structure-only styles**

```css
.dc-structure-panel__region {
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr) auto;
  align-items: center;
  min-height: 28px;
  padding-inline: 20px 8px;
}

.dc-structure-panel__children {
  padding-inline-start: 16px;
}
```

Do not style external layout geometry in themes.

- [ ] **Step 7: Run form-generator and designer tests**

Run: `pnpm --filter @dragcraft/form-generator typecheck`

Run: `pnpm --filter @dragcraft/designer exec vitest run src/bindings/field-binding.test.ts src/composables/usePropertyBinding.test.ts src/components/DcStructurePanel.test.ts`

Expected: PASS; existing node/schema/globalConfig bindings remain unchanged.

- [ ] **Step 8: Commit property and structure support**

```bash
git add packages/form-generator/src/types.ts packages/form-generator/src/index.ts packages/designer/src/bindings/field-binding.ts packages/designer/src/bindings/field-binding.test.ts packages/designer/src/composables/usePropertyBinding.ts packages/designer/src/composables/usePropertyBinding.test.ts packages/designer/src/components/DcPropertyPanel.ts packages/designer/src/components/DcStructurePanel.ts packages/designer/src/components/DcStructurePanel.test.ts packages/themes/src/components/structure-panel.css
git commit -m "feat(designer): edit container variants and structure"
```

---

### Task 12: Prove External Layouts In Playground And Update Architecture Docs

**Files:**
- Create: `playground/src/components/widgets/container.ts`
- Create: `playground/src/components/widgets/container.test.ts`
- Modify: `playground/src/components/widgets/index.ts`
- Modify: `playground/src/components/widgets/styles.css`
- Modify: `playground/src/components/widgets/messages.ts`
- Modify: `playground/src/config/templates/content-detail-schema.ts`
- Modify: `packages/themes/src/components/canvas.css`
- Modify: `.github/architecture/02-schema-and-core.md`
- Modify: `.github/architecture/03-designer-and-renderer.md`
- Modify: `.github/architecture/05-widgets-fields-and-utils.md`
- Modify: `.github/architecture/08-layout-system.md`
- Modify: `docs/reference/core.md`
- Modify: `docs/reference/designer.md`
- Modify: `docs/reference/renderer.md`
- Modify: `docs/reference/widgets-and-fields.md`

**Interfaces:**
- Consumes: all public APIs from Tasks 1-11.
- Produces: one external single-region flex example, one external three-region/two-variant example, final architecture documentation, and end-to-end verification evidence.

- [ ] **Step 1: Add failing playground definition tests**

Create `playground/src/components/widgets/container.test.ts` with these assertions:

```ts
import { expect, it } from 'vitest'
import { playgroundWidgetDefinitions } from './index'

it('keeps all flex and irregular geometry outside framework metadata', () => {
  const metas = playgroundWidgetDefinitions.map(item => item.meta)
  const flex = metas.find(meta => meta.type === 'flex-container')!
  const split = metas.find(meta => meta.type === 'split-container')!
  expect(flex.container!.variants.single.regions.map(region => region.id)).toEqual(['default'])
  expect(split.container!.variants['left-one-right-two'].regions.map(region => region.id)).toEqual(['left', 'rightTop', 'rightBottom'])
  expect(JSON.stringify([flex.container, split.container])).not.toMatch(/flexDirection|display|gridTemplate|breakpoint/)
})
```

- [ ] **Step 2: Run the proof test and verify missing definitions**

Run: `pnpm exec vitest run playground/src/components/widgets/container.test.ts`

Expected: FAIL because `playground/src/components/widgets/container.ts` and its exported definitions do not exist yet.

- [ ] **Step 3: Implement the external single-region flex material**

```ts
function resolveLinearDropIndex(
  ctx: ResolveContainerDropIndexContext,
  axis: 'x' | 'y',
): number {
  const pointer = axis === 'x' ? ctx.event.clientX : ctx.event.clientY
  for (const [index, element] of ctx.itemElements.entries()) {
    const rect = element.getBoundingClientRect()
    const midpoint = axis === 'x'
      ? rect.left + rect.width / 2
      : rect.top + rect.height / 2
    if (pointer < midpoint)
      return index
  }
  return ctx.itemElements.length
}

export const flexContainerMeta: DesignerWidgetMeta = {
  type: 'flex-container',
  title: 'Flex 容器',
  group: 'layout',
  defaultProps: { direction: 'column', wrap: false, gap: 12, align: 'stretch' },
  formSchema: { sections: [makeFlexPropertySection()] },
  container: {
    defaultVariant: 'single',
    variants: {
      single: { title: '默认', regions: [{ id: 'default', title: '内容' }] },
    },
  },
}

export const FlexContainer = defineComponent({
  props: flexProps,
  setup(props) {
    return () => h(ContainerRegionOutlet, {
      regionId: 'default',
      resolveDropIndex: (ctx: ResolveContainerDropIndexContext) =>
        resolveLinearDropIndex(ctx, props.direction === 'row' ? 'x' : 'y'),
      class: 'pg-container-flex',
      style: {
        display: 'flex',
        flexDirection: props.direction,
        flexWrap: props.wrap ? 'wrap' : 'nowrap',
        gap: `${props.gap}px`,
        alignItems: props.align,
      },
    })
  },
})
```

This code intentionally places flex semantics in playground, not framework packages.

- [ ] **Step 4: Implement the external irregular material and material-owned migration**

```ts
const variants = {
  'left-one-right-two': {
    title: '左一右二',
    regions: [
      { id: 'left', title: '左侧' },
      { id: 'rightTop', title: '右上' },
      { id: 'rightBottom', title: '右下' },
    ],
  },
  'top-one-bottom-two': {
    title: '上一下二',
    regions: [
      { id: 'top', title: '顶部' },
      { id: 'bottomLeft', title: '左下' },
      { id: 'bottomRight', title: '右下' },
    ],
  },
}

function migrateSplitVariant(ctx: ContainerVariantMigrationContext): ContainerVariantMigrationResult {
  const nodes = Object.values(ctx.state.regions).flat()
  const targetIds = ctx.toVariant.regions.map(region => region.id)
  if (targetIds.length === 0)
    return { allowed: false, code: 'SPLIT_VARIANT_HAS_NO_REGIONS' }
  const regions = Object.fromEntries(targetIds.map(id => [id, [] as SchemaNode[]]))
  nodes.forEach((node, index) => {
    const targetId = targetIds[Math.min(index, targetIds.length - 1)]!
    regions[targetId].push(node)
  })
  return { allowed: true, state: { variant: ctx.toVariantId, regions } }
}

export const splitContainerMeta: DesignerWidgetMeta = {
  type: 'split-container',
  title: '异形容器',
  group: 'layout',
  defaultProps: { gap: 12, primarySize: '40%' },
  formSchema: {
    sections: [{
      title: '布局',
      fields: [{
        key: 'variant',
        label: '布局变体',
        component: 'select',
        bindTo: { scope: 'container', path: 'variant' },
      }],
    }],
  },
  container: {
    defaultVariant: 'left-one-right-two',
    variants,
    migrateVariant: migrateSplitVariant,
  },
}

const region = (regionId: string, className: string) => h(ContainerRegionOutlet, {
  regionId,
  class: className,
  resolveDropIndex: (ctx: ResolveContainerDropIndexContext) => resolveLinearDropIndex(ctx, 'y'),
})

export const SplitContainer = defineComponent({
  name: 'PlaygroundSplitContainer',
  props: {
    gap: { type: Number, default: 12 },
    primarySize: { type: String, default: '40%' },
  },
  setup(props) {
    const runtime = useContainerRuntime()
    const style = () => ({
      '--pg-split-gap': `${props.gap}px`,
      '--pg-split-primary-size': props.primarySize,
    })
    return () => runtime.variant.value === 'left-one-right-two'
      ? h('div', { class: 'pg-split pg-split--left-one-right-two', style: style() }, [
          region('left', 'pg-split__left'),
          h('div', { class: 'pg-split__right' }, [
            region('rightTop', 'pg-split__right-top'),
            region('rightBottom', 'pg-split__right-bottom'),
          ]),
        ])
      : h('div', { class: 'pg-split pg-split--top-one-bottom-two', style: style() }, [
          region('top', 'pg-split__top'),
          h('div', { class: 'pg-split__bottom' }, [
            region('bottomLeft', 'pg-split__bottom-left'),
            region('bottomRight', 'pg-split__bottom-right'),
          ]),
        ])
  },
})
```

Register `{ meta: splitContainerMeta, component: SplitContainer }` and `{ meta: flexContainerMeta, component: FlexContainer }` in `playgroundWidgetDefinitions`. Put every `.pg-container-flex` and `.pg-split*` geometry rule in `playground/src/components/widgets/styles.css`; framework theme files receive only the interaction-state rules in Step 5.

- [ ] **Step 5: Add interaction-state theme styles only**

```css
.dc-container-region--active {
  outline: 1px dashed var(--dc-color-primary);
  outline-offset: -1px;
}

.dc-container-region--forbidden {
  outline-color: var(--dc-color-danger);
}

.dc-container-region__empty {
  min-height: 32px;
}
```

`--dc-color-danger` already exists in both theme token sets; do not add another color token.

- [ ] **Step 6: Update architecture and reference documentation**

Document these exact statements:

- `root.children` contains page nodes; container regions own their ordinary children.
- `flow/chrome/layer` remain root-only.
- Framework packages do not define flex/grid geometry.
- External container metas register variants, regions, constraints, migration, and renderer drop adapters.
- Variant form fields bind through `scope: 'container', path: 'variant'`.
- Container nesting is rejected in the current protocol.
- Schema version is unchanged.

Include links from the four reference pages to the design spec and the relevant public API sections.

- [ ] **Step 7: Run focused package tests**

Run: `pnpm --filter @dragcraft/core exec vitest run`

Run: `pnpm --filter @dragcraft/renderer exec vitest run`

Run: `pnpm --filter @dragcraft/designer exec vitest run`

Run: `pnpm --filter @dragcraft/form-generator exec vitest run`

Run: `pnpm --filter @dragcraft/widgets exec vitest run`

Expected: every command exits 0 with no failed tests.

- [ ] **Step 8: Run repository verification**

Run: `pnpm typecheck`

Expected: exit 0 with no TypeScript errors.

Run: `pnpm lint`

Expected: exit 0 with no ESLint errors.

Run: `pnpm test`

Expected: exit 0 with all workspace and root tests passing.

Run: `pnpm build`

Expected: exit 0 with all workspace packages built.

Run: `pnpm docs:build`

Expected: exit 0 with a successful VitePress build and no broken local links.

- [ ] **Step 9: Perform the spec-coverage audit**

Use this fixed checklist and record the result in the commit message body or implementation report:

```text
[ ] no framework layout geometry
[ ] root-only page placement
[ ] no nested containers
[ ] static and dynamic placement constraints
[ ] material-owned variant migration
[ ] structured command rejection and rollback
[ ] cross-owner add/move/remove/copy/undo
[ ] unresolved-container data preservation
[ ] region outlet renders each child once
[ ] material-owned insertion geometry
[ ] structure tree and variant binding
[ ] schema version unchanged
[ ] device-frame regression green
```

Every item must be checked before completion; a missing item requires returning to its owning task.

- [ ] **Step 10: Commit examples and documentation**

```bash
git add playground/src/components/widgets/container.ts playground/src/components/widgets/container.test.ts playground/src/components/widgets/index.ts playground/src/components/widgets/styles.css playground/src/components/widgets/messages.ts playground/src/config/templates/content-detail-schema.ts packages/themes/src/components/canvas.css .github/architecture/02-schema-and-core.md .github/architecture/03-designer-and-renderer.md .github/architecture/05-widgets-fields-and-utils.md .github/architecture/08-layout-system.md docs/reference/core.md docs/reference/designer.md docs/reference/renderer.md docs/reference/widgets-and-fields.md
git commit -m "docs: demonstrate external container materials"
```

---

## Final Review Gate

After Task 12, inspect `git log --oneline` and `git status --short`. The branch must contain the task commits, the worktree must contain no unintended changes, and the verification commands from Task 12 must have fresh exit-0 output before claiming completion.
