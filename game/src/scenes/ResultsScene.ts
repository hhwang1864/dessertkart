import Phaser from 'phaser'
import { apiClient } from '../utils/api'
import { ordinalSuffix, formatTime } from '../objects/RaceManager'
import type { UserProfile } from '../types'

export interface RaceResultEntry {
  id: string
  place: number
  finishTime: number | null
  prize: number
}

export class ResultsScene extends Phaser.Scene {
  user!: UserProfile
  results!: RaceResultEntry[]

  constructor() {
    super({ key: 'ResultsScene' })
  }

  init(data: { user: UserProfile; results: RaceResultEntry[] }) {
    this.user = data.user
    this.results = data.results
  }

  async create() {
    this.cameras.main.setBackgroundColor('#1a0a2e')

    // Title
    this.add.text(400, 30, 'RACE RESULTS', {
      fontSize: '28px', color: '#e879f9', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5)

    const playerResult = this.results.find(r => r.id === 'player')!

    // Award prize money
    if (playerResult.prize > 0) {
      try {
        const resp = await apiClient.post('/api/user/add-money', { amount: playerResult.prize })
        this.user.money = (resp as { money: number }).money
      } catch {
        // Ignore — just show local prize
      }
    }

    // Results table
    const names: Record<string, string> = {
      player: this.user.username,
      ai1: 'Cactus Bot',
      ai2: 'Dune Racer',
      ai3: 'Sand Storm',
    }

    const sorted = [...this.results].sort((a, b) => a.place - b.place)
    sorted.forEach((r, i) => {
      const y = 100 + i * 60
      const isPlayer = r.id === 'player'
      const color = isPlayer ? '#ffff00' : '#ffffff'

      this.add.text(80, y, ordinalSuffix(r.place), {
        fontSize: '20px', color, fontFamily: 'monospace', stroke: '#000', strokeThickness: 2,
      })
      this.add.text(160, y, names[r.id] ?? r.id, {
        fontSize: '20px', color, fontFamily: 'monospace', stroke: '#000', strokeThickness: 2,
      })
      const timeStr = r.finishTime !== null ? formatTime(r.finishTime) : '—'
      this.add.text(380, y, timeStr, {
        fontSize: '20px', color, fontFamily: 'monospace', stroke: '#000', strokeThickness: 2,
      })
      if (r.prize > 0) {
        this.add.text(520, y, `+$${r.prize}`, {
          fontSize: '20px', color: '#22ff88', fontFamily: 'monospace', stroke: '#000', strokeThickness: 2,
        })
      }
    })

    // Player summary
    const prize = playerResult.prize
    const summaryColor = prize > 0 ? '#22ff88' : '#ff6666'
    const summaryText = prize > 0
      ? `You earned $${prize}! Total: $${this.user.money}`
      : 'No prize money this time.'
    this.add.text(400, 360, summaryText, {
      fontSize: '16px', color: summaryColor, fontFamily: 'monospace', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5)

    // Sound
    if (prize > 0) {
      this.sound.play('coin-b', { volume: 0.8 })
    } else {
      this.sound.play('lose-a', { volume: 0.8 })
    }

    // Buttons
    this._makeButton(280, 430, 'RACE AGAIN', () => {
      this.scene.start('RaceScene', { user: this.user })
    })
    this._makeButton(520, 430, 'MENU', () => {
      this.scene.start('MenuScene', { user: this.user })
    })
  }

  private _makeButton(x: number, y: number, label: string, onClick: () => void) {
    const bg = this.add.rectangle(x, y, label.length * 14 + 24, 40, 0x2d1b4e)
      .setStrokeStyle(2, 0x7c3aed).setInteractive({ useHandCursor: true })
    const txt = this.add.text(x, y, label, {
      fontSize: '14px', color: '#e879f9', fontFamily: 'monospace',
    }).setOrigin(0.5)

    bg.on('pointerover',  () => { bg.setFillStyle(0x4c1d95); txt.setColor('#ffffff') })
    bg.on('pointerout',   () => { bg.setFillStyle(0x2d1b4e); txt.setColor('#e879f9') })
    bg.on('pointerdown',  onClick)
  }
}
