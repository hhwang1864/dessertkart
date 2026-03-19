import { describe, it, expect } from 'vitest'
import {
  GROUND_LAYER,
  ROAD_TILE_INDICES,
  ROAD_MASK,
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

  it('should have road tiles where ROAD_MASK is true', () => {
    for (let r = 0; r < 38; r++) {
      for (let c = 0; c < 50; c++) {
        if (ROAD_MASK[r][c]) {
          expect(ROAD_TILE_INDICES.has(GROUND_LAYER[r][c])).toBe(true)
        }
      }
    }
  })

  it('should have non-road interior (grass in the middle)', () => {
    // Center of the track loop should not be road
    // Check a region that's clearly interior (around row 18, col 25)
    for (let r = 15; r <= 20; r++) {
      for (let c = 20; c <= 30; c++) {
        expect(ROAD_MASK[r][c]).toBe(false)
      }
    }
  })

  it('should have sand tiles outside the track', () => {
    // Outside corners should be sand, not empty
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        expect(GROUND_LAYER[r][c]).not.toBe(-1)
      }
    }
  })
})

describe('ROAD_MASK', () => {
  it('should be 38 rows × 50 cols of booleans', () => {
    expect(ROAD_MASK).toHaveLength(38)
    ROAD_MASK.forEach((row) => {
      expect(row).toHaveLength(50)
      row.forEach((val) => expect(typeof val).toBe('boolean'))
    })
  })

  it('should have road on the bottom straight (around row 30)', () => {
    // The bottom straight runs around row 30
    expect(ROAD_MASK[30][14]).toBe(true)
    expect(ROAD_MASK[30][20]).toBe(true)
  })

  it('should have road on the right side (around col 45)', () => {
    expect(ROAD_MASK[16][45]).toBe(true)
  })

  it('should not have road at (0,0)', () => {
    expect(ROAD_MASK[0][0]).toBe(false)
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

describe('FINISH_LINE', () => {
  it('should be on the bottom straight area', () => {
    // Finish line should be in the lower portion of the track
    expect(FINISH_LINE.y).toBeGreaterThan(400)
    expect(FINISH_LINE.x).toBeGreaterThan(0)
    expect(FINISH_LINE.xEnd).toBeLessThan(800)
  })
})

describe('constants', () => {
  it('should have correct grid dimensions', () => {
    expect(TRACK_COLS).toBe(50)
    expect(TRACK_ROWS).toBe(38)
    expect(TILE_SIZE).toBe(16)
  })
})
