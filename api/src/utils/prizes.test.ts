import { describe, it, expect } from 'vitest'
import { isValidPrize, prizeForPlace, VALID_PRIZE_AMOUNTS } from './prizes'

describe('isValidPrize', () => {
  it('should accept 0, 10, 20, 30', () => {
    expect(isValidPrize(0)).toBe(true)
    expect(isValidPrize(10)).toBe(true)
    expect(isValidPrize(20)).toBe(true)
    expect(isValidPrize(30)).toBe(true)
  })

  it('should reject arbitrary numbers', () => {
    expect(isValidPrize(5)).toBe(false)
    expect(isValidPrize(100)).toBe(false)
    expect(isValidPrize(-10)).toBe(false)
    expect(isValidPrize(999)).toBe(false)
  })

  it('should reject non-numbers', () => {
    expect(isValidPrize('30')).toBe(false)
    expect(isValidPrize(null)).toBe(false)
    expect(isValidPrize(undefined)).toBe(false)
    expect(isValidPrize({ amount: 30 })).toBe(false)
  })
})

describe('prizeForPlace', () => {
  it('should return $30 for 1st place', () => {
    expect(prizeForPlace(1)).toBe(30)
  })

  it('should return $20 for 2nd place', () => {
    expect(prizeForPlace(2)).toBe(20)
  })

  it('should return $10 for 3rd place', () => {
    expect(prizeForPlace(3)).toBe(10)
  })

  it('should return $0 for 4th place', () => {
    expect(prizeForPlace(4)).toBe(0)
  })

  it('should return $0 for any other place', () => {
    expect(prizeForPlace(5)).toBe(0)
    expect(prizeForPlace(0)).toBe(0)
  })
})

describe('VALID_PRIZE_AMOUNTS', () => {
  it('should contain exactly the four valid amounts', () => {
    expect([...VALID_PRIZE_AMOUNTS].sort((a, b) => a - b)).toEqual([0, 10, 20, 30])
  })
})
