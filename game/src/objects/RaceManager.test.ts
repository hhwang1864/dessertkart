import { describe, it, expect } from 'vitest'
import { computeRaceScore, ordinalSuffix, formatTime } from './RaceManager'

describe('computeRaceScore', () => {
  it('higher checkpoint count means higher score', () => {
    const s1 = computeRaceScore(5, 100, 0, 18)
    const s2 = computeRaceScore(3, 100, 0, 18)
    expect(s1).toBeGreaterThan(s2)
  })

  it('smaller distance to next checkpoint means higher score (same checkpoint)', () => {
    const close   = computeRaceScore(3, 20,  0, 18)
    const farAway = computeRaceScore(3, 200, 0, 18)
    expect(close).toBeGreaterThan(farAway)
  })

  it('more laps means higher score', () => {
    const lap2 = computeRaceScore(2, 100, 2, 18)
    const lap1 = computeRaceScore(2, 100, 1, 18)
    expect(lap2).toBeGreaterThan(lap1)
  })
})

describe('ordinalSuffix', () => {
  it.each([
    [1, '1st'],
    [2, '2nd'],
    [3, '3rd'],
    [4, '4th'],
    [11, '11th'],
    [12, '12th'],
    [13, '13th'],
  ])('%i → %s', (n, expected) => {
    expect(ordinalSuffix(n)).toBe(expected)
  })
})

describe('formatTime', () => {
  it('should format 90 seconds as 1:30', () => {
    expect(formatTime(90)).toBe('1:30')
  })

  it('should format 9 seconds as 0:09', () => {
    expect(formatTime(9)).toBe('0:09')
  })

  it('should format 0 seconds as 0:00', () => {
    expect(formatTime(0)).toBe('0:00')
  })
})
