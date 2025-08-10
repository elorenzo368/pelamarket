import type { Resource } from '@domain/types'

export type NormalizedPrice = {
  resourceId: string
  price: number
  ts: number
  source: string
}

export type FetchContext = {
  resources: Resource[]
}

export interface IPriceProvider {
  id: string
  ttlMs?: number
  init?(): Promise<void>
  fetchAll(ctx?: FetchContext): Promise<NormalizedPrice[]>
  dispose?(): void
}