import type { IPriceProvider, NormalizedPrice, FetchContext } from '../types'

export class ManualPricesProvider implements IPriceProvider {
  id = 'manual'
  ttlMs = 5 * 60_000

  async fetchAll(ctx?: FetchContext): Promise<NormalizedPrice[]> {
    const now = Date.now()
    const resources = ctx?.resources ?? []
    return resources.map(r => ({
      resourceId: r.id,
      price: r.marketPriceDino ?? 0,
      ts: now,
      source: this.id
    }))
  }
}