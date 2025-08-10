import { ExportShape } from '@domain/types'

export type DetectOptions = { voyaId?: string; urlTemplate?: string }

export interface AutoDetector {
  detect(opts: DetectOptions): Promise<ExportShape | null>
}

import { manualDetector } from './manual'
import { remoteJsonDetector } from './remoteJson'

const detectors: AutoDetector[] = [manualDetector, remoteJsonDetector]

export async function tryDetectors(opts: DetectOptions): Promise<ExportShape | null> {
  for (const d of detectors) {
    try {
      const res = await d.detect(opts)
      if (res) return res
    } catch {
      // ignore individual detector errors
    }
  }
  return null
}
