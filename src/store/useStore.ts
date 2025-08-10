'use client'
import { create } from 'zustand'
import { Factory, Multipliers, Resource, ExportShape, AdvancedSettings } from '@domain/types'
import { Repo } from '@repos/repo'
import { ExportSchema } from '@utils/schemas'

// precios (overlay)
import { PriceService, PricePrefs } from '@services/prices/service'
import { ManualPricesProvider } from '@services/prices/providers/manual'
import { SnapshotPricesProvider } from '@services/prices/providers/snapshot'
import { RemoteJsonPricesProvider } from '@services/prices/providers/remoteJson'
import type { IPriceProvider } from '@services/prices/types'
import { AnyPriceSnapshotSchema } from '@utils/schemas'
import { useState, useEffect } from 'react'

type PriceState = {
  priceProviderId: string
  priceOverlay: Record<string, { price: number; ts: number; source: string }>
  priceLastUpdated: number
  priceTTLms: number
  priceRemoteUrl?: string
  applyOverlayToResources: boolean
}

type State = {
  resources: Resource[]
  factories: Factory[]
  multipliers: Multipliers
  advanced: AdvancedSettings
  repo?: Repo
  isHydrated: boolean
} & PriceState

type PriceActions = {
  setProvider: (id: 'manual' | 'snapshot' | 'remote-json') => void
  setTTL: (ms: number) => void
  setRemoteUrl: (url: string) => void
  refreshPrices: () => Promise<void>
  importSnapshotText: (txt: string) => Promise<void>
  clearOverlay: () => void
}

type Actions = {
  initFromRepo: (repo: Repo) => Promise<void>
  upsertResource: (r: Resource) => void
  deleteResource: (id: string) => void
  upsertFactory: (f: Factory) => void
  deleteFactory: (id: string) => void
  setMultipliers: (m: Multipliers) => void
  setWorkshopStars: (resourceId: string, starsHalf: number) => void
  setMasteryLevel: (resourceId: string, level: number) => void
  exportAll: () => string
  importAll: (json: string) => void
  resetAll: () => void
  setHydrated: () => void
} & PriceActions

// === SINGLETON PriceService ===
let priceService: PriceService | null = null
function ensurePriceService(getResources: () => Resource[], prefs?: Partial<PricePrefs>) {
  if (priceService) return priceService
  const base = new ManualPricesProvider()
  priceService = new PriceService(base, prefs)
  return priceService
}
function buildProvider(id: string, url?: string, snapshotObj?: any): IPriceProvider {
  if (id === 'snapshot') {
    const p = new SnapshotPricesProvider()
    if (snapshotObj) p.setSnapshotObject(snapshotObj)
    return p
  }
  if (id === 'remote-json') return new RemoteJsonPricesProvider(url || '')
  return new ManualPricesProvider()
}

// Función para cargar preferencias de precios de forma segura
function loadPricePrefs(): Partial<PricePrefs> | null {
  if (typeof window === 'undefined') return null
  try {
    return PriceService.loadPrefs()
  } catch {
    return null
  }
}

