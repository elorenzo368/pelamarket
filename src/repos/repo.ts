import { ExportShape, Factory, Multipliers, Resource } from '@domain/types'

export interface Repo {
  load(): Promise<ExportShape | null>
  saveAll(data: ExportShape): Promise<void>

  getResources(): Promise<Resource[]>
  upsertResource(r: Resource): Promise<void>
  deleteResource(id: string): Promise<void>

  getFactories(): Promise<Factory[]>
  upsertFactory(f: Factory): Promise<void>
  deleteFactory(id: string): Promise<void>

  getMultipliers(): Promise<Multipliers>
  setMultipliers(m: Multipliers): Promise<void>

  reset(): Promise<void>
}