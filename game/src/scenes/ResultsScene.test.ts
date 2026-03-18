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
  apiClient: { post: vi.fn().mockResolvedValue({ money: 130 }) },
}))

import { ResultsScene } from './ResultsScene'
import type { RaceResultEntry } from './ResultsScene'
import type { UserProfile } from '../types'

const mockUser: UserProfile = {
  id: 1, username: 'tester', money: 100,
  owned_carts: ['default'], equipped_cart: 'default',
}

const mockResults: RaceResultEntry[] = [
  { id: 'player', place: 1, finishTime: 45.2, prize: 30 },
  { id: 'ai1',    place: 2, finishTime: 47.1, prize: 20 },
  { id: 'ai2',    place: 3, finishTime: null,  prize: 10 },
  { id: 'ai3',    place: 4, finishTime: null,  prize: 0  },
]

describe('ResultsScene', () => {
  it('should have the correct scene key', () => {
    const scene = new ResultsScene()
    expect(scene.sys.settings.key).toBe('ResultsScene')
  })

  it('should store results and user from init data', () => {
    const scene = new ResultsScene()
    scene.init({ results: mockResults, user: mockUser })
    expect((scene as unknown as { user: UserProfile }).user).toEqual(mockUser)
    expect((scene as unknown as { results: RaceResultEntry[] }).results).toEqual(mockResults)
  })
})
