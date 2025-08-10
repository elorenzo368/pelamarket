import { ExportShape } from '@domain/types'

export const AutoDetectService = {
  async tryLoad(tokens?: string): Promise<ExportShape | null> {
    // MVP stub: si incluye "DEMO" devuelve datos de ejemplo
    if (!tokens || !tokens.toUpperCase().includes('DEMO')) return null
    return {
      version: 2,
      resources: [
        { id: 'earth', name: 'Earth', marketPriceDino: 1.2 },
        { id: 'water', name: 'Water', marketPriceDino: 1.0 },
        { id: 'mud', name: 'Mud', marketPriceDino: 2.6 }
      ],
      factories: [{
        id: 'auto-1',
        name: 'Mud Mixer',
        level: 2,
        inputs: [{ resourceId: 'earth', qty: 2 }, { resourceId: 'water', qty: 1 }],
        outputs: [{ resourceId: 'mud', qty: 2 }],
        cycleTimeSec: 45,
        consumesDynoCoinPerCycle: 0.1
      }],
      multipliers: { workersPct: 0.1, adsPct: 0.0, workshopPct: 0.05, customPct: 0 },
      advanced: { workshopStarsHalf: { mud: 4 }, masteryLevel: { earth: 5, water: 3 } }
    }
  }
}