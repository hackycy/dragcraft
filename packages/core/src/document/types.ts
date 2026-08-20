export type JsonPrimitive = boolean | null | number | string
/** Dynamic document data; JSON validity is checked at import and material registration. */
export type JsonObject = Record<string, any>
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[]

export type NodeId = string
export type NodeType = string
export type RegionId = string

export type DeepReadonly<T>
  = T extends JsonPrimitive
    ? T
    : T extends readonly (infer Item)[]
      ? readonly DeepReadonly<Item>[]
      : T extends object
        ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
        : T

export interface PageDefinition {
  props: JsonObject
  style?: JsonObject
}

export interface NodeDefinition {
  id: NodeId
  type: NodeType
  props: JsonObject
  style?: JsonObject
}

export interface ContainerStructure {
  regions: Record<RegionId, NodeId[]>
}

export interface DocumentStructure {
  root: NodeId[]
  containers: Record<NodeId, ContainerStructure>
}

export interface DocumentSchema {
  version: string
  globalConfig: JsonObject
  page: PageDefinition
  nodes: NodeDefinition[]
  structure: DocumentStructure
}
