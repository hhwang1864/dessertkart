import { describe, it, expect } from 'vitest'
import { WAYPOINTS, START_POSITIONS, FINISH_WAYPOINT_INDEX } from './waypoints'
import { ROAD_MASK, TILE_SIZE } from './trackData'

describe('WAYPOINTS', () => {
  it('should have at least 8 waypoints', () => {
    expect(WAYPOINTS.length).toBeGreaterThanOrEqual(8)
  })

  it('all waypoints should be within the grid bounds', () => {
    for (const wp of WAYPOINTS) {
      expect(wp.x).toBeGreaterThanOrEqual(0)
      expect(wp.x).toBeLessThanOrEqual(800)
      expect(wp.y).toBeGreaterThanOrEqual(0)
      expect(wp.y).toBeLessThanOrEqual(608)
    }
  })

  it('all waypoints should be on road tiles', () => {
    for (const wp of WAYPOINTS) {
      const col = Math.floor(wp.x / TILE_SIZE)
      const row = Math.floor(wp.y / TILE_SIZE)
      expect(ROAD_MASK[row]?.[col]).toBe(true)
    }
  })
})

describe('START_POSITIONS', () => {
  it('should have 4 start positions (1 player + 3 AI)', () => {
    expect(START_POSITIONS).toHaveLength(4)
  })

  it('all start positions should be on road tiles', () => {
    for (const pos of START_POSITIONS) {
      const col = Math.floor(pos.x / TILE_SIZE)
      const row = Math.floor(pos.y / TILE_SIZE)
      expect(ROAD_MASK[row]?.[col]).toBe(true)
    }
  })
})

describe('FINISH_WAYPOINT_INDEX', () => {
  it('should be a valid index into WAYPOINTS', () => {
    expect(FINISH_WAYPOINT_INDEX).toBeGreaterThanOrEqual(0)
    expect(FINISH_WAYPOINT_INDEX).toBeLessThan(WAYPOINTS.length)
  })
})
