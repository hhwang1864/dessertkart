// Track grid: 50 cols × 38 rows @ 16px each = 800×608px
// Path-based track with curves, chicane, and organic shape
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
const SAND       = 54
const SAND2      = 55
const SAND3      = 72
const SAND_LIGHT = 64
const ROAD       = 0
const ROAD_EDGE  = 1
const ROAD_DARK  = 4
const ROAD_V_DARK = 36
const GRASS      = 5
const GRASS2     = 7
const GRASS_DARK = 6
const GRASS_D2   = 9
const WALL       = 11
const WALL2      = 13
const WALL3      = 14
const WALL_DARK  = 16
const WALL_TOP   = 10
const BRICK      = 105
const BRICK2     = 148
const SHADOW     = 44
const DARK       = 77

const EMPTY = -1

// ─── Track centerline path (col, row) in tile coordinates ───
// Defines the shape of the circuit. Road tiles are painted around this path.
const PATH_POINTS: [number, number][] = [
  [8, 30],    // bottom-left
  [14, 30],   // bottom straight
  [20, 30],   // approaching chicane
  [24, 32],   // chicane jog down
  [28, 30],   // chicane jog back up
  [34, 30],   // bottom straight
  [40, 30],   // approaching bottom-right curve
  [44, 27],   // bottom-right curve
  [45, 22],   // right straight
  [45, 16],   // right straight
  [45, 11],   // right straight
  [43, 7],    // top-right curve
  [38, 5],    // top straight
  [32, 4],    // top kink up
  [26, 4],    // top kink
  [20, 5],    // top kink back
  [14, 6],    // top straight
  [8, 7],     // top-left curve
  [5, 11],    // left straight
  [5, 16],    // left straight
  [5, 22],    // left straight
  [6, 27],    // bottom-left curve
  [8, 30],    // close the loop
]

const ROAD_HALF_WIDTH = 2.8  // tiles from centerline to edge

// ─── Geometry helpers ───

/** Distance from point (px,py) to line segment (ax,ay)-(bx,by). */
function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax
  const dy = by - ay
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.sqrt((px - ax) ** 2 + (py - ay) ** 2)
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  const projX = ax + t * dx
  const projY = ay + t * dy
  return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2)
}

/** Minimum distance from a tile-space point to the track centerline polyline. */
function distToPath(px: number, py: number): number {
  let minDist = Infinity
  for (let i = 0; i < PATH_POINTS.length - 1; i++) {
    const [ax, ay] = PATH_POINTS[i]
    const [bx, by] = PATH_POINTS[i + 1]
    const d = distToSegment(px, py, ax, ay, bx, by)
    if (d < minDist) minDist = d
  }
  return minDist
}

// ─── Road mask (boolean grid: true = road tile) ───

function buildRoadMask(): boolean[][] {
  const mask: boolean[][] = []
  for (let r = 0; r < ROWS; r++) {
    mask[r] = []
    for (let c = 0; c < COLS; c++) {
      const dist = distToPath(c + 0.5, r + 0.5)
      mask[r][c] = dist <= ROAD_HALF_WIDTH
    }
  }
  return mask
}

export const ROAD_MASK = buildRoadMask()

// ─── Flood-fill to find track interior (for grass) ───

function findInterior(mask: boolean[][]): boolean[][] {
  const interior: boolean[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(false))
  // Start from a known interior point (center of the loop)
  const startR = 18
  const startC = 25
  const queue: [number, number][] = [[startR, startC]]
  interior[startR][startC] = true

  while (queue.length > 0) {
    const [r, c] = queue.shift()!
    for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nr = r + dr
      const nc = c + dc
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !interior[nr][nc] && !mask[nr][nc]) {
        interior[nr][nc] = true
        queue.push([nr, nc])
      }
    }
  }
  return interior
}

const INTERIOR = findInterior(ROAD_MASK)

