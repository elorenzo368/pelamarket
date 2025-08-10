import { describe, it, expect, vi } from 'vitest'
import { SnapshotPricesProvider } from '@services/prices/providers/snapshot'
import { RemoteJsonPricesProvider } from '@services/prices/providers/remoteJson'

describe('price providers', () => {
  it('parses snapshot formats', async () => {
    const p = new SnapshotPricesProvider()
    p.setSnapshotObject({ prices: { COPPER: { currentPrice: 5, lastUpdated: 1000 } } })
    const a = await p.fetchAll()
    expect(a[0]).toMatchObject({ resourceId: 'copper', price: 5, ts: 1000 })

    p.setSnapshotObject({ COPPER: 6 })
    const b = await p.fetchAll()
    expect(b[0]).toMatchObject({ resourceId: 'copper', price: 6 })
  })

  it('fetches remote json', async () => {
    const mock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ COPPER: 7 }),
      status: 200,
      statusText: 'OK'
    }) as any
    ;(globalThis as any).fetch = mock
    const p = new RemoteJsonPricesProvider('http://test')
    const res = await p.fetchAll()
    expect(mock).toHaveBeenCalled()
    expect(res[0]).toMatchObject({ resourceId: 'copper', price: 7 })
  })
})
