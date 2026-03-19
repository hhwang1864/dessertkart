import Phaser from 'phaser'
import {
  GROUND_LAYER,
  DECOR_LAYER,
  FINISH_LINE,
  TILE_SIZE,
} from '../config/trackData'
import { START_POSITIONS } from '../config/waypoints'
import { getKart } from '../config/karts'
import { Player } from '../objects/Player'
import { AIRacer } from '../objects/AIRacer'
import { RaceManager, ordinalSuffix, formatTime, RACE_DURATION } from '../objects/RaceManager'
import { MusicManager } from '../objects/MusicManager'
import { apiClient } from '../utils/api'
import type { UserProfile } from '../types'

const RACER_IDS = ['player', 'ai1', 'ai2', 'ai3']

// Gas stop on the right straight
const GAS_STOP = { x: 728, y: 280, radius: 28 }
const REFUEL_TIME = 3        // seconds
const REFUEL_COST = 5        // $ per fill-up

// Collision
const BUMP_COOLDOWN = 1000   // ms between bump effects
const BUMP_DISTANCE = 22     // pixels — how close triggers a bump

export class RaceScene extends Phaser.Scene {
  user!: UserProfile
  groundLayer!: Phaser.Tilemaps.TilemapLayer
  decorLayer!: Phaser.Tilemaps.TilemapLayer
  player!: Player
  aiRacers: AIRacer[] = []
  raceManager!: RaceManager
  music!: MusicManager

  // HUD elements
  private hudPos!: Phaser.GameObjects.Text
  private hudTimer!: Phaser.GameObjects.Text
  private hudLap!: Phaser.GameObjects.Text
  private hudFuelBar!: Phaser.GameObjects.Rectangle
  private hudFuelBg!: Phaser.GameObjects.Rectangle
  private hudFuelLabel!: Phaser.GameObjects.Text
  private hudBoost!: Phaser.GameObjects.Text
  private refuelBar!: Phaser.GameObjects.Rectangle
  private refuelBg!: Phaser.GameObjects.Rectangle
  private refuelText!: Phaser.GameObjects.Text

  private countdownText!: Phaser.GameObjects.Text
  private playerFrozen = true
  private raceEnded = false

  // Collision cooldown
  private lastBumpTime = 0

  // Low fuel warning timer
  private fuelWarningCooldown = 0

  constructor() {
    super({ key: 'RaceScene' })
  }

  init(data: { user: UserProfile }) {
    this.user = data.user
  }

