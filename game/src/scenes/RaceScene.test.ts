import { describe, it, expect, vi } from 'vitest'

vi.mock('phaser', () => {
  class Scene {
    sys: { settings: { key: string } }
    constructor(config: { key: string }) {
      this.sys = { settings: { key: config.key } }
    }
  }
  return { default: { Scene } }
})

// Mock Player and AIRacer so RaceScene.test.ts doesn't need full Phaser Physics
vi.mock('../objects/Player', () => ({
  Player: class {},
  isOnRoad: () => true,
}))
vi.mock('../objects/AIRacer', () => ({ AIRacer: class {} }))

import { RaceScene } from './RaceScene'
import type { UserProfile } from '../types'

const mockUser: UserProfile = {
  id: 1,
  username: 'tester',
  money: 100,
  owned_carts: ['default'],
  equipped_cart: 'default',
  boosts: 0,
}

describe('RaceScene', () => {
  it('should have the correct scene key', () => {
    const scene = new RaceScene()
    expect(scene.sys.settings.key).toBe('RaceScene')
  })

  it('should store user from init data', () => {
    const scene = new RaceScene()
    scene.init({ user: mockUser })
    expect((scene as unknown as { user: UserProfile }).user).toEqual(mockUser)
  })
})
