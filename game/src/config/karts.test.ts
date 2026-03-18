import { describe, it, expect } from 'vitest'
import { KART_CATALOG, getKart } from './karts'

describe('KART_CATALOG', () => {
  it('should have 5 karts', () => {
    expect(KART_CATALOG).toHaveLength(5)
  })

  it('should include a default kart with price 0', () => {
    const def = KART_CATALOG.find(k => k.id === 'default')
    expect(def).toBeDefined()
    expect(def!.price).toBe(0)
  })

  it('karts should be sorted by speed ascending', () => {
    for (let i = 1; i < KART_CATALOG.length; i++) {
      expect(KART_CATALOG[i].speed).toBeGreaterThan(KART_CATALOG[i - 1].speed)
    }
  })

  it('each kart should have required fields', () => {
    for (const k of KART_CATALOG) {
      expect(k).toHaveProperty('id')
      expect(k).toHaveProperty('name')
      expect(k).toHaveProperty('speed')
      expect(k).toHaveProperty('price')
      expect(k).toHaveProperty('sheet')
      expect(k).toHaveProperty('spriteFrame')
    }
  })
})

describe('getKart', () => {
  it('should return the kart matching the id', () => {
    const k = getKart('default')
    expect(k.id).toBe('default')
  })

  it('should fall back to default when id is unknown', () => {
    const k = getKart('nonexistent')
    expect(k.id).toBe('default')
  })
})