  create() {
    this.raceEnded = false
    this.playerFrozen = true
    this.lastBumpTime = 0
    this.fuelWarningCooldown = 0

    this.cameras.main.setBackgroundColor('#d4a574')

    // --- Music manager ---
    this.music = new MusicManager(this)

    // --- Ground layer ---
    const groundMap = this.make.tilemap({ data: GROUND_LAYER, tileWidth: TILE_SIZE, tileHeight: TILE_SIZE })
    const groundTileset = groundMap.addTilesetImage('tiles', 'tiles', TILE_SIZE, TILE_SIZE)!
    this.groundLayer = groundMap.createLayer(0, groundTileset, 0, 0)!

    // --- Decoration layer ---
    const decorMap = this.make.tilemap({ data: DECOR_LAYER, tileWidth: TILE_SIZE, tileHeight: TILE_SIZE })
    const decorTileset = decorMap.addTilesetImage('tiles', 'tiles', TILE_SIZE, TILE_SIZE)!
    this.decorLayer = decorMap.createLayer(0, decorTileset, 0, 0)!

    // --- Finish line ---
    const flW = FINISH_LINE.xEnd - FINISH_LINE.x
    const flH = FINISH_LINE.yEnd - FINISH_LINE.y
    const finishGfx = this.add.graphics()
    finishGfx.lineStyle(2, 0xffffff, 1)
    finishGfx.strokeRect(FINISH_LINE.x, FINISH_LINE.y, flW, flH)
    finishGfx.setDepth(5)
    this.add.text(FINISH_LINE.x + flW / 2, FINISH_LINE.y - 4, 'START / FINISH', {
      fontSize: '7px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5, 1).setDepth(5)

    // --- Gas stop visual ---
    const gasGfx = this.add.graphics()
    gasGfx.fillStyle(0x22cc44, 0.6)
    gasGfx.fillCircle(GAS_STOP.x, GAS_STOP.y, GAS_STOP.radius)
    gasGfx.lineStyle(2, 0x00ff00, 0.8)
    gasGfx.strokeCircle(GAS_STOP.x, GAS_STOP.y, GAS_STOP.radius)
    gasGfx.setDepth(4)
    this.add.text(GAS_STOP.x, GAS_STOP.y - GAS_STOP.radius - 6, 'GAS $5', {
      fontSize: '8px', color: '#00ff00', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(5)

    // --- Player ---
    const kartDef = getKart(this.user.equipped_cart)
    const startPos = START_POSITIONS[0]
    this.player = new Player(this, startPos.x, startPos.y, kartDef)
    this.playerFrozen = true

    // --- AI racers ---
    const baseSpeed = kartDef.speed
    const aiConfigs = [
      { pos: START_POSITIONS[1], sheet: 'enemies', frame: 0,  tint: 0x00ccff, speed: baseSpeed * 0.90 },
      { pos: START_POSITIONS[2], sheet: 'enemies', frame: 4,  tint: 0x00ff88, speed: baseSpeed * 1.00 },
      { pos: START_POSITIONS[3], sheet: 'enemies', frame: 8,  tint: 0xff88ff, speed: baseSpeed * 1.10 },
    ] as const
    this.aiRacers = aiConfigs.map(cfg =>
      new AIRacer(this, cfg.pos.x, cfg.pos.y, cfg.sheet, cfg.frame, cfg.speed, 0, cfg.tint),
    )

    // --- Race manager ---
    this.raceManager = new RaceManager(RACER_IDS)

    // --- HUD ---
    const hudStyle = { fontSize: '14px', color: '#ffffff', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 3 }

    this.hudPos   = this.add.text(12, 12, '1st', hudStyle).setDepth(30)
    this.hudLap   = this.add.text(12, 32, 'Lap 1/2', hudStyle).setDepth(30)
    this.hudTimer = this.add.text(400, 12, formatTime(RACE_DURATION), hudStyle).setOrigin(0.5, 0).setDepth(30)

    // Fuel gauge
    this.hudFuelLabel = this.add.text(12, 54, 'FUEL', { fontSize: '10px', color: '#ffcc00', fontFamily: 'monospace', stroke: '#000', strokeThickness: 2 }).setDepth(30)
    this.hudFuelBg = this.add.rectangle(57, 59, 80, 10, 0x333333).setOrigin(0, 0.5).setDepth(30)
    this.hudFuelBar = this.add.rectangle(57, 59, 80, 10, 0x22cc44).setOrigin(0, 0.5).setDepth(30)

    // Boost counter
    this.hudBoost = this.add.text(12, 72, '', { fontSize: '11px', color: '#ffff00', fontFamily: 'monospace', stroke: '#000', strokeThickness: 2 }).setDepth(30)

    // Refuel progress bar (hidden until refueling)
    this.refuelBg = this.add.rectangle(400, 320, 160, 16, 0x333333, 0.8).setDepth(40).setVisible(false)
    this.refuelBar = this.add.rectangle(400 - 78, 320, 0, 14, 0x22cc44).setOrigin(0, 0.5).setDepth(41).setVisible(false)
    this.refuelText = this.add.text(400, 340, 'REFUELING...', { fontSize: '12px', color: '#22cc44', fontFamily: 'monospace', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5, 0).setDepth(41).setVisible(false)

    // --- Countdown overlay with sounds ---
    this.countdownText = this.add.text(400, 280, '3', {
      fontSize: '72px', color: '#ffff00', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(50)

    // Countdown sequence: 3 → 2 → 1 → GO!
    this.music.playCountdownBeep()
    this.time.addEvent({ delay: 1000, callback: () => {
      this.countdownText.setText('2')
      this.music.playCountdownBeep()
    }})
    this.time.addEvent({ delay: 2000, callback: () => {
      this.countdownText.setText('1')
      this.music.playCountdownBeep()
    }})
    this.time.addEvent({ delay: 3000, callback: () => {
      this.countdownText.setText('GO!')
      this.music.playGoSound()
      this.playerFrozen = false
      // Start driving music & engine
      this.music.startDrivingMusic()
      this.music.startEngine()
    }})
    this.time.addEvent({ delay: 3600, callback: () => { this.countdownText.setVisible(false) } })
  }

  update(_time: number, delta: number) {
    // Karts frozen during countdown
    const racing = this.raceManager?.status === 'racing'

    if (!this.playerFrozen && racing) {
      this.player?.update(delta)
      this._handleFuel(delta)
      this._handleBoost()
      this._handleCollisions()

      // Update engine sound pitch
      this.music.updateEngine(this.player.currentSpeed, this.player['kartDef'].speed)
    }

    if (racing) {
      for (const ai of this.aiRacers) ai.update(delta)
    }

    if (!this.raceManager) return

    // Update race manager with current positions
    this.raceManager.update(delta, [
      { id: 'player', x: this.player.x, y: this.player.y },
      ...this.aiRacers.map((ai, i) => ({ id: `ai${i + 1}`, x: ai.x, y: ai.y })),
    ])

    // Update HUD
    const place = this.raceManager.getPlayerPlace('player')
    this.hudPos.setText(ordinalSuffix(place))
    this.hudTimer.setText(formatTime(this.raceManager.timeLeft))

    const playerState = this.raceManager.racers.find(r => r.id === 'player')
    if (playerState) {
      this.hudLap.setText(`Lap ${Math.min(playerState.lap, 2)}/2`)
    }

    // Fuel gauge
    const fuelRatio = this.player.fuel / this.player.maxFuel
    this.hudFuelBar.width = 80 * Math.max(0, fuelRatio)
    this.hudFuelBar.fillColor = fuelRatio > 0.3 ? 0x22cc44 : fuelRatio > 0.15 ? 0xffaa00 : 0xff3333

    // Boost display
    if (this.user.boosts > 0) {
      this.hudBoost.setText(`BOOST x${this.user.boosts} [SPACE]`)
    } else if (this.player.boostTimeLeft > 0) {
      this.hudBoost.setText(`BOOST ${this.player.boostTimeLeft.toFixed(1)}s`)
    } else {
      this.hudBoost.setText('')
    }

    // Low fuel warning
    if (this.player.fuel < 0.3 && this.player.fuel > 0) {
      this.fuelWarningCooldown -= delta / 1000
      if (this.fuelWarningCooldown <= 0) {
        this.music.playFuelWarning()
        this.fuelWarningCooldown = 3  // warn every 3 seconds
      }
    }

    // Race end
    if (this.raceManager.status === 'finished' && !this.raceEnded) {
      this.raceEnded = true
      this.music.stopAll()
      this.time.addEvent({
        delay: 2000,
        callback: () => {
          const results = this.raceManager.getResults()
          this.scene.start('ResultsScene', { results, user: this.user })
        },
      })
    }
  }

  // ─── Fuel system ───

  private _handleFuel(delta: number) {
    const dt = delta / 1000
    const p = this.player

    // Check if player is at gas stop
    const dx = p.x - GAS_STOP.x
    const dy = p.y - GAS_STOP.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const atGasStop = dist < GAS_STOP.radius

    if (p.refueling) {
      // Progress the refuel bar
      p.refuelProgress += dt / REFUEL_TIME
      this.refuelBar.width = 156 * Math.min(1, p.refuelProgress)
      this.refuelBg.setVisible(true)
      this.refuelBar.setVisible(true)
      this.refuelText.setVisible(true)

      if (p.refuelProgress >= 1) {
        // Done refueling
        p.refueling = false
        p.refuelProgress = 0
        p.fuel = p.maxFuel
        this.refuelBg.setVisible(false)
        this.refuelBar.setVisible(false)
        this.refuelText.setVisible(false)
        this.music.playRefuelDone()
      }
      return
    }

    // Start refueling if at gas stop, fuel not full, and can afford
    if (atGasStop && p.fuel < p.maxFuel * 0.95 && this.user.money >= REFUEL_COST) {
      p.refueling = true
      p.refuelProgress = 0
      p.currentSpeed = 0
      this.music.playRefuelStart()
      // Deduct money
      this.user.money -= REFUEL_COST
      apiClient.post('/api/user/spend-money', { amount: REFUEL_COST }).catch(() => {
        // Rollback on failure (best effort)
        this.user.money += REFUEL_COST
      })
    }
  }

  // ─── Boost system ───

  private _handleBoost() {
    if (this.player.tryActivateBoost(this.user.boosts)) {
      this.user.boosts--
      this.music.playBoost()
      // Persist server-side (fire-and-forget; rollback on failure)
      apiClient.post('/api/user/use-boost', {}).catch(() => {
        this.user.boosts++
      })
    }
  }

  // ─── Collision detection ───

  private _handleCollisions() {
    const now = this.time.now
    if (now - this.lastBumpTime < BUMP_COOLDOWN) return

    for (const ai of this.aiRacers) {
      const dx = this.player.x - ai.x
      const dy = this.player.y - ai.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < BUMP_DISTANCE) {
        // Bump! Slow both down
        this.player.applyBump()
        ai.applyBump()
        this.music.playBump()
        this.lastBumpTime = now

        // Push karts apart slightly
        const angle = Math.atan2(dy, dx)
        const pushDist = (BUMP_DISTANCE - dist) / 2 + 4
        this.player.setPosition(
          this.player.x + Math.cos(angle) * pushDist,
          this.player.y + Math.sin(angle) * pushDist,
        )
        ai.setPosition(
          ai.x - Math.cos(angle) * pushDist,
          ai.y - Math.sin(angle) * pushDist,
        )
        break // one bump per frame
      }
    }
  }
}