export const useAppStore = create<State & Actions>()((set, get) => ({
  resources: [],
  factories: [],
  multipliers: {},
  advanced: { workshopStarsHalf: {}, masteryLevel: {} },
  repo: undefined,
  isHydrated: false,

  // estado de precios - valores por defecto sin localStorage
  priceProviderId: 'manual',
  priceOverlay: {},
  priceLastUpdated: 0,
  priceTTLms: 300_000,
  priceRemoteUrl: '',
  applyOverlayToResources: false,

  setHydrated: () => set({ isHydrated: true }),

  initFromRepo: async (repo: Repo) => {
    const data = await repo.load()
    set({
      repo,
      resources: data?.resources ?? [],
      factories: data?.factories ?? [],
      multipliers: data?.multipliers ?? {},
      advanced: data?.advanced ?? { workshopStarsHalf: {}, masteryLevel: {} }
    })

    // Cargar preferencias de precios solo después de la hidratación
    const saved = loadPricePrefs()
    if (saved) {
      set({
        priceProviderId: saved.providerId || 'manual',
        priceTTLms: saved.ttlMs || 300_000,
        priceRemoteUrl: saved.remoteUrl || '',
        applyOverlayToResources: saved.applyOverlayToResources || false
      })
    }

    // init price service
    const svc = ensurePriceService(() => get().resources, saved ?? undefined)
    const provider = buildProvider(get().priceProviderId, get().priceRemoteUrl)
    svc.setProvider(provider)
    if (svc.isStale()) {
      await get().refreshPrices()
    } else {
      set({ priceOverlay: svc.getOverlay(), priceLastUpdated: svc.getLastUpdated() })
    }
  },

  upsertResource: async (r: Resource) => {
    const repo = get().repo; if (repo) await repo.upsertResource(r)
    set(state => ({ resources: [...state.resources.filter(x => x.id !== r.id), r] }))
  },

  deleteResource: async (id: string) => {
    const repo = get().repo; if (repo) await repo.deleteResource(id)
    set(state => ({ resources: state.resources.filter(r => r.id !== id) }))
  },

  upsertFactory: async (f: Factory) => {
    const repo = get().repo; if (repo) await repo.upsertFactory(f)
    set(state => ({ factories: [...state.factories.filter(x => x.id !== f.id), f] }))
  },

  deleteFactory: async (id: string) => {
    const repo = get().repo; if (repo) await repo.deleteFactory(id)
    set(state => ({ factories: state.factories.filter(f => f.id !== id) }))
  },

  setMultipliers: async (m: Multipliers) => {
    const repo = get().repo; if (repo) await repo.setMultipliers(m)
    set({ multipliers: m })
  },

  setWorkshopStars: (resourceId, starsHalf) => {
    set(state => ({ advanced: { ...state.advanced, workshopStarsHalf: { ...(state.advanced.workshopStarsHalf ?? {}), [resourceId]: Math.max(0, Math.min(10, Math.round(starsHalf))) } } }))
  },

  setMasteryLevel: (resourceId, level) => {
    set(state => ({ advanced: { ...state.advanced, masteryLevel: { ...(state.advanced.masteryLevel ?? {}), [resourceId]: Math.max(0, Math.min(10, Math.round(level))) } } }))
  },

  exportAll: () => {
    const data: ExportShape = { version: 2, resources: get().resources, factories: get().factories, multipliers: get().multipliers, advanced: get().advanced }
    return JSON.stringify(data, null, 2)
  },

  importAll: (json: string) => {
    const parsed = ExportSchema.parse(JSON.parse(json))
    const repo = get().repo; if (repo) repo.saveAll(parsed)
    set({ resources: parsed.resources, factories: parsed.factories, multipliers: parsed.multipliers, advanced: parsed.advanced ?? { workshopStarsHalf: {}, masteryLevel: {} } })
  },

  resetAll: async () => {
    const repo = get().repo; if (repo) await repo.reset()
    const reloaded = await repo?.load()
    set({ resources: reloaded?.resources ?? [], factories: reloaded?.factories ?? [], multipliers: reloaded?.multipliers ?? {}, advanced: reloaded?.advanced ?? { workshopStarsHalf: {}, masteryLevel: {} } })
  },

  // === acciones de precios ===
  setProvider: (id) => {
    const svc = ensurePriceService(() => get().resources)
    const provider = buildProvider(id, get().priceRemoteUrl)
    svc.setProvider(provider)
    svc.updatePrefs({ providerId: id })
    set({ priceProviderId: id })
  },

  setTTL: (ms) => {
    const svc = ensurePriceService(() => get().resources)
    svc.updatePrefs({ ttlMs: ms })
    set({ priceTTLms: ms })
  },

  setRemoteUrl: (url) => {
    const svc = ensurePriceService(() => get().resources)
    if (get().priceProviderId === 'remote-json') {
      svc.setProvider(buildProvider('remote-json', url))
    }
    svc.updatePrefs({ remoteUrl: url })
    set({ priceRemoteUrl: url })
  },

  importSnapshotText: async (txt: string) => {
    const json = JSON.parse(txt)
    AnyPriceSnapshotSchema.parse(json)
    const svc = ensurePriceService(() => get().resources)
    const p = buildProvider('snapshot', undefined, json)
    svc.setProvider(p)
    svc.updatePrefs({ providerId: 'snapshot' })
    set({ priceProviderId: 'snapshot' })
    await get().refreshPrices()
  },

  refreshPrices: async () => {
    const svc = ensurePriceService(() => get().resources)
    const overlay = await svc.refresh({ resources: get().resources })
    set({ priceOverlay: overlay, priceLastUpdated: Date.now() })
    if (get().applyOverlayToResources) {
      const repo = get().repo
      const updated = get().resources.map(r => overlay[r.id] ? { ...r, marketPriceDino: overlay[r.id].price } : r)
      if (repo) await repo.saveAll({ version: 2, resources: updated, factories: get().factories, multipliers: get().multipliers, advanced: get().advanced })
      set({ resources: updated })
    }
  },

  clearOverlay: () => set({ priceOverlay: {}, priceLastUpdated: 0 })
}))

// Hook personalizado para manejar la hidratación
export const useHydration = () => {
  const [isHydrated, setIsHydrated] = useState(false)
  
  useEffect(() => {
    setIsHydrated(true)
  }, [])
  
  return isHydrated
}