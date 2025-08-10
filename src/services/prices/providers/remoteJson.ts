import type { IPriceProvider, NormalizedPrice } from '../types'
import { toResourceId } from '@utils/priceKeys'

export class RemoteJsonPricesProvider implements IPriceProvider {
  id = 'remote-json'
  ttlMs = 60 * 1000
  constructor(private url: string) {}

  async fetchAll(): Promise<NormalizedPrice[]> {
    const res = await fetch(this.url, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
    const obj = await res.json()
    const now = Date.now()
    const out: NormalizedPrice[] = []

    if (obj?.prices && typeof obj.prices === 'object') {
      for (const key of Object.keys(obj.prices)) {
        const item = obj.prices[key]
        const rid = toResourceId(key)
        const price = Number(item?.currentPrice ?? item?.price ?? 0)
        if (!Number.isFinite(price)) continue
        const tsRaw = item?.lastUpdated
        const ts = typeof tsRaw === 'number' ? tsRaw : Date.parse(tsRaw || '') || now
        out.push({ resourceId: rid, price, ts, source: this.id })
      }
      return out
    }
    for (const key of Object.keys(obj)) {
      const val = obj[key]
      if (typeof val === 'number') out.push({ resourceId: toResourceId(key), price: val, ts: now, source: this.id })
    }
    return out
  }
}