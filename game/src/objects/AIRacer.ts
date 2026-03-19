import Phaser from 'phaser'
import { WAYPOINTS } from '../config/waypoints'
import { isOnRoad } from './Player'

const WAYPOINT_RADIUS   = 32   // pixels — advance to next wp when within this distance
const TURN_SPEED        = 200  // degrees per second

/** Pure helper: returns the heading delta (degrees) needed to steer toward a target. */
export function steerToward(
  headingDeg: number,
  pos: { x: number; y: number },
  target: { x: number; y: number },
  _turnSpeed: number,
  _delta: number,
): number {
  const angleRad = Phaser.Math.Angle.BetweenPoints(pos, target)
  const targetDeg = Phaser.Math.RadToDeg(angleRad)
  return Phaser.Math.Angle.ShortestBetween(headingDeg, targetDeg)
}

export class AIRacer extends Phaser.Physics.Arcade.Sprite {
  private speed: number
  private heading = -90   // degrees
  private currentSpeed = 0
  private waypointIndex: number
  private lastValidX = 0
  private lastValidY = 0

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    sheet: string,
    frame: number,
    speed: number,
    startWaypointIndex = 0,
    tint?: number,
  ) {
    super(scene, x, y, sheet, frame)
    this.speed = speed
    this.waypointIndex = startWaypointIndex

    scene.add.existing(this)
    scene.physics.add.existing(this)
    if (tint) this.setTint(tint)
    this.setDepth(9)

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setMaxVelocity(speed * 1.1, speed * 1.1)

    this.lastValidX = x
    this.lastValidY = y
  }

  update(delta: number) {
    const dt = delta / 1000

    // ── Wall collision: push back if off-road ──
    if (!isOnRoad(this.x, this.y)) {
      this.setPosition(this.lastValidX, this.lastValidY)
      this.currentSpeed *= 0.3
      const body = this.body as Phaser.Physics.Arcade.Body
      body.setVelocity(0, 0)
    } else {
      this.lastValidX = this.x
      this.lastValidY = this.y
    }

    const target = WAYPOINTS[this.waypointIndex]

    // Advance waypoint when close enough
    const dx = target.x - this.x
    const dy = target.y - this.y
    if (Math.sqrt(dx * dx + dy * dy) < WAYPOINT_RADIUS) {
      this.waypointIndex = (this.waypointIndex + 1) % WAYPOINTS.length
    }

    // Steer toward current waypoint
    const diff = steerToward(this.heading, { x: this.x, y: this.y }, target, TURN_SPEED, delta)
    const maxTurn = TURN_SPEED * dt
    this.heading += Math.max(-maxTurn, Math.min(maxTurn, diff))
    this.setAngle(this.heading)

    // Speed (no off-road penalty needed since walls prevent leaving)
    const maxSpeed = this.speed
    this.currentSpeed = Math.min(this.currentSpeed + maxSpeed * 2.5 * dt, maxSpeed)

    const rad = Phaser.Math.DegToRad(this.heading)
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setVelocity(
      Math.cos(rad) * this.currentSpeed,
      Math.sin(rad) * this.currentSpeed,
    )
  }

  getCurrentWaypointIndex() {
    return this.waypointIndex
  }

  /** Called when bumped by another racer. */
  applyBump() {
    this.currentSpeed *= 0.3
  }
}
