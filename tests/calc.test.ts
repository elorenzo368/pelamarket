import { describe, it, expect } from 'vitest'
import { costPerUnitByOutput } from '@services/calc'
import type { Factory, Resource, AdvancedSettings } from '@domain/types'

describe('calc cost per unit', () => {
  it('prorratea costo entre múltiples outputs con mastery y DINO', () => {
    const factory: Factory = {
      id: 'f', name: 'F', level: 1,
      inputs: [{ resourceId: 'iron', qty: 2 }],
      outputs: [{ resourceId: 'steel', qty: 1 }, { resourceId: 'screws', qty: 2 }],
      cycleTimeSec: 60,
      consumesDynoCoinPerCycle: 1
    }
    const resources: Resource[] = [
      { id: 'iron', name: 'Iron', marketPriceDino: 4 },
      { id: 'steel', name: 'Steel', marketPriceDino: 0 },
      { id: 'screws', name: 'Screws', marketPriceDino: 0 }
    ]
    const adv: AdvancedSettings = { workshopStarsHalf: {}, masteryLevel: { iron: 5 } }
    const costs = costPerUnitByOutput(factory, resources, adv)
    expect(costs.steel).toBeCloseTo(2.89, 2)
    expect(costs.screws).toBeCloseTo(2.89, 2)
  })
})
