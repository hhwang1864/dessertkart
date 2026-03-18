import { describe, it, expect } from 'vitest'
import { WAYPOINTS, START_POSITIONS, FINISH_WAYPOINT_INDEX } from './waypoints'
import { TRACK_BOUNDS } from './trackData'

describe('WAYPOINTS', () => {
  it('should have at least 8 waypoints', () => {
    expect(WAYPOINTS.length).toBeGreaterThanOrEqual(8)
  })

  it('all waypoints should be within road pixel bounds', () => {
    for (const wp of WAYPOINTS) {
      expect(wp.x).toBeGreaterThanOrEqual(TRACK_BOUNDS.roadLeft)
      expect(wp.x).toBeLessThanOrEqual(TRACK_BOUNDS.roadRight)
      expect(wp.y).toBeGreaterThanOrEqual(TRACK_BOUNDS.roadTop)
      expect(wp.y).toBeLessThanOrEqual(TRACK_BOUNDS.roadBottom)
    }
  })

  it('waypoints should NOT be in the inner (grass) region', () => {
    for (const wp of WAYPOINTS) {
      const inInner =
        wp.x > TRACK_BOUNDS.innerLeft &&
        wp.x < TRACK_BOUNDS.innerRight &&
        wp.y > TRACK_BOUNDS.innerTop &&
        wp.y < TRACK_BOUNDS.innerBottom
      expect(inInner).toBe(false)
    }
  })
})

describe('START_POSITIONS', () => {
  it('should have 4 start positions (1 player + 3 AI)', () => {
    expect(START_POSITIONS).toHaveLength(4)
  })

  it('all start positions should be on the bottom straight', () => {
    for (const pos of START_POSITIONS) {
      expect(pos.y).toBeGreaterThanOrEqual(TRACK_BOUNDS.roadBottom - 5 * 16)
      expect(pos.y).toBeLessThanOrEqual(TRACK_BOUNDS.roadBottom)
    }
  })
})

describe('FINISH_WAYPOINT_INDEX', () => {
  it('should be a valid index into WAYPOINTS', () => {
    expect(FINISH_WAYPOINT_INDEX).toBeGreaterThanOrEqual(0)
    expect(FINISH_WAYPOINT_INDEX).toBeLessThan(WAYPOINTS.length)
  })
})
