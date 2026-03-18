// Track grid: 50 cols × 38 rows @ 16px each = 800×608px
// Uses tiles from the Kenney desert tilemap spritesheet (18 cols × 13 rows)
//
// Tile indices (from tilemap_packed.png, 16×16 tiles, 18 per row):
//   Sand:      54, 55, 56, 72, 73, 74        (tan desert ground)
//   Light sand: 64, 65, 75                    (lighter sand accents)
//   Road:      0 (light purple center), 1-4   (darker purple edges)
//   Dark road: 36, 38, 39                     (darkest purple)
//   Grass:     5, 7 (light green), 6, 9       (darker green)
//   Walls:     11-17, 28-35, 100-104          (blue-gray building)
//   Dark wall: 51, 69-71, 87-89              (dark building)
//   Brick:     105, 148, 149, 150, 151        (orange-red accents)
//   Shadow:    44, 77, 78, 79                 (dark details)

const COLS = 50
const ROWS = 38

// Tile aliases
const SAND       = 54   // main sand
const SAND2      = 55   // sand variant
const SAND3      = 72   // sand variant
const SAND_LIGHT = 64   // lighter sand
const ROAD       = 0    // light purple road center
const ROAD_EDGE  = 1    // medium purple road edge
const ROAD_DARK  = 4    // darker purple
const ROAD_V_DARK = 36  // darkest purple
const GRASS      = 5    // light green
const GRASS2     = 7    // light green variant
const GRASS_DARK = 6    // darker green
const GRASS_D2   = 9    // darker green variant
const WALL       = 11   // blue-gray building
const WALL2      = 13   // lighter wall
const WALL3      = 14   // wall variant
const WALL_DARK  = 16   // darker wall
const WALL_TOP   = 10   // light wall top
const BRICK      = 105  // orange-red brick
const BRICK2     = 148  // brick variant
const SHADOW     = 44   // dark shadow
const DARK       = 77   // dark detail

const EMPTY = -1

// Road boundary (same as before for gameplay collision)
const ROAD_LEFT   = 4
const ROAD_RIGHT  = 45
const ROAD_TOP    = 4
const ROAD_BOTTOM = 33
const ROAD_W      = 5  // road width in tiles

function makeGrid(fill: number): number[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(fill))
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

function setTile(grid: number[][], row: number, col: number, tile: number) {
  if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
    grid[row][col] = tile
  }
}

