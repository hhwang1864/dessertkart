import { describe, it, expect, vi } from 'vitest'

vi.mock('phaser', () => {
  class Sprite {
    x = 0; y = 0; rotation = 0
    body = { velocity: { x: 0, y: 0 }, setVelocity: vi.fn(), setMaxVelocity: vi.fn() }
    setDepth = vi.fn().mockReturnThis()
    setTint = vi.fn().mockReturnThis()
    setAngle = vi.fn().mockReturnThis()
    constructor(_scene: unknown, _x: number, _y: number, _key: string, _frame: number) {}
  }
  return {
    default: {
      Physics: { Arcade: { Sprite } },
      Math: {
        DegToRad: (d: number) => d * Math.PI / 180,
        RadToDeg: (r: number) => r * 180 / Math.PI,
        Angle: {
          BetweenPoints: (a: { x: number; y: number }, b: { x: number; y: number }) =>
            Math.atan2(b.y - a.y, b.x - a.x),
        ShortestBetween: (a: number, b: number) => {
            const diff = b - a
            return diff > 180 ? diff - 360 : diff < -180 ? diff + 360 : diff
          },
        },
      },
    },
  }
})

import { steerToward } from './AIRacer'

describe('steerToward', () => {
  it('should return 0 rotation delta when already facing the target', () => {
    // facing right (0°) toward a point directly to the right
    const delta = steerToward(0, { x: 0, y: 0 }, { x: 100, y: 0 }, 180, 16)
    expect(Math.abs(delta)).toBeLessThan(1)
  })

  it('should return positive delta when target is clockwise', () => {
    // facing up (-90°), target is to the right → need to turn clockwise (positive)
    const delta = steerToward(-90, { x: 0, y: 0 }, { x: 100, y: 0 }, 180, 16)
    expect(delta).toBeGreaterThan(0)
  })
})
