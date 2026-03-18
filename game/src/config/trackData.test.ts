import { describe, it, expect } from 'vitest'
import {
  GROUND_LAYER,
  DECOR_LAYER,
  ROAD_TILE_INDICES,
  TRACK_BOUNDS,
  FINISH_LINE,
  TRACK_COLS,
  TRACK_ROWS,
  TILE_SIZE,
} from './trackData'

describe('GROUND_LAYER', () => {
  it('should be 38 rows × 50 cols', () => {
    expect(GROUND_LAYER).toHaveLength(38)
    GROUND_LAYER.forEach((row) => expect(row).toHaveLength(50))
  })

  it('should have road tiles on the top straight', () => {
    // rows 4-8, cols 4-45 should be road (tile 0)
    for (let r = 4; r <= 8; r++) {
      for (let c = 4; c <= 45; c++) {
        expect(GROUND_LAYER[r][c]).toBe(0)
      }
    }
  })

  it('should have road tiles on the bottom straight', () => {
    for (let r = 29; r <= 33; r++) {
      for (let c = 4; c <= 45; c++) {
        expect(GROUND_LAYER[r][c]).toBe(0)
      }
    }
  })

  it('should have road tiles on the left straight', () => {
    for (let r = 4; r <= 33; r++) {
      for (let c = 4; c <= 8; c++) {
        expect(GROUND_LAYER[r][c]).toBe(0)
      }
    }
  })

  it('should have road tiles on the right straight', () => {
    for (let r = 4; r <= 33; r++) {
      for (let c = 41; c <= 45; c++) {
        expect(GROUND_LAYER[r][c]).toBe(0)
      }
    }
  })

  it('should have empty interior (no road in the middle)', () => {
    // Interior: rows 10-28, cols 10-40 — no road tiles
    for (let r = 10; r <= 28; r++) {
      for (let c = 10; c <= 40; c++) {
        expect(GROUND_LAYER[r][c]).toBe(-1)
      }
    }
  })

  it('should have empty tiles completely outside the track', () => {
    // Outside of road_left (col 0-3)
    for (let r = 0; r < 38; r++) {
      for (let c = 0; c < 4; c++) {
        expect(GROUND_LAYER[r][c]).toBe(-1)
      }
    }
  })
})

describe('ROAD_TILE_INDICES', () => {
  it('should mark tile 0 as road', () => {
    expect(ROAD_TILE_INDICES.has(0)).toBe(true)
  })

  it('should not mark -1 as road', () => {
    expect(ROAD_TILE_INDICES.has(-1)).toBe(false)
  })
})

describe('TRACK_BOUNDS', () => {
  it('should compute pixel bounds from tile coords', () => {
    expect(TRACK_BOUNDS.roadLeft).toBe(4 * 16)
    expect(TRACK_BOUNDS.roadTop).toBe(4 * 16)
    expect(TRACK_BOUNDS.innerLeft).toBe((4 + 5) * 16)
    expect(TRACK_BOUNDS.innerTop).toBe((4 + 5) * 16)
  })
})

describe('FINISH_LINE', () => {
  it('should be on the bottom straight', () => {
    expect(FINISH_LINE.y).toBeGreaterThanOrEqual(TRACK_BOUNDS.roadBottom - 5 * TILE_SIZE)
    expect(FINISH_LINE.x).toBeGreaterThan(TRACK_BOUNDS.roadLeft)
    expect(FINISH_LINE.xEnd).toBeLessThan(TRACK_BOUNDS.roadRight)
  })
})

describe('constants', () => {
  it('should have correct grid dimensions', () => {
    expect(TRACK_COLS).toBe(50)
    expect(TRACK_ROWS).toBe(38)
    expect(TILE_SIZE).toBe(16)
  })
})
