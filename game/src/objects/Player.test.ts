import { describe, it, expect, vi } from 'vitest'

vi.mock('phaser', () => {
  class Physics {
    static Arcade = {
      Sprite: class {
        x = 0; y = 0; rotation = 0
        body = { velocity: { x: 0, y: 0 }, setVelocity: vi.fn(), setMaxVelocity: vi.fn(), setDrag: vi.fn() }
        scene = { physics: { world: { on: vi.fn() } } }
        setDepth = vi.fn().mockReturnThis()
        setTint = vi.fn().mockReturnThis()
        setAngle = vi.fn((a: number) => { this.rotation = a * Math.PI / 180; return this })
        play = vi.fn().mockReturnThis()
        constructor(_scene: unknown, _x: number, _y: number, _key: string, _frame: number) {}
      }
    }
  }
  return { default: { Physics } }
})

import { isOnRoad } from './Player'
import { TRACK_BOUNDS } from '../config/trackData'

describe('isOnRoad', () => {
  it('should return true when position is on road (bottom straight center)', () => {
    const x = 300
    const y = TRACK_BOUNDS.roadBottom - 20
    expect(isOnRoad(x, y)).toBe(true)
  })

  it('should return false when position is in the inner grass region', () => {
    const x = 400
    const y = 304  // vertical center — inner grass
    expect(isOnRoad(x, y)).toBe(false)
  })

  it('should return false when position is completely outside the track', () => {
    expect(isOnRoad(0, 0)).toBe(false)
  })
})
