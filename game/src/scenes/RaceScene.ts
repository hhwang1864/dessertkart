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
import type { UserProfile } from '../types'

const RACER_IDS = ['player', 'ai1', 'ai2', 'ai3']

export class RaceScene extends Phaser.Scene {
  user!: UserProfile
  groundLayer!: Phaser.Tilemaps.TilemapLayer
  decorLayer!: Phaser.Tilemaps.TilemapLayer
  player!: Player
  aiRacers: AIRacer[] = []
  raceManager!: RaceManager

  // HUD elements
  private hudPos!: Phaser.GameObjects.Text
  private hudTimer!: Phaser.GameObjects.Text
  private hudLap!: Phaser.GameObjects.Text
  private countdownText!: Phaser.GameObjects.Text
  private playerFrozen = true
  private raceEnded = false

  constructor() {
    super({ key: 'RaceScene' })
  }

  init(data: { user: UserProfile }) {
    this.user = data.user
  }

  create() {
    this.cameras.main.setBackgroundColor('#c2a05a')

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

    // --- Countdown overlay ---
    this.countdownText = this.add.text(400, 280, '3', {
      fontSize: '72px', color: '#ffff00', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(50)

    // Countdown sequence: 3 → 2 → 1 → GO!
    this.time.addEvent({ delay: 1000, callback: () => { this.countdownText.setText('2') } })
    this.time.addEvent({ delay: 2000, callback: () => { this.countdownText.setText('1') } })
    this.time.addEvent({ delay: 3000, callback: () => {
      this.countdownText.setText('GO!')
      this.sound.play('coin-a', { volume: 0.8 })
      this.playerFrozen = false
    }})
    this.time.addEvent({ delay: 3600, callback: () => { this.countdownText.setVisible(false) } })
  }

  update(_time: number, delta: number) {
    // Karts frozen during countdown
    const racing = this.raceManager?.status === 'racing'
    if (!this.playerFrozen && racing) this.player?.update(delta)
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

    // Race end — guard with raceEnded flag to fire only once
    if (this.raceManager.status === 'finished' && !this.raceEnded) {
      this.raceEnded = true
      this.time.addEvent({
        delay: 2000,
        callback: () => {
          const results = this.raceManager.getResults()
          this.scene.start('ResultsScene', { results, user: this.user })
        },
      })
    }
  }
}
