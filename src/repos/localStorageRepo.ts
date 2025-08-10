import { Repo } from './repo'
import { ExportShape, Factory, Multipliers, Resource } from '@domain/types'
import { ExportSchema } from '@utils/schemas'

const NS = 'cw'
const VERSION = 2

function key(k: string) { return `${NS}:v${VERSION}:${k}` }
const K_RES = key('resources')
const K_FAC = key('factories')
const K_MUL = key('multipliers')
const K_ADV = key('advanced')
const K_VER = `${NS}:version`

const seed: ExportShape = {
  version: VERSION,
  resources: [
    { id: 'earth', name: 'Earth', marketPriceDino: 1.0 },
    { id: 'water', name: 'Water', marketPriceDino: 1.0 },
    { id: 'fire', name: 'Fire', marketPriceDino: 2.0 },
    { id: 'mud', name: 'Mud', marketPriceDino: 2.5 },
    { id: 'clay', name: 'Clay', marketPriceDino: 3.0 },
    { id: 'sand', name: 'Sand', marketPriceDino: 1.8 },
    { id: 'copper', name: 'Copper', marketPriceDino: 5.0 },
    { id: 'steel', name: 'Steel', marketPriceDino: 9.0 },
    { id: 'gas', name: 'Gas', marketPriceDino: 4.0 }
  ],
  factories: [
    { id: 'f1', name: 'Mud Maker', level: 1, inputs: [{ resourceId: 'earth', qty: 1 }, { resourceId: 'water', qty: 1 }], outputs: [{ resourceId: 'mud', qty: 1 }], cycleTimeSec: 60, consumesDynoCoinPerCycle: 0.05 },
    { id: 'f2', name: 'Clay Kiln', level: 1, inputs: [{ resourceId: 'mud', qty: 2 }, { resourceId: 'fire', qty: 1 }], outputs: [{ resourceId: 'clay', qty: 1 }], cycleTimeSec: 90, consumesDynoCoinPerCycle: 0.1 }
  ],
  multipliers: { workersPct: 0, workshopPct: 0, adsPct: 0, customPct: 0 },
  advanced: { workshopStarsHalf: {}, masteryLevel: {} }
}

export class LocalStorageRepo implements Repo {
  private ensureInit() {
    if (typeof window === 'undefined') return
    const ver = Number(localStorage.getItem(K_VER) ?? '0')
    if (ver !== VERSION) {
      const prevRes = localStorage.getItem(K_RES)
      const prevFac = localStorage.getItem(K_FAC)
      const prevMul = localStorage.getItem(K_MUL)
      const prevAdv = localStorage.getItem(K_ADV)
      if (!prevRes || !prevFac || !prevMul) {
        localStorage.setItem(K_RES, JSON.stringify(seed.resources))
        localStorage.setItem(K_FAC, JSON.stringify(seed.factories))
        localStorage.setItem(K_MUL, JSON.stringify(seed.multipliers))
        localStorage.setItem(K_ADV, JSON.stringify(seed.advanced))
      } else {
        if (!prevAdv) localStorage.setItem(K_ADV, JSON.stringify({ workshopStarsHalf: {}, masteryLevel: {} }))
      }
      localStorage.setItem(K_VER, String(VERSION))
    }
  }

  async load(): Promise<ExportShape | null> {
    if (typeof window === 'undefined') return null
    this.ensureInit()
    const data: ExportShape = {
      version: VERSION,
      resources: JSON.parse(localStorage.getItem(K_RES) ?? '[]'),
      factories: JSON.parse(localStorage.getItem(K_FAC) ?? '[]'),
      multipliers: JSON.parse(localStorage.getItem(K_MUL) ?? '{}'),
      advanced: JSON.parse(localStorage.getItem(K_ADV) ?? '{}')
    }
    return ExportSchema.parse(data)
  }

  async saveAll(data: ExportShape): Promise<void> {
    if (typeof window === 'undefined') return
    const parsed = ExportSchema.parse(data)
    localStorage.setItem(K_RES, JSON.stringify(parsed.resources))
    localStorage.setItem(K_FAC, JSON.stringify(parsed.factories))
    localStorage.setItem(K_MUL, JSON.stringify(parsed.multipliers))
    localStorage.setItem(K_ADV, JSON.stringify(parsed.advanced ?? { workshopStarsHalf: {}, masteryLevel: {} }))
    localStorage.setItem(K_VER, String(VERSION))
  }

  async getResources(): Promise<Resource[]> { const all = await this.load(); return all?.resources ?? [] }
  async upsertResource(r: Resource): Promise<void> { const all = await this.load(); if (!all) return; const list = all.resources.filter(x => x.id !== r.id); list.push(r); await this.saveAll({ ...all, resources: list }) }
  async deleteResource(id: string): Promise<void> { const all = await this.load(); if (!all) return; await this.saveAll({ ...all, resources: all.resources.filter(r => r.id != id) }) }

  async getFactories(): Promise<Factory[]> { const all = await this.load(); return all?.factories ?? [] }
  async upsertFactory(f: Factory): Promise<void> { const all = await this.load(); if (!all) return; const list = all.factories.filter(x => x.id !== f.id); list.push(f); await this.saveAll({ ...all, factories: list }) }
  async deleteFactory(id: string): Promise<void> { const all = await this.load(); if (!all) return; await this.saveAll({ ...all, factories: all.factories.filter(f => f.id != id) }) }

  async getMultipliers(): Promise<Multipliers> { const all = await this.load(); return all?.multipliers ?? {} }
  async setMultipliers(m: Multipliers): Promise<void> { const all = await this.load(); if (!all) return; await this.saveAll({ ...all, multipliers: m }) }

  async reset(): Promise<void> {
    if (typeof window === 'undefined') return
    localStorage.removeItem(K_RES); localStorage.removeItem(K_FAC); localStorage.removeItem(K_MUL); localStorage.removeItem(K_ADV); localStorage.removeItem(K_VER)
    this.ensureInit()
  }
}