import { describe, it, expect } from 'vitest'
import { importFromCraftworldTips } from '@utils/craftworldTipsImport'

describe('craftworld.tips import', () => {
  it('imports from JSON FACTORY_PRODUCTION_DATA', () => {
    const json = JSON.stringify({ FACTORY_PRODUCTION_DATA: { MUD: { 1: { input: { EARTH: 1 }, output: 1, duration: 60000 } } } })
    const data = importFromCraftworldTips(json, 1)
    expect(data?.resources.find(r => r.id === 'mud')).toBeTruthy()
    expect(data?.factories[0].outputs[0].resourceId).toBe('mud')
  })

  it.skip('imports from raw JS', () => {
    const raw = "FACTORY_PRODUCTION_DATA={'MUD':{1:{input:{'EARTH':1},output:1,duration:60000}}};"
    const data = importFromCraftworldTips(raw, 1)
    expect(data).toBeTruthy()
    expect(data!.factories[0].id).toContain('mud')
  })
})
