import Phaser from 'phaser'
import { ROAD_MASK, TILE_SIZE, TRACK_COLS, TRACK_ROWS } from '../config/trackData'
import type { KartDef } from '../config/karts'

const OFF_ROAD_FACTOR = 0.6   // 60% of max speed when off-road
const TURN_SPEED      = 180   // degrees per second
const DRAG            = 0.85  // velocity damping per frame

// Fuel
const FUEL_DRAIN_RATE = 0.033  // fuel units per second at max speed

// Boost
const BOOST_DURATION  = 5      // seconds
const BOOST_MULTIPLIER = 2     // 2x speed

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
  currentSpeed = 0
  heading = -90  // degrees; -90 = facing up initially
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private lastValidX = 0
  private lastValidY = 0

  // Fuel system
  fuel = 0
  maxFuel = 1.5
  refueling = false
  refuelProgress = 0   // 0 to 1 (1 = done)

  // Boost system
  boostTimeLeft = 0     // seconds remaining of active boost
  private boostKey!: Phaser.Input.Keyboard.Key

  constructor(scene: Phaser.Scene, x: number, y: number, kart: KartDef) {
    super(scene, x, y, kart.sheet, kart.spriteFrame)
    this.kartDef = kart
    scene.add.existing(this)
    scene.physics.add.existing(this)

    if (kart.tint) this.setTint(kart.tint)
    this.setDepth(10)

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setMaxVelocity(kart.speed * BOOST_MULTIPLIER, kart.speed * BOOST_MULTIPLIER)

    this.cursors = scene.input.keyboard!.createCursorKeys()
    this.boostKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.setAngle(this.heading)

    // Fuel
    this.maxFuel = kart.fuelTank
    this.fuel = this.maxFuel

    // Store initial position as last valid
    this.lastValidX = x
    this.lastValidY = y
  }

  setKart(kart: KartDef) {
    this.kartDef = kart
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setMaxVelocity(kart.speed * BOOST_MULTIPLIER, kart.speed * BOOST_MULTIPLIER)
    this.setTexture(kart.sheet, kart.spriteFrame)
    if (kart.tint) this.setTint(kart.tint)
    else this.clearTint()
    this.maxFuel = kart.fuelTank
  }

  /** Returns true if boost was just activated (caller should decrement inventory). */
  tryActivateBoost(boostsAvailable: number): boolean {
    if (boostsAvailable <= 0) return false
    if (this.boostTimeLeft > 0) return false  // already boosting
    if (Phaser.Input.Keyboard.JustDown(this.boostKey)) {
      this.boostTimeLeft = BOOST_DURATION
      return true
    }
    return false
  }

  update(delta: number) {
    const dt = delta / 1000

    // ── Refueling: freeze kart ──
    if (this.refueling) {
      this.currentSpeed = 0
      const body = this.body as Phaser.Physics.Arcade.Body
      body.setVelocity(0, 0)
      return
    }

    // ── Wall collision: push back if off-road ──
    if (!isOnRoad(this.x, this.y)) {
      this.setPosition(this.lastValidX, this.lastValidY)
      this.currentSpeed *= 0.1
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

    // Boost countdown
    if (this.boostTimeLeft > 0) {
      this.boostTimeLeft = Math.max(0, this.boostTimeLeft - dt)
      // Flash tint while boosting
      this.setTint(Math.random() > 0.5 ? 0xffff00 : 0xffaa00)
    } else if (this.kartDef.tint) {
      this.setTint(this.kartDef.tint)
    } else {
      this.clearTint()
    }

    const speedMultiplier = this.boostTimeLeft > 0 ? BOOST_MULTIPLIER : 1
    const maxSpeed = this.kartDef.speed * speedMultiplier

    // Out of fuel: can't accelerate
    const canAccelerate = this.fuel > 0

    // Acceleration / braking
    if (up.isDown && canAccelerate) {
      this.currentSpeed = Math.min(this.currentSpeed + maxSpeed * 3 * dt, maxSpeed)
    } else if (down.isDown) {
      this.currentSpeed = Math.max(this.currentSpeed - maxSpeed * 4 * dt, -maxSpeed * 0.4)
    } else {
      // Natural deceleration
      this.currentSpeed *= Math.pow(DRAG, delta / 16)
    }

    // Drain fuel based on speed
    if (Math.abs(this.currentSpeed) > 1) {
      const speedRatio = Math.abs(this.currentSpeed) / this.kartDef.speed
      this.fuel = Math.max(0, this.fuel - FUEL_DRAIN_RATE * speedRatio * dt)
    }

    // Apply velocity in heading direction
    const rad = Phaser.Math.DegToRad(this.heading)
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setVelocity(
      Math.cos(rad) * this.currentSpeed,
      Math.sin(rad) * this.currentSpeed,
    )
  }

  /** Called when bumped by another racer. */
  applyBump() {
    this.currentSpeed *= 0.3
  }
}
