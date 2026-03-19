// Waypoints for AI pathfinding — pixel coordinates going CLOCKWISE
// Follows the curved track centerline with chicane and rounded corners.
// Pixel coords derived from centerline path: (col*16+8, row*16+8)

export interface Waypoint {
  x: number
  y: number
}

export const WAYPOINTS: Waypoint[] = [
  // Bottom straight — past finish line, heading right
  { x: 280, y: 488 },
  // Chicane section
  { x: 392, y: 520 },   // chicane jog down
  { x: 456, y: 488 },   // chicane jog back up
  // Continue bottom straight
  { x: 560, y: 488 },
  { x: 648, y: 488 },
  // Bottom-right curve
  { x: 712, y: 440 },
  // Right straight
  { x: 728, y: 360 },
  { x: 728, y: 264 },
  { x: 728, y: 184 },
  // Top-right curve
  { x: 696, y: 120 },
  // Top straight
  { x: 616, y: 88 },
  // Top kink (slight upward jog)
  { x: 520, y: 72 },
  { x: 424, y: 72 },
  // Continue top
  { x: 328, y: 88 },
  { x: 232, y: 104 },
  // Top-left curve
  { x: 136, y: 120 },
  // Left straight
  { x: 88, y: 200 },
  { x: 88, y: 328 },
  // Bottom-left curve
  { x: 104, y: 440 },
  { x: 168, y: 488 },
]

// Start positions for racers (bottom straight, near finish line)
export const START_POSITIONS = [
  { x: 216, y: 480 },   // player
  { x: 240, y: 496 },   // AI 1
  { x: 192, y: 496 },   // AI 2
  { x: 260, y: 480 },   // AI 3
]

// Index of finish line waypoint (first waypoint, just past finish)
export const FINISH_WAYPOINT_INDEX = 0
