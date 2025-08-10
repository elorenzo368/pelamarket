export type ResourceId = string

export interface Resource {
  id: ResourceId
  name: string
  ticker?: string
  marketPriceDino?: number
  notes?: string
}

export interface Ingredient {
  resourceId: ResourceId
  qty: number
}

export type FactoryId = string

export interface Factory {
  id: FactoryId
  name: string
  level: number
  inputs: Ingredient[]
  outputs: Ingredient[]
  cycleTimeSec: number
  consumesDynoCoinPerCycle?: number
  tags?: string[]
  notes?: string
}

export interface Multipliers {
  workersPct?: number
  workshopPct?: number
  adsPct?: number
  customPct?: number
}

export interface AdvancedSettings {
  workshopStarsHalf?: Record<ResourceId, number>
  masteryLevel?: Record<ResourceId, number>
}

export interface ExportShape {
  version: number
  resources: Resource[]
  factories: Factory[]
  multipliers: Multipliers
  advanced?: AdvancedSettings
}