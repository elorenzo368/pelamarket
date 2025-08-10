import { z } from 'zod'

export const ResourceSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  ticker: z.string().optional(),
  marketPriceDino: z.number().optional(),
  notes: z.string().optional()
})

export const IngredientSchema = z.object({
  resourceId: z.string(),
  qty: z.number().nonnegative()
})

export const FactorySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  level: z.number().int().min(1),
  inputs: z.array(IngredientSchema),
  outputs: z.array(IngredientSchema),
  cycleTimeSec: z.number().positive(),
  consumesDynoCoinPerCycle: z.number().nonnegative().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional()
})

export const MultipliersSchema = z.object({
  workersPct: z.number().optional(),
  workshopPct: z.number().optional(),
  adsPct: z.number().optional(),
  customPct: z.number().optional()
})

export const AdvancedSchema = z.object({
  workshopStarsHalf: z.record(z.string(), z.number().int().min(0).max(10)).optional(),
  masteryLevel: z.record(z.string(), z.number().int().min(0).max(10)).optional()
}).optional()

export const ExportSchema = z.object({
  version: z.number(),
  resources: z.array(ResourceSchema),
  factories: z.array(FactorySchema),
  multipliers: MultipliersSchema,
  advanced: AdvancedSchema
})

// snapshots de precios permitidos
export const PriceSnapshotSchemaA = z.object({
  prices: z.record(z.string(), z.object({
    currentPrice: z.number(),
    lastUpdated: z.union([z.string(), z.number()]).optional()
  }))
})
export const PriceSnapshotSchemaB = z.record(z.string(), z.number())
export const AnyPriceSnapshotSchema = z.union([PriceSnapshotSchemaA, PriceSnapshotSchemaB])