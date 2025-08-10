import type { IPriceProvider, NormalizedPrice } from '../types'
import { toResourceId } from '@utils/priceKeys'

export class SnapshotPricesProvider implements IPriceProvider {
  id = 'snapshot'
  ttlMs = 15 * 60_000
  private parsed: any | null = null

  setSnapshotObject(obj: any) { this.parsed = obj }

  async fetchAll(): Promise<NormalizedPrice[]> {
    if (!this.parsed) return []
    const now = Date.now()
    const out: NormalizedPrice[] = []

    if (this.parsed.prices && typeof this.parsed.prices === 'object') {
      for (const key of Object.keys(this.parsed.prices)) {
        const item = this.parsed.prices[key]
        const rid = toResourceId(key)
        const price = Number(item?.currentPrice ?? item?.price ?? 0)
        if (!Number.isFinite(price)) continue
        const tsRaw = item?.lastUpdated
        const ts = typeof tsRaw === 'number' ? tsRaw : Date.parse(tsRaw || '') || now
        out.push({ resourceId: rid, price, ts, source: this.id })
      }
      return out
    }

    let found = false
    for (const key of Object.keys(this.parsed)) {
      const val = this.parsed[key]
      if (typeof val === 'number') {
        found = true
        out.push({ resourceId: toResourceId(key), price: val, ts: now, source: this.id })
      }
    }
    return found ? out : []
  }
}