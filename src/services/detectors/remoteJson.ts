import { AutoDetector, DetectOptions } from './index'
import { ExportShape } from '@domain/types'
import { ExportSchema } from '@utils/schemas'

export const remoteJsonDetector: AutoDetector = {
  async detect(opts: DetectOptions): Promise<ExportShape | null> {
    if (!opts.urlTemplate) return null
    const url = opts.urlTemplate.replace('{voyaId}', encodeURIComponent(opts.voyaId || ''))
    try {
      const res = await fetch(url)
      if (!res.ok) return null
      const json = await res.json()
      return ExportSchema.parse(json)
    } catch {
      return null
    }
  }
}
