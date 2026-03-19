import Phaser from 'phaser'
import { ROAD_MASK, TILE_SIZE, TRACK_COLS, TRACK_ROWS } from '../config/trackData'
import type { KartDef } from '../config/karts'

const OFF_ROAD_FACTOR = 0.6   // 60% of max speed when off-road
const TURN_SPEED      = 180   // degrees per second
const DRAG            = 0.85  // velocity damping per frame

/**
 * Returns true if (x, y) is on the road surface using the road mask.
 */
export function isOnRoad(x: number, y: number): boolean {
  const col = Math.floor(x / TILE_SIZE)
  const row = Math.floor(y / TILE_SIZE)
  if (row < 0 || row >= TRACK_ROWS || col < 0 || col >= TRACK_COLS) return false
  return ROAD_MASK[row][col]
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  private kartDef: KartDef
  private currentSpeed = 0
  private heading = -90  // degrees; -90 = facing up initially
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private lastValidX = 0
  private lastValidY = 0

  constructor(scene: Phaser.Scene, x: number, y: number, kart: KartDef) {
    super(scene, x, y, kart.sheet, kart.spriteFrame)
    this.kartDef = kart
    scene.add.existing(this)
    scene.physics.add.existing(this)

    if (kart.tint) this.setTint(kart.tint)
    this.setDepth(10)

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setMaxVelocity(kart.speed, kart.speed)

    this.cursors = scene.input.keyboard!.createCursorKeys()
    this.setAngle(this.heading)

    // Store initial position as last valid
    this.lastValidX = x
    this.lastValidY = y
  }

  setKart(kart: KartDef) {
    this.kartDef = kart
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setMaxVelocity(kart.speed, kart.speed)
    this.setTexture(kart.sheet, kart.spriteFrame)
    if (kart.tint) this.setTint(kart.tint)
    else this.clearTint()
  }

  update(delta: number) {
    const dt = delta / 1000

    // ── Wall collision: push back if off-road ──
    if (!isOnRoad(this.x, this.y)) {
      this.setPosition(this.lastValidX, this.lastValidY)
      this.currentSpeed *= 0.1  // kill most speed on wall hit
      const body = this.body as Phaser.Physics.Arcade.Body
      body.setVelocity(0, 0)
    } else {
      this.lastValidX = this.x
      this.lastValidY = this.y
    }

    const { left, right, up, down } = this.cursors

    // Turning
    if (left.isDown)  this.heading -= TURN_SPEED * dt
    if (right.isDown) this.heading += TURN_SPEED * dt
    this.setAngle(this.heading)

    const maxSpeed = this.kartDef.speed

    // Acceleration / braking
    if (up.isDown) {
      this.currentSpeed = Math.min(this.currentSpeed + maxSpeed * 3 * dt, maxSpeed)
    } else if (down.isDown) {
      this.currentSpeed = Math.max(this.currentSpeed - maxSpeed * 4 * dt, -maxSpeed * 0.4)
    } else {
      // Natural deceleration
      this.currentSpeed *= Math.pow(DRAG, delta / 16)
    }

    // Apply velocity in heading direction
    const rad = Phaser.Math.DegToRad(this.heading)
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setVelocity(
      Math.cos(rad) * this.currentSpeed,
      Math.sin(rad) * this.currentSpeed,
    )
  }
}
