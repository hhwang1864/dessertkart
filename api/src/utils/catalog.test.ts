import { describe, it, expect } from 'vitest'
import { KART_CATALOG, isValidCartId, canAfford, alreadyOwns } from './catalog'

describe('KART_CATALOG', () => {
  it('should have 5 karts', () => {
    expect(KART_CATALOG.size).toBe(5)
  })

  it('should include "default" as free', () => {
    expect(KART_CATALOG.get('default')?.price).toBe(0)
  })

  it('should have karts with increasing speed', () => {
    const speeds = [...KART_CATALOG.values()].map((k) => k.speed)
    const sorted = [...speeds].sort((a, b) => a - b)
    expect(speeds).toEqual(sorted)
  })
})

describe('isValidCartId', () => {
  it('should return true for known cart IDs', () => {
    expect(isValidCartId('default')).toBe(true)
    expect(isValidCartId('dune_runner')).toBe(true)
    expect(isValidCartId('desert_storm')).toBe(true)
  })

  it('should return false for unknown IDs', () => {
    expect(isValidCartId('super_kart')).toBe(false)
    expect(isValidCartId('')).toBe(false)
    expect(isValidCartId(undefined)).toBe(false)
  })
})

describe('canAfford', () => {
  it('should return true when user has enough money', () => {
    expect(canAfford(100, 'dune_runner')).toBe(true) // costs 50
    expect(canAfford(50, 'dune_runner')).toBe(true)  // exact
  })

  it('should return false when user cannot afford', () => {
    expect(canAfford(49, 'dune_runner')).toBe(false)
    expect(canAfford(0, 'desert_storm')).toBe(false)
  })
})

describe('alreadyOwns', () => {
  it('should return true when cart is in owned list', () => {
    expect(alreadyOwns(['default', 'dune_runner'], 'dune_runner')).toBe(true)
  })

  it('should return false when cart is not owned', () => {
    expect(alreadyOwns(['default'], 'dune_runner')).toBe(false)
  })

  it('should return false for empty inventory', () => {
    expect(alreadyOwns([], 'default')).toBe(false)
  })
})
