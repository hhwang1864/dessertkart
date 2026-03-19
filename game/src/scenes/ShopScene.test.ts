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

vi.mock('../utils/api', () => ({
  apiClient: {
    post: vi.fn().mockResolvedValue({ owned_carts: ['default', 'dune_runner'], equipped_cart: 'dune_runner', money: 50 }),
    get:  vi.fn().mockResolvedValue({ owned_carts: ['default'], equipped_cart: 'default', money: 200 }),
  },
}))

import { ShopScene } from './ShopScene'
import type { UserProfile } from '../types'

const mockUser: UserProfile = {
  id: 1, username: 'tester', money: 200,
  owned_carts: ['default'], equipped_cart: 'default', boosts: 0,
}

describe('ShopScene', () => {
  it('should have the correct scene key', () => {
    const scene = new ShopScene()
    expect(scene.sys.settings.key).toBe('ShopScene')
  })

  it('should store user from init data', () => {
    const scene = new ShopScene()
    scene.init({ user: mockUser })
    expect((scene as unknown as { user: UserProfile }).user).toEqual(mockUser)
  })
})
