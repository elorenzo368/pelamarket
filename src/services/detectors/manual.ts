import { AutoDetector, DetectOptions } from './index'
import { ExportShape } from '@domain/types'

export const manualDetector: AutoDetector = {
  async detect(_opts: DetectOptions): Promise<ExportShape | null> {
    return null
  }
}
