import { ExportShape } from '@domain/types'
import { tryDetectors, DetectOptions } from './detectors'

export const AutoDetectService = {
  async tryLoad(opts: DetectOptions): Promise<ExportShape | null> {
    return tryDetectors(opts)
  }
}