// ─── Seeded random for deterministic generation ───

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

// ─── Ground layer ───

function buildGroundLayer(): number[][] {
  const rand = seededRandom(42)
  const sandTiles = [SAND, SAND, SAND, SAND2, SAND3, SAND, SAND2]

  // Fill with varied sand
  const grid = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => sandTiles[Math.floor(rand() * sandTiles.length)])
  )

  // Paint road tiles based on distance to centerline
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (ROAD_MASK[r][c]) {
        const dist = distToPath(c + 0.5, r + 0.5)
        if (dist > ROAD_HALF_WIDTH - 0.6) {
          grid[r][c] = ROAD_EDGE  // outer edge band
        } else if (dist > ROAD_HALF_WIDTH - 0.9) {
          grid[r][c] = ROAD_DARK  // inner edge accent
        } else {
          grid[r][c] = ROAD       // road center
        }
      }
    }
  }

  // Paint grass in interior
  const grassTiles = [GRASS, GRASS, GRASS2, GRASS, GRASS]
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (INTERIOR[r][c]) {
        grid[r][c] = grassTiles[Math.floor(rand() * grassTiles.length)]
      }
    }
  }

  // Grass edges (darker green where grass meets road)
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (INTERIOR[r][c]) {
        let adjRoad = false
        for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
          const nr = r + dr
          const nc = c + dc
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && ROAD_MASK[nr][nc]) {
            adjRoad = true
            break
          }
        }
        if (adjRoad) {
          grid[r][c] = GRASS_DARK
        }
      }
    }
  }

  // Scatter lighter sand patches in sand areas
  for (let i = 0; i < 40; i++) {
    const r = Math.floor(rand() * ROWS)
    const c = Math.floor(rand() * COLS)
    if (!ROAD_MASK[r][c] && !INTERIOR[r][c]) {
      grid[r][c] = SAND_LIGHT
    }
  }

  return grid
}

// ─── Decoration layer ───

function setTile(grid: number[][], row: number, col: number, tile: number) {
  if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
    grid[row][col] = tile
  }
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