// Seeded random for deterministic map generation
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function buildGroundLayer(): number[][] {
  const rand = seededRandom(42)
  // Fill with varied sand
  const sandTiles = [SAND, SAND, SAND, SAND2, SAND3, SAND, SAND2]
  const grid = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => sandTiles[Math.floor(rand() * sandTiles.length)])
  )

  // Scatter lighter sand patches
  for (let i = 0; i < 40; i++) {
    const r = Math.floor(rand() * ROWS)
    const c = Math.floor(rand() * COLS)
    setTile(grid, r, c, SAND_LIGHT)
  }

  // --- Road surface ---
  // Top straight
  fillRect(grid, ROAD_TOP, ROAD_LEFT, ROAD_W, ROAD_RIGHT - ROAD_LEFT + 1, ROAD)
  // Bottom straight
  fillRect(grid, ROAD_BOTTOM - ROAD_W + 1, ROAD_LEFT, ROAD_W, ROAD_RIGHT - ROAD_LEFT + 1, ROAD)
  // Left straight
  fillRect(grid, ROAD_TOP, ROAD_LEFT, ROAD_BOTTOM - ROAD_TOP + 1, ROAD_W, ROAD)
  // Right straight
  fillRect(grid, ROAD_TOP, ROAD_RIGHT - ROAD_W + 1, ROAD_BOTTOM - ROAD_TOP + 1, ROAD_W, ROAD)

  // Road edges (darker purple border around the road)
  // Outer edge - top
  fillRect(grid, ROAD_TOP, ROAD_LEFT, 1, ROAD_RIGHT - ROAD_LEFT + 1, ROAD_EDGE)
  // Outer edge - bottom
  fillRect(grid, ROAD_BOTTOM, ROAD_LEFT, 1, ROAD_RIGHT - ROAD_LEFT + 1, ROAD_EDGE)
  // Outer edge - left
  fillRect(grid, ROAD_TOP, ROAD_LEFT, ROAD_BOTTOM - ROAD_TOP + 1, 1, ROAD_EDGE)
  // Outer edge - right
  fillRect(grid, ROAD_TOP, ROAD_RIGHT, ROAD_BOTTOM - ROAD_TOP + 1, 1, ROAD_EDGE)
  // Inner edge - top
  fillRect(grid, ROAD_TOP + ROAD_W - 1, ROAD_LEFT + ROAD_W, 1, ROAD_RIGHT - ROAD_LEFT - 2 * ROAD_W + 1, ROAD_EDGE)
  // Inner edge - bottom
  fillRect(grid, ROAD_BOTTOM - ROAD_W + 1, ROAD_LEFT + ROAD_W, 1, ROAD_RIGHT - ROAD_LEFT - 2 * ROAD_W + 1, ROAD_EDGE)
  // Inner edge - left
  fillRect(grid, ROAD_TOP + ROAD_W, ROAD_LEFT + ROAD_W - 1, ROAD_BOTTOM - ROAD_TOP - 2 * ROAD_W + 1, 1, ROAD_EDGE)
  // Inner edge - right
  fillRect(grid, ROAD_TOP + ROAD_W, ROAD_RIGHT - ROAD_W + 1, ROAD_BOTTOM - ROAD_TOP - 2 * ROAD_W + 1, 1, ROAD_EDGE)

  // Corner accents (darkest purple at 4 outer corners and 4 inner corners)
  for (const [r, c] of [
    [ROAD_TOP, ROAD_LEFT], [ROAD_TOP, ROAD_RIGHT],
    [ROAD_BOTTOM, ROAD_LEFT], [ROAD_BOTTOM, ROAD_RIGHT],
  ]) {
    setTile(grid, r, c, ROAD_DARK)
  }
  for (const [r, c] of [
    [ROAD_TOP + ROAD_W - 1, ROAD_LEFT + ROAD_W - 1],
    [ROAD_TOP + ROAD_W - 1, ROAD_RIGHT - ROAD_W + 1],
    [ROAD_BOTTOM - ROAD_W + 1, ROAD_LEFT + ROAD_W - 1],
    [ROAD_BOTTOM - ROAD_W + 1, ROAD_RIGHT - ROAD_W + 1],
  ]) {
    setTile(grid, r, c, ROAD_DARK)
  }

  // --- Green grass inside the track loop ---
  const innerLeft   = ROAD_LEFT + ROAD_W
  const innerRight  = ROAD_RIGHT - ROAD_W
  const innerTop    = ROAD_TOP + ROAD_W
  const innerBottom = ROAD_BOTTOM - ROAD_W

  // Fill inner area with grass
  const grassTiles = [GRASS, GRASS, GRASS2, GRASS, GRASS]
  for (let r = innerTop; r <= innerBottom; r++) {
    for (let c = innerLeft; c <= innerRight; c++) {
      grid[r][c] = grassTiles[Math.floor(rand() * grassTiles.length)]
    }
  }

  // Grass edges (darker green border around inner grass)
  for (let c = innerLeft; c <= innerRight; c++) {
    setTile(grid, innerTop, c, GRASS_DARK)
    setTile(grid, innerBottom, c, GRASS_DARK)
  }
  for (let r = innerTop; r <= innerBottom; r++) {
    setTile(grid, r, innerLeft, GRASS_DARK)
    setTile(grid, r, innerRight, GRASS_DARK)
  }
  // Corner dark grass
  for (const [r, c] of [
    [innerTop, innerLeft], [innerTop, innerRight],
    [innerBottom, innerLeft], [innerBottom, innerRight],
  ]) {
    setTile(grid, r, c, GRASS_D2)
  }

  return grid
}

