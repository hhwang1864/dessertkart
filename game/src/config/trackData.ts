// Track grid: 50 cols × 38 rows @ 16px each = 800×608px
// Tile -1 = empty (canvas background #c2a05a = sandy desert)
// Tile  0 = purple/lavender road surface
// Tile  9 = green vegetation (decoration, inner border)

const COLS = 50
const ROWS = 38

const ROAD = 0
const EMPTY = -1
const GREEN = 9

// Road boundary
const ROAD_LEFT   = 4
const ROAD_RIGHT  = 45
const ROAD_TOP    = 4
const ROAD_BOTTOM = 33
const ROAD_W      = 5  // road width in tiles

function makeEmptyGrid(): number[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY))
}

function fillRect(grid: number[][], row: number, col: number, h: number, w: number, tile: number) {
  for (let r = row; r < row + h; r++) {
    for (let c = col; c < col + w; c++) {
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
        grid[r][c] = tile
      }
    }
  }
}

function buildRoadLayer(): number[][] {
  const grid = makeEmptyGrid()

  // Top straight
  fillRect(grid, ROAD_TOP, ROAD_LEFT, ROAD_W, ROAD_RIGHT - ROAD_LEFT + 1, ROAD)
  // Bottom straight
  fillRect(grid, ROAD_BOTTOM - ROAD_W + 1, ROAD_LEFT, ROAD_W, ROAD_RIGHT - ROAD_LEFT + 1, ROAD)
  // Left straight
  fillRect(grid, ROAD_TOP, ROAD_LEFT, ROAD_BOTTOM - ROAD_TOP + 1, ROAD_W, ROAD)
  // Right straight
  fillRect(grid, ROAD_TOP, ROAD_RIGHT - ROAD_W + 1, ROAD_BOTTOM - ROAD_TOP + 1, ROAD_W, ROAD)

  return grid
}

function buildDecorationLayer(): number[][] {
  const grid = makeEmptyGrid()

  // Inner green border (vegetation inside the track loop)
  const innerLeft   = ROAD_LEFT + ROAD_W + 1
  const innerRight  = ROAD_RIGHT - ROAD_W - 1
  const innerTop    = ROAD_TOP + ROAD_W + 1
  const innerBottom = ROAD_BOTTOM - ROAD_W - 1

  // Top inner edge
  fillRect(grid, innerTop, innerLeft, 1, innerRight - innerLeft + 1, GREEN)
  // Bottom inner edge
  fillRect(grid, innerBottom, innerLeft, 1, innerRight - innerLeft + 1, GREEN)
  // Left inner edge
  fillRect(grid, innerTop, innerLeft, innerBottom - innerTop + 1, 1, GREEN)
  // Right inner edge
  fillRect(grid, innerTop, innerRight, innerBottom - innerTop + 1, 1, GREEN)

  // Finish line marker: fill 1 column with alternating pattern (row 30-34, col 24-25)
  for (let r = ROAD_BOTTOM - ROAD_W + 1; r <= ROAD_BOTTOM; r++) {
    grid[r][24] = (r % 2 === 0) ? 0 : 3   // tile 3 = darker purple variant for contrast
    grid[r][25] = (r % 2 === 0) ? 3 : 0
  }

  return grid
}

export const GROUND_LAYER = buildRoadLayer()
export const DECOR_LAYER  = buildDecorationLayer()

// Road tile indices used in GROUND_LAYER — used by Player to detect off-road
export const ROAD_TILE_INDICES = new Set([ROAD])

// Pixel bounds of the circuit road (used for off-road penalty detection)
export const TRACK_BOUNDS = {
  roadLeft:   ROAD_LEFT   * 16,
  roadRight:  (ROAD_RIGHT + 1) * 16,
  roadTop:    ROAD_TOP    * 16,
  roadBottom: (ROAD_BOTTOM + 1) * 16,
  innerLeft:  (ROAD_LEFT + ROAD_W) * 16,
  innerRight: (ROAD_RIGHT - ROAD_W + 1) * 16,
  innerTop:   (ROAD_TOP + ROAD_W) * 16,
  innerBottom:(ROAD_BOTTOM - ROAD_W + 1) * 16,
}

// Finish line pixel X range and Y range
export const FINISH_LINE = {
  x: 24 * 16,
  xEnd: 26 * 16,
  y: (ROAD_BOTTOM - ROAD_W + 1) * 16,
  yEnd: (ROAD_BOTTOM + 1) * 16,
}

// Grid dimensions
export const TRACK_COLS = COLS
export const TRACK_ROWS = ROWS
export const TILE_SIZE  = 16
