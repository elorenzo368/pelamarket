'use client'
import type { IPriceProvider, NormalizedPrice, FetchContext } from './types'

type Overlay = Record<string, { price: number; ts: number; source: string }>

const LS_KEY = 'cw:v2:price_prefs'
const CACHE_KEY = 'cw:v2:price_overlay'

export type PricePrefs = {
  providerId: string
  remoteUrl?: string
  ttlMs?: number
  applyOverlayToResources?: boolean
}

export class PriceService {
  private provider: IPriceProvider
  private overlay: Overlay = {}
  private lastUpdated = 0
  private prefs: PricePrefs

  constructor(defaultProvider: IPriceProvider, prefs?: Partial<PricePrefs>) {
    this.provider = defaultProvider
    this.prefs = { providerId: defaultProvider.id, ttlMs: defaultProvider.ttlMs ?? 300_000, applyOverlayToResources: false, ...prefs }
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
      if (cached && cached.overlay) {
        this.overlay = cached.overlay
        this.lastUpdated = cached.lastUpdated || 0
      }
    } catch {}
  }

  getOverlay() { return this.overlay }
  getLastUpdated() { return this.lastUpdated }
  getPrefs() { return this.prefs }

  setProvider(p: IPriceProvider) {
    this.provider?.dispose?.()
    this.provider = p
    this.prefs.providerId = p.id
    this.savePrefs()
  }

  updatePrefs(patch: Partial<PricePrefs>) {
    this.prefs = { ...this.prefs, ...patch }
    this.savePrefs()
  }

  private savePrefs() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(this.prefs)) } catch {}
  }

  static loadPrefs(): PricePrefs | null {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null') } catch { return null }
  }

  async refresh(ctx?: FetchContext) {
    const prices: NormalizedPrice[] = await this.provider.fetchAll(ctx)
    const overlay: Overlay = {}
    for (const p of prices) overlay[p.resourceId] = { price: p.price, ts: p.ts, source: p.source }
    this.overlay = overlay
    this.lastUpdated = Date.now()
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ overlay: this.overlay, lastUpdated: this.lastUpdated })) } catch {}
    return overlay
  }

  isStale(): boolean {
    const ttl = this.prefs.ttlMs ?? this.provider.ttlMs ?? 300_000
    return !this.lastUpdated || Date.now() - this.lastUpdated > ttl
  }
}