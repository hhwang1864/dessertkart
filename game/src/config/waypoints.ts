// Waypoints for AI pathfinding — pixel coordinates going CLOCKWISE
// Circuit: bottom straight → right → top → left → back
// Road center: left col center = (4+2)*16=96, right col center = (41+2)*16=688
// Top row center = (4+2)*16=96, bottom row center = (29+2)*16=496

export interface Waypoint {
  x: number
  y: number
}

export const WAYPOINTS: Waypoint[] = [
  // Bottom straight (left→right), start near finish line
  { x: 200, y: 496 },
  { x: 320, y: 496 },
  { x: 440, y: 496 },
  { x: 560, y: 496 },
  // Bottom-right corner
  { x: 664, y: 496 },
  // Right straight (bottom→top)
  { x: 664, y: 400 },
  { x: 664, y: 304 },
  { x: 664, y: 208 },
  // Top-right corner
  { x: 664, y: 112 },
  // Top straight (right→left)
  { x: 560, y: 96 },
  { x: 440, y: 96 },
  { x: 320, y: 96 },
  { x: 200, y: 96 },
  // Top-left corner
  { x: 96, y: 112 },
  // Left straight (top→bottom)
  { x: 96, y: 208 },
  { x: 96, y: 304 },
  { x: 96, y: 400 },
  // Bottom-left corner back to start
  { x: 96, y: 496 },
]

// Start positions for racers (bottom straight, staggered)
export const START_POSITIONS = [
  { x: 320, y: 464 },  // player
  { x: 352, y: 480 },  // AI 1
  { x: 288, y: 480 },  // AI 2
  { x: 384, y: 496 },  // AI 3
]

// Index of finish line waypoint (bottom straight, just past finish)
export const FINISH_WAYPOINT_INDEX = 0