function buildDecorationLayer(): number[][] {
  const grid = makeGrid(EMPTY)
  const rand = seededRandom(123)

  // --- Finish line (checkerboard pattern on bottom straight) ---
  for (let r = ROAD_BOTTOM - ROAD_W + 1; r <= ROAD_BOTTOM; r++) {
    grid[r][24] = (r % 2 === 0) ? ROAD : ROAD_V_DARK
    grid[r][25] = (r % 2 === 0) ? ROAD_V_DARK : ROAD
  }

  // --- Building clusters in outer sand areas ---

  // Top-left building cluster
  fillRect(grid, 0, 0, 3, 3, WALL)
  setTile(grid, 0, 0, WALL_TOP)
  setTile(grid, 2, 1, WALL_DARK)
  fillRect(grid, 0, 12, 3, 4, WALL2)
  setTile(grid, 2, 13, WALL_DARK)
  setTile(grid, 2, 14, WALL_DARK)

  // Top-right building cluster
  fillRect(grid, 0, 37, 3, 4, WALL)
  setTile(grid, 0, 37, WALL_TOP)
  setTile(grid, 2, 38, WALL_DARK)
  fillRect(grid, 1, 47, 2, 3, WALL3)
  setTile(grid, 2, 48, WALL_DARK)

  // Bottom-left building
  fillRect(grid, 35, 0, 3, 4, WALL2)
  setTile(grid, 35, 0, WALL_TOP)
  setTile(grid, 37, 2, WALL_DARK)

  // Bottom-right building cluster
  fillRect(grid, 35, 42, 3, 4, WALL)
  setTile(grid, 35, 42, WALL_TOP)
  setTile(grid, 37, 43, WALL_DARK)
  fillRect(grid, 35, 47, 3, 3, WALL3)

  // Mid-left building (between top and bottom straights)
  fillRect(grid, 16, 0, 4, 3, WALL)
  setTile(grid, 16, 0, WALL_TOP)
  setTile(grid, 19, 1, WALL_DARK)

  // Mid-right building
  fillRect(grid, 14, 47, 4, 3, WALL2)
  setTile(grid, 14, 47, WALL_TOP)
  setTile(grid, 17, 48, WALL_DARK)

  // --- Brick accents along track outer edges ---
  // Top edge - scattered bricks
  for (let c = ROAD_LEFT + 6; c < ROAD_RIGHT - 3; c += 7) {
    setTile(grid, ROAD_TOP - 1, c, BRICK)
    setTile(grid, ROAD_TOP - 1, c + 1, BRICK2)
  }
  // Bottom edge - scattered bricks
  for (let c = ROAD_LEFT + 4; c < ROAD_RIGHT - 3; c += 8) {
    setTile(grid, ROAD_BOTTOM + 1, c, BRICK)
    setTile(grid, ROAD_BOTTOM + 1, c + 1, BRICK2)
  }
  // Left edge - scattered bricks
  for (let r = ROAD_TOP + 5; r < ROAD_BOTTOM - 3; r += 6) {
    setTile(grid, r, ROAD_LEFT - 1, BRICK)
  }
  // Right edge - scattered bricks
  for (let r = ROAD_TOP + 3; r < ROAD_BOTTOM - 3; r += 7) {
    setTile(grid, r, ROAD_RIGHT + 1, BRICK2)
  }

  // --- Shadow tiles under buildings ---
  fillRect(grid, 3, 0, 1, 3, SHADOW)
  fillRect(grid, 3, 12, 1, 4, SHADOW)
  fillRect(grid, 3, 37, 1, 4, SHADOW)

  // --- Small scattered decoration in inner grass area ---
  const innerLeft  = ROAD_LEFT + ROAD_W + 1
  const innerRight = ROAD_RIGHT - ROAD_W - 1
  const innerTop   = ROAD_TOP + ROAD_W + 1
  const innerBottom = ROAD_BOTTOM - ROAD_W - 1

  // Dark green accent patches inside grass
  for (let i = 0; i < 12; i++) {
    const r = innerTop + Math.floor(rand() * (innerBottom - innerTop))
    const c = innerLeft + Math.floor(rand() * (innerRight - innerLeft))
    setTile(grid, r, c, GRASS_D2)
  }

  // Small wall features inside grass (ruins/structures)
  fillRect(grid, 14, 18, 2, 3, WALL)
  setTile(grid, 14, 18, WALL_TOP)
  fillRect(grid, 20, 28, 2, 2, WALL3)
  fillRect(grid, 12, 34, 2, 2, WALL2)

  // --- Scattered dark spots in sand (rocks/shadows) ---
  const sandSpots = [
    [1, 6], [1, 25], [2, 44],
    [35, 8], [36, 20], [36, 35],
    [20, 1], [12, 48], [25, 48],
  ]
  for (const [r, c] of sandSpots) {
    setTile(grid, r, c, DARK)
  }

  // --- Road markings (dashed center line on straights) ---
  // Top straight - horizontal center line dashes
  const topCenter = ROAD_TOP + Math.floor(ROAD_W / 2)
  for (let c = ROAD_LEFT + 2; c < ROAD_RIGHT - 1; c += 3) {
    setTile(grid, topCenter, c, ROAD_DARK)
  }
  // Bottom straight
  const botCenter = ROAD_BOTTOM - Math.floor(ROAD_W / 2)
  for (let c = ROAD_LEFT + 2; c < ROAD_RIGHT - 1; c += 3) {
    setTile(grid, botCenter, c, ROAD_DARK)
  }
  // Left straight - vertical center line dashes
  const leftCenter = ROAD_LEFT + Math.floor(ROAD_W / 2)
  for (let r = ROAD_TOP + 2; r < ROAD_BOTTOM - 1; r += 3) {
    setTile(grid, r, leftCenter, ROAD_DARK)
  }
  // Right straight
  const rightCenter = ROAD_RIGHT - Math.floor(ROAD_W / 2)
  for (let r = ROAD_TOP + 2; r < ROAD_BOTTOM - 1; r += 3) {
    setTile(grid, r, rightCenter, ROAD_DARK)
  }

  return grid
}

export const GROUND_LAYER = buildGroundLayer()
export const DECOR_LAYER  = buildDecorationLayer()

// Road tile indices used in GROUND_LAYER — used by Player to detect off-road
export const ROAD_TILE_INDICES = new Set([ROAD, ROAD_EDGE, ROAD_DARK])

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
