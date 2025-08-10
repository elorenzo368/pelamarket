import type { ExportShape, Factory, Resource } from '@domain/types'

export function importFromCraftworldTips(raw: string, level: number = 1): ExportShape | null {
  if (!raw || typeof raw !== 'string') return null
  // 1) ¿Es JSON?
  try { const maybe = JSON.parse(raw); return fromUnknownShape(maybe, level) } catch {}

  // 2) Ejecutar en sandbox y capturar variables (u / FACTORY_PRODUCTION_DATA)
  try {
    const sandbox: any = { window: {}, globalThis: {} }
    const fn = new Function('sandbox', `with (sandbox) { ${raw}; return { window, globalThis, u, FACTORY_PRODUCTION_DATA }; }`)
    const res: any = fn(sandbox)

    if (res?.window?.FACTORY_PRODUCTION_DATA || res?.FACTORY_PRODUCTION_DATA) {
      const data = res.window?.FACTORY_PRODUCTION_DATA ?? res.FACTORY_PRODUCTION_DATA
      return fromFACTORY_PRODUCTION_DATA(data, level)
    }
    if (res?.u) return fromUShape(res.u)
  } catch {}

  // 3) Regex directa FACTORY_PRODUCTION_DATA = {...}
  try {
    const m = raw.match(/FACTORY_PRODUCTION_DATA\s*=\s*(\{[\s\S]*?\})\s*[/;]?/)
    if (m) { const maybe = new Function(`return (${m[1]})`)(); return fromFACTORY_PRODUCTION_DATA(maybe, level) }
  } catch {}

  return null
}

function fromUnknownShape(obj: any, level: number): ExportShape | null {
  if (!obj || typeof obj !== 'object') return null
  if (obj.FACTORY_PRODUCTION_DATA) return fromFACTORY_PRODUCTION_DATA(obj.FACTORY_PRODUCTION_DATA, level)
  if (obj.u) return fromUShape(obj.u)
  return fromFACTORY_PRODUCTION_DATA(obj, level)
}

function fromUShape(u: Record<string, any>): ExportShape {
  const resources: Resource[] = []
  const factories: Factory[] = []
  Object.keys(u).forEach((key) => {
    const v = u[key]
    resources.push({ id: key.toLowerCase(), name: capitalize(key), marketPriceDino: 0 })
    const inputs = (v.inputs ?? []).map((i: any) => ({ resourceId: (i.resource || '').toLowerCase(), qty: Number(i.amount) || 0 }))
    const outputs = (v.outputs ?? []).map((o: any) => ({ resourceId: (o.resource || '').toLowerCase(), qty: Number(o.amount) || 0 }))
    factories.push({ id: `cw-${key.toLowerCase()}`, name: capitalize(key), level: Number(v.level) || 1, inputs, outputs, cycleTimeSec: Number(v.duration || 0) / 1000, consumesDynoCoinPerCycle: 0 })
  })
  return { version: 2, resources: dedupeResources(resources), factories, multipliers: {}, advanced: { workshopStarsHalf: {}, masteryLevel: {} } }
}

function fromFACTORY_PRODUCTION_DATA(data: Record<string, any>, level: number): ExportShape {
  const resources: Resource[] = []
  const factories: Factory[] = []
  Object.keys(data).forEach((resourceKey) => {
    const levels = data[resourceKey] || {}
    const picked = levels[level] || levels[1]
    if (!picked) return
    resources.push({ id: resourceKey.toLowerCase(), name: capitalize(resourceKey), marketPriceDino: 0 })
    const inputs = Object.entries(picked.input || {}).map(([res, qty]) => ({ resourceId: (res as string).toLowerCase(), qty: Number(qty) || 0 }))
    const outputs = [{ resourceId: resourceKey.toLowerCase(), qty: Number(picked.output) || 0 }]
    factories.push({ id: `cw-${resourceKey.toLowerCase()}-l${level}`, name: `${capitalize(resourceKey)} L${level}`, level, inputs, outputs, cycleTimeSec: Number(picked.duration || 0) / 1000, consumesDynoCoinPerCycle: 0 })
  })
  return { version: 2, resources: dedupeResources(resources), factories, multipliers: {}, advanced: { workshopStarsHalf: {}, masteryLevel: {} } }
}

function dedupeResources(list: Resource[]): Resource[] { const map = new Map<string, Resource>(); for (const r of list) map.set(r.id, r); return Array.from(map.values()) }
function capitalize(s: string) { const lo = (s || '').toLowerCase(); return lo.charAt(0).toUpperCase() + lo.slice(1) }