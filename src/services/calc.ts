import { Factory, Ingredient, Multipliers, Resource, AdvancedSettings } from '@domain/types'
import { WORKSHOP_MODIFIERS, MASTERY_BONUSES } from './craftworldModifiers'

function resKey(resourceId: string): string { return (resourceId || '').toUpperCase() }

function workshopBonusPctFor(resourceId: string, adv?: AdvancedSettings): number {
  const starsHalf = adv?.workshopStarsHalf?.[resourceId] ?? 0
  const table = WORKSHOP_MODIFIERS[resKey(resourceId)]
  if (!table) {
    const fallback = WORKSHOP_MODIFIERS['MUD'] || Array.from({length:11}, (_,i)=>i*10)
    return fallback[Math.max(0, Math.min(10, starsHalf))] || 0
  }
  const idx = Math.max(0, Math.min(10, starsHalf))
  return table[idx] || 0
}

function masteryMult(resourceId: string, adv?: AdvancedSettings): number {
  const lvl = adv?.masteryLevel?.[resourceId] ?? 0
  return MASTERY_BONUSES[lvl as keyof typeof MASTERY_BONUSES] ?? 1
}

export function effectiveSpeed(m: Multipliers, resourceIdForWorkshop?: string, adv?: AdvancedSettings): number {
  const w = 1 + (m.workersPct ?? 0)
  const wsGlobal = 1 + (m.workshopPct ?? 0)
  const wsRes = 1 + (workshopBonusPctFor(resourceIdForWorkshop || '', adv) / 100)
  const ads = 1 + (m.adsPct ?? 0)
  const c = 1 + (m.customPct ?? 0)
  return w * wsGlobal * wsRes * ads * c
}

export function effectiveCycleTime(cycleTimeSec: number, m: Multipliers, resourceIdForWorkshop?: string, adv?: AdvancedSettings): number {
  return cycleTimeSec / Math.max(0.0001, effectiveSpeed(m, resourceIdForWorkshop, adv))
}

function priceOf(resourceId: string, resources: Resource[], overlay?: Record<string, { price: number }>): number {
  const over = overlay?.[resourceId]?.price
  if (typeof over === 'number' && Number.isFinite(over)) return over
  const r = resources.find(r => r.id === resourceId)
  return r?.marketPriceDino ?? 0
}

function effectiveInputQty(ing: Ingredient, adv?: AdvancedSettings): number {
  return ing.qty / masteryMult(ing.resourceId, adv)
}

export function costPerCycleDino(factory: Factory, resources: Resource[], adv?: AdvancedSettings, priceOverlay?: Record<string, { price: number }>): number {
  const inputsCost = (factory.inputs ?? []).reduce((sum, ing) => sum + effectiveInputQty(ing, adv) * priceOf(ing.resourceId, resources, priceOverlay), 0)
  return inputsCost + (factory.consumesDynoCoinPerCycle ?? 0)
}

export function outputsQtyTotal(outputs: Ingredient[]): number {
  return (outputs ?? []).reduce((sum, o) => sum + o.qty, 0)
}

export function costPerUnitByOutput(factory: Factory, resources: Resource[], adv?: AdvancedSettings, priceOverlay?: Record<string, { price: number }>): Record<string, number> {
  const total = outputsQtyTotal(factory.outputs)
  const cpc = costPerCycleDino(factory, resources, adv, priceOverlay)
  const map: Record<string, number> = {}
  if (total <= 0) return map
  for (const o of factory.outputs) {
    const share = o.qty / total
    const costForThisOutput = cpc * share
    map[o.resourceId] = costForThisOutput / Math.max(0.000001, o.qty)
  }
  return map
}

export function unitsPerHourForOutput(factory: Factory, m: Multipliers, o: Ingredient, adv?: AdvancedSettings): number {
  const ect = effectiveCycleTime(factory.cycleTimeSec, m, o.resourceId, adv)
  return (o.qty * 3600) / ect
}

export function hourlyMarginDino(factory: Factory, resources: Resource[], m: Multipliers, adv?: AdvancedSettings, priceOverlay?: Record<string, { price: number }>): number {
  const perUnitCost = costPerUnitByOutput(factory, resources, adv, priceOverlay)
  let sum = 0
  for (const o of factory.outputs) {
    const unitPrice = priceOf(o.resourceId, resources, priceOverlay)
    const unitCost = perUnitCost[o.resourceId] ?? 0
    const marginUnit = unitPrice - unitCost
    const uph = unitsPerHourForOutput(factory, m, o, adv)
    sum += uph * marginUnit
  }
  return sum
}

export function inputsPerHour(factory: Factory, m: Multipliers, adv?: AdvancedSettings): Ingredient[] {
  const ect = effectiveCycleTime(factory.cycleTimeSec, m, factory.outputs[0]?.resourceId, adv)
  const cyclesPerHour = 3600 / ect
  return (factory.inputs ?? []).map(i => ({ resourceId: i.resourceId, qty: effectiveInputQty(i, adv) * cyclesPerHour }))
}

export function outputsPerHour(factory: Factory, m: Multipliers, adv?: AdvancedSettings): Ingredient[] {
  const ect = effectiveCycleTime(factory.cycleTimeSec, m, factory.outputs[0]?.resourceId, adv)
  const cyclesPerHour = 3600 / ect
  return (factory.outputs ?? []).map(o => ({ resourceId: o.resourceId, qty: o.qty * cyclesPerHour }))
}

export function calcFactoryMetrics(factory: Factory, resources: Resource[], m: Multipliers, adv?: AdvancedSettings, priceOverlay?: Record<string, { price: number }>) {
  const perUnitCost = costPerUnitByOutput(factory, resources, adv, priceOverlay)
  const outsH = (factory.outputs ?? []).map(o => {
    const unitsPerHour = unitsPerHourForOutput(factory, m, o, adv)
    const name = resources.find(r => r.id === o.resourceId)?.name ?? o.resourceId
    const marketPrice = priceOf(o.resourceId, resources, priceOverlay)
    return { resourceId: o.resourceId, name, unitsPerHour, unitCost: perUnitCost[o.resourceId] ?? 0, marketPrice }
  })
  return { factory, outputsPerHour: outsH, hourlyMarginDino: hourlyMarginDino(factory, resources, m, adv, priceOverlay) }
}

export function sumHourlyMargin(metrics: ReturnType<typeof calcFactoryMetrics>[]): number {
  return metrics.reduce((s, m) => s + m.hourlyMarginDino, 0)
}

export function findBottlenecks(factories: Factory[], resources: Resource[], m: Multipliers, adv?: AdvancedSettings) {
  const map = new Map<string, number>()
  for (const f of factories) {
    for (const o of outputsPerHour(f, m, adv)) map.set(o.resourceId, (map.get(o.resourceId) ?? 0) + o.qty)
    for (const i of inputsPerHour(f, m, adv)) map.set(i.resourceId, (map.get(i.resourceId) ?? 0) - i.qty)
  }
  const list = [...map.entries()].filter(([, v]) => v < 0).map(([rid, netSupply]) => ({ resourceId: rid, name: resources.find(r => r.id === rid)?.name ?? rid, netSupply }))
  return list.sort((a, b) => a.netSupply - b.netSupply)
}