function buildDecorationLayer(): number[][] {
  const grid: number[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY))
  const rand = seededRandom(123)

  // ── Finish line (checkerboard pattern on bottom straight, near col 12-13) ──
  for (let r = 28; r <= 33; r++) {
    if (ROAD_MASK[r]?.[12]) {
      grid[r][12] = (r % 2 === 0) ? ROAD : ROAD_V_DARK
    }
    if (ROAD_MASK[r]?.[13]) {
      grid[r][13] = (r % 2 === 0) ? ROAD_V_DARK : ROAD
    }
  }

  // ── Building clusters in outer sand areas ──

  // Top-left
  fillRect(grid, 0, 0, 3, 3, WALL)
  setTile(grid, 0, 0, WALL_TOP)
  setTile(grid, 2, 1, WALL_DARK)

  // Top-right
  fillRect(grid, 0, 47, 3, 3, WALL)
  setTile(grid, 0, 47, WALL_TOP)
  setTile(grid, 2, 48, WALL_DARK)

  // Bottom-left
  fillRect(grid, 35, 0, 3, 3, WALL2)
  setTile(grid, 35, 0, WALL_TOP)
  setTile(grid, 37, 1, WALL_DARK)

  // Bottom-right
  fillRect(grid, 35, 47, 3, 3, WALL3)
  setTile(grid, 35, 47, WALL_TOP)
  setTile(grid, 37, 48, WALL_DARK)

  // Mid-left
  fillRect(grid, 1, 12, 3, 3, WALL2)
  setTile(grid, 1, 12, WALL_TOP)
  setTile(grid, 3, 13, WALL_DARK)

  // Mid-right
  fillRect(grid, 1, 38, 3, 3, WALL3)
  setTile(grid, 1, 38, WALL_TOP)
  setTile(grid, 3, 39, WALL_DARK)

  // ── Shadows under buildings ──
  fillRect(grid, 3, 0, 1, 3, SHADOW)
  fillRect(grid, 3, 47, 1, 3, SHADOW)
  fillRect(grid, 4, 12, 1, 3, SHADOW)

  // ── Brick accents scattered along road outer border ──
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!ROAD_MASK[r][c]) {
        // Check if adjacent to road (outer border)
        let adjRoad = false
        for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
          const nr = r + dr
          const nc = c + dc
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && ROAD_MASK[nr][nc]) {
            adjRoad = true
            break
          }
        }
        if (adjRoad && !INTERIOR[r][c] && rand() < 0.08) {
          grid[r][c] = rand() < 0.5 ? BRICK : BRICK2
        }
      }
    }
  }

  // ── Grass accent patches inside the track ──
  for (let i = 0; i < 12; i++) {
    const r = Math.floor(rand() * ROWS)
    const c = Math.floor(rand() * COLS)
    if (INTERIOR[r][c]) {
      setTile(grid, r, c, GRASS_D2)
    }
  }

  // ── Small structures inside grass (ruins) ──
  // Only place if the area is actually interior
  if (INTERIOR[16]?.[20]) {
    fillRect(grid, 16, 20, 2, 2, WALL)
    setTile(grid, 16, 20, WALL_TOP)
  }
  if (INTERIOR[14]?.[30]) {
    fillRect(grid, 14, 30, 2, 2, WALL3)
  }
  if (INTERIOR[22]?.[24]) {
    fillRect(grid, 22, 24, 2, 2, WALL2)
  }

  // ── Scattered dark spots in sand (rocks/shadows) ──
  const sandSpots: [number, number][] = [
    [1, 6], [1, 25], [2, 44],
    [35, 8], [36, 20], [36, 35],
    [36, 48], [0, 30],
  ]
  for (const [r, c] of sandSpots) {
    if (!ROAD_MASK[r]?.[c] && !INTERIOR[r]?.[c]) {
      setTile(grid, r, c, DARK)
    }
  }

  // ── Road center dashes on straight sections ──
  // Bottom straight (row 30 center, cols ~8-20 and ~28-40)
  for (let c = 9; c <= 19; c += 3) {
    if (ROAD_MASK[30]?.[c]) setTile(grid, 30, c, ROAD_V_DARK)
  }
  for (let c = 29; c <= 39; c += 3) {
    if (ROAD_MASK[30]?.[c]) setTile(grid, 30, c, ROAD_V_DARK)
  }
  // Top straight (row ~5, cols ~20-38)
  for (let c = 15; c <= 37; c += 3) {
    if (ROAD_MASK[5]?.[c]) setTile(grid, 5, c, ROAD_V_DARK)
  }
  // Left straight (col 5, rows ~11-22)
  for (let r = 12; r <= 21; r += 3) {
    if (ROAD_MASK[r]?.[5]) setTile(grid, r, 5, ROAD_V_DARK)
  }
  // Right straight (col 45, rows ~11-22)
  for (let r = 12; r <= 21; r += 3) {
    if (ROAD_MASK[r]?.[45]) setTile(grid, r, 45, ROAD_V_DARK)
  }

  return grid
}

export const GROUND_LAYER = buildGroundLayer()
export const DECOR_LAYER  = buildDecorationLayer()

// Road tile indices used in GROUND_LAYER
export const ROAD_TILE_INDICES = new Set([ROAD, ROAD_EDGE, ROAD_DARK])

// Finish line pixel range (visual marker on bottom straight)
export const FINISH_LINE = {
  x: 12 * 16,      // 192
  xEnd: 14 * 16,   // 224
  y: 28 * 16,      // 448
  yEnd: 33 * 16,   // 528
}

// Grid dimensions
export const TRACK_COLS = COLS
export const TRACK_ROWS = ROWS
export const TILE_SIZE  = 16
