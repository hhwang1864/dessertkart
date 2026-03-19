import Phaser from 'phaser'
import type { UserProfile } from '../types'
import { clearToken } from '../utils/auth'

export class MenuScene extends Phaser.Scene {
  private user!: UserProfile

  constructor() {
    super({ key: 'MenuScene' })
  }

  init(data: { user: UserProfile }) {
    this.user = data.user
  }

  create() {
    const { width, height } = this.scale

    // Desert background
    this.add.rectangle(0, 0, width, height, 0xc2a05a).setOrigin(0)

    // Title
    this.add.text(width / 2, 60, 'DESSERTKART', {
      fontSize: '40px',
      color: '#4a1a7a',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // User info panel
    const panel = this.add.rectangle(width / 2, 130, 400, 70, 0x2d1b4e, 0.85).setOrigin(0.5)
    panel.setStrokeStyle(2, 0x7c3aed)
    this.add.text(width / 2, 115, `Driver: ${this.user.username}`, {
      fontSize: '16px', color: '#e879f9', fontFamily: 'monospace',
    }).setOrigin(0.5)
    this.add.text(width / 2, 138, `Wallet: $${this.user.money}`, {
      fontSize: '18px', color: '#fbbf24', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5)

    // Buttons — stacked vertically
    let btnY = 220
    const gap = 64

    this.createMenuButton(width / 2, btnY, 'RACE', 0x7c3aed, () => {
      this.scene.start('RaceScene', { user: this.user })
    })
    btnY += gap

    this.createMenuButton(width / 2, btnY, 'SHOP', 0x059669, () => {
      this.scene.start('ShopScene', { user: this.user })
    })
    btnY += gap

    this.createMenuButton(width / 2, btnY, 'PROFILE', 0x0e7490, () => {
      this.scene.start('ProfileScene', { user: this.user })
    })
    btnY += gap

    this.createMenuButton(width / 2, btnY, 'LOGOUT', 0x6b7280, () => {
      clearToken()
      this.scene.start('LoginScene')
    })

    // Footer
    this.add.text(width / 2, height - 20, 'Arrow keys to drive • SPACE for boost • Fill up at the gas stop!', {
      fontSize: '10px', color: '#92400e', fontFamily: 'monospace',
    }).setOrigin(0.5)
  }

  private createMenuButton(x: number, y: number, label: string, color: number, onClick: () => void) {
    const btn = this.add.rectangle(x, y, 240, 44, color).setOrigin(0.5).setInteractive({ useHandCursor: true })
    btn.setStrokeStyle(2, 0xffffff)
    const text = this.add.text(x, y, label, {
      fontSize: '18px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5)
    btn.on('pointerover', () => { btn.setAlpha(0.85); text.setAlpha(0.85) })
    btn.on('pointerout', () => { btn.setAlpha(1); text.setAlpha(1) })
    btn.on('pointerdown', onClick)
  }
}
