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

describe('isOnRoad', () => {
  it('should return true when position is on road (bottom straight)', () => {
    // Bottom straight center: around pixel (232, 488) → tile (14, 30)
    expect(isOnRoad(232, 488)).toBe(true)
  })

  it('should return false when position is in the interior grass region', () => {
    // Center of the loop: around pixel (400, 288) → tile (25, 18)
    expect(isOnRoad(400, 288)).toBe(false)
  })

  it('should return false when position is completely outside the track', () => {
    expect(isOnRoad(0, 0)).toBe(false)
  })

  it('should return true on the right straight', () => {
    // Right straight: around pixel (728, 264) → tile (45, 16)
    expect(isOnRoad(728, 264)).toBe(true)
  })
})
